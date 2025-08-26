# registrations/views.py
from __future__ import annotations
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Registration
from .serializers import (
    RegistrationSerializer, RegistrationCreateSerializer, RegistrationUpdateSerializer,
    RegistrationListSerializer
)
from .permissions import IsOrganizerOrAdmin

class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.select_related("user", "event", "division").all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'registration_type', 'event', 'division', 'is_paid']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'team_name']
    ordering_fields = ['created_at', 'updated_at', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return RegistrationCreateSerializer
        elif self.action in ['update', 'partial_update'] and self.request.user.role in ['ORGANIZER', 'ADMIN']:
            return RegistrationUpdateSerializer
        elif self.action == 'list':
            return RegistrationListSerializer
        return RegistrationSerializer

    def get_permissions(self):
        if self.action in {'approve', 'reject', 'destroy'}:
            return [IsOrganizerOrAdmin()]
        elif self.action in {'update', 'partial_update'}:
            return [permissions.IsAuthenticated()]
        elif self.action in {'create'}:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by event if specified
        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        # Organizers can see registrations for their events
        if self.request.user.is_authenticated and self.request.user.role == 'ORGANIZER':
            if self.action in ['list', 'retrieve']:
                queryset = queryset.filter(event__created_by=self.request.user)
        
        # Users can see their own registrations
        if self.action in ['list', 'retrieve'] and self.request.user.is_authenticated:
            if self.request.user.role not in ['ORGANIZER', 'ADMIN']:
                queryset = queryset.filter(user=self.request.user)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsOrganizerOrAdmin])
    def approve(self, request, pk=None):
        """Approve a registration"""
        registration = self.get_object()
        
        if registration.approve(request.user):
            return Response({
                'detail': 'Registration approved successfully',
                'status': registration.status
            })
        else:
            return Response({
                'detail': 'Registration cannot be approved. Check requirements.',
                'required_documents_complete': registration.required_documents_complete,
                'is_paid': registration.is_paid
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsOrganizerOrAdmin])
    def reject(self, request, pk=None):
        """Reject a registration"""
        registration = self.get_object()
        reason = request.data.get('reason', '')
        
        registration.reject(request.user, reason)
        return Response({
            'detail': 'Registration rejected',
            'status': registration.status,
            'reason': reason
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def withdraw(self, request, pk=None):
        """Withdraw a registration (participant only)"""
        registration = self.get_object()
        
        # Only the participant can withdraw their own registration
        if registration.user != request.user:
            return Response(
                {'detail': 'You can only withdraw your own registrations'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if registration.withdraw():
            return Response({
                'detail': 'Registration withdrawn successfully',
                'status': registration.status
            })
        else:
            return Response({
                'detail': 'Registration cannot be withdrawn in current status'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_registrations(self, request):
        """Get current user's registrations"""
        registrations = self.get_queryset().filter(user=request.user)
        serializer = RegistrationListSerializer(registrations, many=True)
        return Response(serializer.data)

    # Document functionality temporarily commented out for migration
    # @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    # def upload_document(self, request, pk=None):
    #     """Upload a document for this registration"""
    #     registration = self.get_object()
    #     
    #     # Only the participant can upload documents for their registration
    #     if registration.user != request.user:
    #         return Response(
    #             {'detail': 'You can only upload documents for your own registrations'}, 
    #             status=status.HTTP_403_FORBIDDEN
    #         )
    #     
    #     serializer = DocumentUploadSerializer(data=request.data)
    #     if serializer.is_valid():
    #         serializer.save(registration=registration)
    #         return Response(serializer.data, status=status.HTTP_201_CREATED)
    #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Document functionality temporarily commented out for migration
# class DocumentViewSet(viewsets.ReadOnlyModelViewSet):
#     """ViewSet for document management"""
#     queryset = Document.objects.select_related('registration__user', 'registration__event').all()
#     serializer_class = DocumentSerializer
#     permission_classes = [permissions.IsAuthenticated]
#     filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
#     filterset_fields = ['document_type', 'status', 'registration']
#     ordering = ['-uploaded_at']

#     def get_queryset(self):
#         queryset = super().get_queryset()
        
#         # Users can only see their own documents
#         if self.request.user.role not in ['ORGANIZER', 'ADMIN']:
#             queryset = queryset.filter(registration__user=self.request.user)
#         # Organizers can see documents for their events
#         elif self.request.user.role == 'ORGANIZER':
#             queryset = queryset.filter(registration__event__created_by=self.request.user)
        
#         return queryset

#     @action(detail=True, methods=['get'])
#     def download(self, request, pk=None):
#         """Secure document download"""
#         document = self.get_object()
        
#         # Check permissions
#         if (document.registration.user != request.user and 
#             request.user.role not in ['ORGANIZER', 'ADMIN'] and
#             (request.user.role == 'ORGANIZER' and document.registration.event.created_by != request.user)):
#             return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
#         try:
#             response = HttpResponse(document.file.read(), content_type=document.content_type)
#             response['Content-Disposition'] = f'attachment; filename="{document.original_filename}"'
#             return response
#         except FileNotFoundError:
#             raise Http404("Document file not found")

#     @action(detail=True, methods=['post'], permission_classes=[IsOrganizerOrAdmin])
#     def approve_document(self, request, pk=None):
#         """Approve a document"""
#         document = self.get_object()
#         notes = request.data.get('notes', '')
        
#         document.status = Document.Status.APPROVED
#         document.reviewed_by = request.user
#         document.reviewed_at = timezone.now()
#         document.review_notes = notes
#         document.save()
        
#         return Response({
#             'detail': 'Document approved',
#             'status': document.status
#         })

#     @action(detail=True, methods=['post'], permission_classes=[IsOrganizerOrAdmin])
#     def reject_document(self, request, pk=None):
#         """Reject a document"""
#         document = self.get_object()
#         notes = request.data.get('notes', '')
        
#         document.status = Document.Status.REJECTED
#         document.reviewed_by = request.user
#         document.reviewed_at = timezone.now()
#         document.review_notes = notes
#         document.save()
        
#         return Response({
#             'detail': 'Document rejected',
#             'status': document.status,
#             'notes': notes
#         })

# Secure document download view (using access token) - temporarily commented out
def secure_document_download(request, token):
    """Download document using secure access token - temporarily disabled"""
    return HttpResponse("Document functionality temporarily disabled", status=503)
