"""
Media Hub views for REST API endpoints.
Implements CRUD operations, moderation actions, and public gallery.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import MediaItem
from .serializers import (
    MediaItemSerializer, MediaItemCreateSerializer, MediaItemUpdateSerializer,
    MediaItemPublicSerializer, MediaModerationSerializer, MediaShareSerializer
)
from .permissions import (
    CanUploadMedia, CanViewMedia, CanModerateMedia, CanEditMedia, CanDeleteMedia,
    PublicMediaReadOnly
)
from .services.storage import validate_media_file
from .services.thumbnails import generate_thumbnail_for_media


class MediaItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for media item CRUD operations and moderation.
    """
    queryset = MediaItem.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['kind', 'status', 'featured', 'event', 'fixture', 'uploader']
    search_fields = ['title', 'description', 'uploader__email', 'uploader__first_name', 'uploader__last_name']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return MediaItemCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return MediaItemUpdateSerializer
        else:
            return MediaItemSerializer
    
    def get_permissions(self):
        """Return appropriate permissions based on action"""
        if self.action == 'create':
            permission_classes = [IsAuthenticated, CanUploadMedia]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [CanViewMedia]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, CanEditMedia]
        elif self.action == 'destroy':
            permission_classes = [IsAuthenticated, CanDeleteMedia]
        elif self.action in ['approve', 'reject', 'hide', 'feature']:
            permission_classes = [IsAuthenticated, CanModerateMedia]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        queryset = super().get_queryset()
        
        # If user is not authenticated, only show approved media
        if not self.request.user.is_authenticated:
            return queryset.filter(status=MediaItem.Status.APPROVED)
        
        # If user is authenticated but not staff/organizer, show their own + approved
        if not (self.request.user.is_staff or self.request.user.role == 'ORGANIZER'):
            return queryset.filter(
                Q(uploader=self.request.user) | Q(status=MediaItem.Status.APPROVED)
            )
        
        # Staff and organizers can see all media
        return queryset
    
    def perform_create(self, serializer):
        """Create media item with file validation and thumbnail generation"""
        # Validate file
        file_obj = serializer.validated_data.get('file')
        if file_obj:
            try:
                kind, mime_type = validate_media_file(file_obj)
                serializer.validated_data['kind'] = kind
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Save the media item
        media_item = serializer.save(uploader=self.request.user)
        
        # Generate thumbnail for images
        if media_item.kind == 'photo':
            generate_thumbnail_for_media(media_item)
    
    def perform_update(self, serializer):
        """Update media item with permission checks"""
        instance = self.get_object()
        
        # Check if user can edit this media
        if not instance.can_edit(self.request.user):
            return Response(
                {'error': 'Insufficient permissions to edit this media'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete media item with permission checks"""
        if not instance.can_delete(self.request.user):
            return Response(
                {'error': 'Insufficient permissions to delete this media'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a media item (moderator only)"""
        media_item = self.get_object()
        
        if not media_item.can_moderate(request.user):
            return Response(
                {'error': 'Insufficient permissions to approve this media'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        media_item.status = MediaItem.Status.APPROVED
        media_item.save()
        
        serializer = self.get_serializer(media_item)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a media item (moderator only)"""
        media_item = self.get_object()
        
        if not media_item.can_moderate(request.user):
            return Response(
                {'error': 'Insufficient permissions to reject this media'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = MediaModerationSerializer(data=request.data)
        if serializer.is_valid():
            reason = serializer.validated_data.get('reason', '')
            
            media_item.status = MediaItem.Status.REJECTED
            media_item.save()
            
            # TODO: Log rejection reason for audit trail
            # Could add a MediaModerationLog model for this
            
            response_serializer = self.get_serializer(media_item)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def hide(self, request, pk=None):
        """Hide a media item (moderator only)"""
        media_item = self.get_object()
        
        if not media_item.can_moderate(request.user):
            return Response(
                {'error': 'Insufficient permissions to hide this media'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        media_item.status = MediaItem.Status.HIDDEN
        media_item.save()
        
        serializer = self.get_serializer(media_item)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def feature(self, request, pk=None):
        """Toggle featured status of a media item (moderator only)"""
        media_item = self.get_object()
        
        if not media_item.can_moderate(request.user):
            return Response(
                {'error': 'Insufficient permissions to feature this media'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        media_item.featured = not media_item.featured
        media_item.save()
        
        serializer = self.get_serializer(media_item)
        return Response(serializer.data)


class PublicMediaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public viewset for approved media gallery.
    Read-only access to approved media only.
    """
    serializer_class = MediaItemPublicSerializer
    permission_classes = [PublicMediaReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['kind', 'featured', 'event', 'fixture']
    search_fields = ['title', 'description', 'uploader__display_name']
    ordering_fields = ['created_at', 'title']
    ordering = ['-featured', '-created_at']
    
    def get_queryset(self):
        """Return only approved media for public gallery"""
        return MediaItem.objects.filter(
            status=MediaItem.Status.APPROVED
        ).select_related('uploader', 'event', 'fixture')


class MediaShareViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for media share information.
    Returns canonical share URLs and suggested share text.
    """
    serializer_class = MediaShareSerializer
    permission_classes = [PublicMediaReadOnly]
    
    def get_queryset(self):
        """Return only approved media for sharing"""
        return MediaItem.objects.filter(
            status=MediaItem.Status.APPROVED
        ).select_related('uploader', 'event', 'fixture')
    
    def retrieve(self, request, pk=None):
        """Get share information for a specific media item"""
        media_item = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = self.get_serializer(media_item)
        return Response(serializer.data)