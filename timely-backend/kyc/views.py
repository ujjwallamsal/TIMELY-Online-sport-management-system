# kyc/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import KycProfile, KycDocument
from .serializers import (
    KycProfileSerializer, KycProfileCreateSerializer, 
    KycDocumentSerializer, KycProfileReviewSerializer
)
from common.models import AuditLog
from accounts.permissions import IsAdmin
from notifications.services import NotificationService
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class KycProfileViewSet(viewsets.ModelViewSet):
    """KYC profile management"""
    serializer_class = KycProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get KYC profiles based on user permissions"""
        if self.request.user.is_superuser:
            return KycProfile.objects.all().select_related('user', 'reviewed_by')
        return KycProfile.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return KycProfileCreateSerializer
        return KycProfileSerializer
    
    def get_object(self):
        """Get KYC profile for current user or by ID for admins"""
        if self.request.user.is_superuser and 'pk' in self.kwargs:
            return get_object_or_404(KycProfile, pk=self.kwargs['pk'])
        return get_object_or_404(KycProfile, user=self.request.user)
    
    def perform_create(self, serializer):
        """Create KYC profile for current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def submit(self, request):
        """Submit KYC profile for review"""
        try:
            kyc_profile = KycProfile.objects.get(user=request.user)
            if kyc_profile.status not in ['unverified', 'rejected']:
                return Response(
                    {'error': 'KYC profile is already submitted or reviewed'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if required documents are uploaded
            required_docs = ['id_front', 'id_back']
            uploaded_docs = kyc_profile.documents.values_list('document_type', flat=True)
            missing_docs = [doc for doc in required_docs if doc not in uploaded_docs]
            
            if missing_docs:
                return Response(
                    {'error': f'Missing required documents: {", ".join(missing_docs)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            kyc_profile.submit_for_review()
            
            # Log audit event
            AuditLog.log_action(
                user=request.user,
                action=AuditLog.ActionType.CREATE,
                resource_type='KYC Profile',
                resource_id=str(kyc_profile.pk),
                details={'action': 'submitted_for_review'},
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response(
                {'message': 'KYC profile submitted for review'},
                status=status.HTTP_200_OK
            )
        except KycProfile.DoesNotExist:
            return Response(
                {'error': 'KYC profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def review(self, request, pk=None):
        """Admin review of KYC profile"""
        kyc_profile = self.get_object()
        serializer = KycProfileReviewSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        notes = serializer.validated_data.get('notes', '')
        reason = serializer.validated_data.get('reason', '')
        
        with transaction.atomic():
            if action == 'approve':
                kyc_profile.approve(request.user, notes)
                audit_action = AuditLog.ActionType.KYC_APPROVED
            elif action == 'waive':
                kyc_profile.waive(request.user, notes)
                audit_action = AuditLog.ActionType.KYC_APPROVED
            elif action == 'reject':
                kyc_profile.reject(request.user, reason)
                audit_action = AuditLog.ActionType.KYC_REJECTED
            
            # Log audit event
            AuditLog.log_action(
                user=request.user,
                action=audit_action,
                resource_type='KYC Profile',
                resource_id=str(kyc_profile.pk),
                details={
                    'target_user': kyc_profile.user.email,
                    'action': action,
                    'notes': notes,
                    'reason': reason
                },
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            # Send notification to user
            if action == 'approve':
                NotificationService.send_notification(
                    user=kyc_profile.user,
                    title="KYC Verification Approved",
                    message="Your KYC verification has been approved. You can now proceed with role requests.",
                    notification_type="kyc_approved"
                )
            elif action == 'waive':
                NotificationService.send_notification(
                    user=kyc_profile.user,
                    title="KYC Requirement Waived",
                    message="KYC verification requirement has been waived for your account.",
                    notification_type="kyc_waived"
                )
            elif action == 'reject':
                NotificationService.send_notification(
                    user=kyc_profile.user,
                    title="KYC Verification Rejected",
                    message=f"Your KYC verification was rejected. Reason: {reason}",
                    notification_type="kyc_rejected"
                )
            
            # Broadcast user update via WebSocket
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{kyc_profile.user.id}",
                {
                    'type': 'user.updated',
                    'user_id': kyc_profile.user.id,
                    'kyc_status': kyc_profile.status
                }
            )
        
        return Response(
            {'message': f'KYC profile {action}d successfully'},
            status=status.HTTP_200_OK
        )


class KycDocumentViewSet(viewsets.ModelViewSet):
    """KYC document upload management"""
    serializer_class = KycDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        """Get documents for current user's KYC profile"""
        try:
            kyc_profile = KycProfile.objects.get(user=self.request.user)
            return kyc_profile.documents.all()
        except KycProfile.DoesNotExist:
            return KycDocument.objects.none()
    
    def perform_create(self, serializer):
        """Create document for current user's KYC profile"""
        kyc_profile, created = KycProfile.objects.get_or_create(
            user=self.request.user
        )
        serializer.save(kyc_profile=kyc_profile)
    
    def perform_destroy(self, instance):
        """Delete document if KYC profile is not submitted"""
        if instance.kyc_profile.status in ['pending', 'verified', 'waived']:
            return Response(
                {'error': 'Cannot delete documents from submitted KYC profile'},
                status=status.HTTP_400_BAD_REQUEST
            )
        instance.delete()