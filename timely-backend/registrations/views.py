"""
Views for registration management
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q

from .models import Registration, RegistrationDocument
from .serializers import (
    RegistrationListSerializer, RegistrationDetailSerializer, RegistrationCreateSerializer,
    RegistrationWithdrawSerializer, RegistrationStatusActionSerializer,
    RegistrationDocumentUploadSerializer, RegistrationDocumentSerializer,
    PaymentIntentSerializer, PaymentConfirmSerializer
)
from .permissions import (
    IsRegistrationOwnerOrReadOnly, IsRegistrationOwner, IsEventOrganizerOrAdmin,
    IsRegistrationOwnerOrEventOrganizerOrAdmin, CanCreateRegistration, CanManageRegistration
)
from .services.payments import create_payment_intent, confirm_payment, get_payment_status
from .services.notifications import (
    send_registration_confirmation, send_payment_confirmation, 
    send_status_update, send_organizer_notification
)


class RegistrationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for registration management
    """
    queryset = Registration.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'event', 'type']
    search_fields = ['team_name', 'user__email', 'user__first_name', 'user__last_name']
    ordering_fields = ['submitted_at', 'status', 'payment_status']
    ordering = ['-submitted_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return RegistrationListSerializer
        elif self.action == 'create':
            return RegistrationCreateSerializer
        else:
            return RegistrationDetailSerializer

    def get_permissions(self):
        """Return appropriate permissions based on action"""
        if self.action == 'create':
            permission_classes = [IsAuthenticated, CanCreateRegistration]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsRegistrationOwnerOrReadOnly]
        elif self.action in ['withdraw']:
            permission_classes = [IsAuthenticated, IsRegistrationOwner]
        elif self.action in ['approve', 'reject', 'waitlist', 'request_reupload']:
            permission_classes = [IsAuthenticated, CanManageRegistration]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Filter queryset based on user role and permissions"""
        user = self.request.user
        
        if self.action == 'mine':
            # Return only user's own registrations
            return Registration.objects.filter(user=user)
        elif user.role == 'ADMIN':
            # Admin can see all registrations
            return Registration.objects.all()
        elif user.role == 'ORGANIZER':
            # Organizer can see registrations for their events
            return Registration.objects.filter(event__created_by=user)
        else:
            # Regular users can only see their own registrations
            return Registration.objects.filter(user=user)
    
    def create(self, request, *args, **kwargs):
        """Create a new registration"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        registration = serializer.save()
        
        # Send confirmation notification
        send_registration_confirmation(registration)
        send_organizer_notification(registration, 'created')
        
        return Response(
            RegistrationDetailSerializer(registration).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def mine(self, request):
        """Get current user's registrations"""
        registrations = self.get_queryset()
        page = self.paginate_queryset(registrations)
        
        if page is not None:
            serializer = RegistrationListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = RegistrationListSerializer(registrations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def withdraw(self, request, pk=None):
        """Withdraw a registration"""
        registration = self.get_object()
        serializer = RegistrationWithdrawSerializer(
            data=request.data,
            context={'registration': registration}
        )
        serializer.is_valid(raise_exception=True)
        
        old_status = registration.status
        registration.status = 'withdrawn'
        registration.reason = serializer.validated_data.get('reason', '')
        registration.decided_at = timezone.now()
        registration.decided_by = request.user
        registration.save()
        
        # Send notifications
        send_status_update(registration, old_status, 'withdrawn')
        send_organizer_notification(registration, 'withdrawn')
        
        return Response(RegistrationDetailSerializer(registration).data)
    
    @action(detail=True, methods=['patch'])
    def approve(self, request, pk=None):
        """Approve a registration"""
        registration = self.get_object()
        serializer = RegistrationStatusActionSerializer(
            data=request.data,
            context={'registration': registration, 'action': 'approve'}
        )
        serializer.is_valid(raise_exception=True)
        
        old_status = registration.status
        registration.status = 'confirmed'
        registration.decided_at = timezone.now()
        registration.decided_by = request.user
        registration.reason = serializer.validated_data.get('reason', '')
        registration.save()
        
        # Send notifications
        send_status_update(registration, old_status, 'confirmed')
        
        return Response(RegistrationDetailSerializer(registration).data)
    
    @action(detail=True, methods=['patch'])
    def reject(self, request, pk=None):
        """Reject a registration"""
        registration = self.get_object()
        serializer = RegistrationStatusActionSerializer(
            data=request.data,
            context={'registration': registration, 'action': 'reject'}
        )
        serializer.is_valid(raise_exception=True)
        
        old_status = registration.status
        registration.status = 'rejected'
        registration.decided_at = timezone.now()
        registration.decided_by = request.user
        registration.reason = serializer.validated_data.get('reason', '')
        registration.save()
        
        # Send notifications
        send_status_update(registration, old_status, 'rejected')
        
        return Response(RegistrationDetailSerializer(registration).data)
    
    @action(detail=True, methods=['patch'])
    def waitlist(self, request, pk=None):
        """Waitlist a registration"""
        registration = self.get_object()
        serializer = RegistrationStatusActionSerializer(
            data=request.data,
            context={'registration': registration, 'action': 'waitlist'}
        )
        serializer.is_valid(raise_exception=True)
        
        old_status = registration.status
        registration.status = 'waitlisted'
        registration.decided_at = timezone.now()
        registration.decided_by = request.user
        registration.reason = serializer.validated_data.get('reason', '')
        registration.save()
        
        # Send notifications
        send_status_update(registration, old_status, 'waitlisted')
        
        return Response(RegistrationDetailSerializer(registration).data)
    
    @action(detail=True, methods=['patch'])
    def request_reupload(self, request, pk=None):
        """Request document reupload"""
        registration = self.get_object()
        serializer = RegistrationStatusActionSerializer(
            data=request.data,
            context={'registration': registration, 'action': 'request_reupload'}
        )
        serializer.is_valid(raise_exception=True)
        
        # Add note to registration
        registration.reason = serializer.validated_data.get('reason', '')
        registration.save()
        
        # Send notification
        send_organizer_notification(registration, 'reupload_requested')
        
        return Response(RegistrationDetailSerializer(registration).data)
    
    @action(detail=True, methods=['post'])
    def pay_intent(self, request, pk=None):
        """Create payment intent for registration"""
        registration = self.get_object()
        serializer = PaymentIntentSerializer(
            data=request.data,
            context={'registration': registration}
        )
        serializer.is_valid(raise_exception=True)
        
        try:
            payment_data = create_payment_intent(registration)
            return Response(payment_data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def pay_confirm(self, request, pk=None):
        """Confirm payment for registration"""
        registration = self.get_object()
        serializer = PaymentConfirmSerializer(
            data=request.data,
            context={'registration': registration}
        )
        serializer.is_valid(raise_exception=True)
        
        try:
            payment_data = confirm_payment(
                registration,
                serializer.validated_data['client_secret']
            )
            
            # Send payment confirmation
            send_payment_confirmation(registration)
            
            return Response(payment_data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def payment_status(self, request, pk=None):
        """Get payment status for registration"""
        registration = self.get_object()
        payment_data = get_payment_status(registration)
        return Response(payment_data)


class RegistrationDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for registration document management
    """
    queryset = RegistrationDocument.objects.all()
    permission_classes = [IsAuthenticated, IsRegistrationOwnerOrEventOrganizerOrAdmin]
    serializer_class = RegistrationDocumentSerializer
    
    def get_queryset(self):
        """Filter documents by registration"""
        registration_id = self.kwargs.get('registration_pk')
        if registration_id:
            return RegistrationDocument.objects.filter(registration_id=registration_id)
        return RegistrationDocument.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return RegistrationDocumentUploadSerializer
        return RegistrationDocumentSerializer
    
    def create(self, request, *args, **kwargs):
        """Upload a document for registration"""
        registration_id = self.kwargs.get('registration_pk')
        try:
            registration = Registration.objects.get(id=registration_id)
        except Registration.DoesNotExist:
            return Response(
                {'error': 'Registration not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(
            data=request.data,
            context={'registration': registration}
        )
        serializer.is_valid(raise_exception=True)
        document = serializer.save()
        
        return Response(
            RegistrationDocumentSerializer(document).data,
            status=status.HTTP_201_CREATED
        )