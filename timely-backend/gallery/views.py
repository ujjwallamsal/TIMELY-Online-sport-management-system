from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Album, MediaAsset, Media, GalleryAlbum, GalleryMedia
from .serializers import (
    AlbumSerializer, MediaAssetSerializer, MediaSerializer,
    MediaUploadSerializer, MediaModerationSerializer, PublicMediaSerializer,
    GalleryAlbumSerializer, GalleryMediaSerializer,
    PublicGalleryAlbumSerializer, PublicGalleryMediaSerializer
)
from .permissions import IsOrganizerOrAdminOrReadOnly

# Private/managed endpoints (organizers/admins can create/update/delete)
class AlbumViewSet(viewsets.ModelViewSet):
    queryset = Album.objects.select_related("event", "match", "created_by")
    serializer_class = AlbumSerializer
    permission_classes = [IsOrganizerOrAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["event", "match", "is_public"]
    search_fields = ["title", "description", "event__name", "match__id"]
    ordering_fields = ["created_at", "title"]
    ordering = ["-created_at"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class MediaAssetViewSet(viewsets.ModelViewSet):
    queryset = MediaAsset.objects.select_related("album", "uploaded_by", "album__event", "album__match")
    serializer_class = MediaAssetSerializer
    permission_classes = [IsOrganizerOrAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["album", "album__event", "album__match", "kind", "is_public"]
    search_fields = ["caption", "album__title", "album__event__name"]
    ordering_fields = ["uploaded_at"]
    ordering = ["-uploaded_at"]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


# Public read-only endpoints (FR48 gallery browsing)
class PublicAlbumViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Album.objects.filter(is_public=True).select_related("event", "match", "created_by")
    serializer_class = AlbumSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["event", "match"]
    search_fields = ["title", "description", "event__name"]
    ordering_fields = ["created_at", "title"]
    ordering = ["-created_at"]

class PublicMediaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MediaAsset.objects.filter(is_public=True, album__is_public=True)\
                                 .select_related("album", "uploaded_by", "album__event", "album__match")
    serializer_class = MediaAssetSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["album", "album__event", "album__match", "kind"]
    search_fields = ["caption", "album__title", "album__event__name"]
    ordering_fields = ["uploaded_at"]
    ordering = ["-uploaded_at"]

class IsOrganizerOrAdmin(permissions.BasePermission):
    """Permission for organizers and admins only"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["ORGANIZER", "ADMIN"]


class MediaUploadViewSet(viewsets.ModelViewSet):
    """ViewSet for media upload and management"""
    queryset = Media.objects.select_related('event', 'uploaded_by')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event', 'media_type', 'is_approved']
    search_fields = ['caption', 'event__name']
    ordering_fields = ['created_at', 'caption']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return MediaUploadSerializer
        return MediaSerializer

    def get_queryset(self):
        """Filter media based on user permissions"""
        if self.request.user.role in ['ADMIN', 'ORGANIZER']:
            return self.queryset.all()
        # Regular users can only see their own media
        return self.queryset.filter(uploaded_by=self.request.user)

    def perform_create(self, serializer):
        """Set uploaded_by to current user"""
        serializer.save(uploaded_by=self.request.user)

    @action(detail=True, methods=['patch'], permission_classes=[IsOrganizerOrAdmin])
    def moderate(self, request, pk=None):
        """Moderate media (approve/reject) - admin/organizer only"""
        media = self.get_object()
        is_approved = request.data.get('is_approved')
        
        if is_approved not in [True, False]:
            return Response(
                {'error': 'Invalid is_approved. Must be true or false'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        media.is_approved = is_approved
        media.save()
        
        serializer = MediaModerationSerializer(media, context={'request': request})
        return Response(serializer.data)


class MediaModerationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for media moderation (admin/organizer only)"""
    queryset = Media.objects.select_related('event', 'uploaded_by')
    serializer_class = MediaModerationSerializer
    permission_classes = [IsOrganizerOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event', 'media_type', 'is_approved']
    search_fields = ['caption', 'event__name', 'uploaded_by__email']
    ordering_fields = ['created_at', 'caption']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter for moderation queue"""
        status_filter = self.request.query_params.get('status')
        if status_filter:
            return self.queryset.filter(is_approved=status_filter)
        return self.queryset.filter(is_approved=False)


class PublicMediaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for public media display (only approved media)"""
    queryset = Media.objects.filter(is_approved=True).select_related('event')
    serializer_class = PublicMediaSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event', 'media_type']
    search_fields = ['caption', 'event__name']
    ordering_fields = ['created_at', 'caption']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter by event if specified"""
        event_id = self.request.query_params.get('event')
        if event_id:
            return self.queryset.filter(event_id=event_id)
        return self.queryset


# Legacy MediaViewSet for backward compatibility
class MediaViewSet(viewsets.ModelViewSet):
    """General purpose media viewset"""
    queryset = Media.objects.select_related('event', 'uploaded_by')
    serializer_class = MediaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event', 'media_type', 'is_approved']
    search_fields = ['caption', 'event__name']
    ordering_fields = ['created_at', 'caption']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        if self.action == "list" and not self.request.user.is_authenticated:
            return Media.objects.filter(is_approved=True)
        elif self.action == "list" and self.request.user.role not in ['ADMIN', 'ORGANIZER']:
            return Media.objects.filter(
                Q(is_approved=True) | Q(uploaded_by=self.request.user)
            )
        return self.queryset

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


# Gallery endpoints for general use (not tied to events)
class GalleryAlbumViewSet(viewsets.ModelViewSet):
    """ViewSet for gallery albums"""
    queryset = GalleryAlbum.objects.filter(is_public=True)
    serializer_class = GalleryAlbumSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_public"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "title"]
    ordering = ["-created_at"]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.role in ['ADMIN', 'ORGANIZER']:
            return GalleryAlbum.objects.all()
        return GalleryAlbum.objects.filter(is_public=True)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class GalleryMediaViewSet(viewsets.ModelViewSet):
    """ViewSet for gallery media"""
    queryset = GalleryMedia.objects.filter(is_public=True)
    serializer_class = GalleryMediaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["album", "media_type", "is_public"]
    search_fields = ["title", "album__title"]
    ordering_fields = ["created_at", "title"]
    ordering = ["-created_at"]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.role in ['ADMIN', 'ORGANIZER']:
            return GalleryMedia.objects.all()
        return GalleryMedia.objects.filter(is_public=True)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class PublicGalleryAlbumViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only access to gallery albums"""
    queryset = GalleryAlbum.objects.filter(is_public=True)
    serializer_class = PublicGalleryAlbumSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "title"]
    ordering = ["-created_at"]


class PublicGalleryMediaViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only access to gallery media"""
    queryset = GalleryMedia.objects.filter(is_public=True)
    serializer_class = PublicGalleryMediaSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["album", "media_type"]
    search_fields = ["title", "album__title"]
    ordering_fields = ["created_at", "title"]
    ordering = ["-created_at"]

