from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend

from .models import Album, MediaAsset
from .serializers import AlbumSerializer, MediaAssetSerializer
from .permissions import IsOrganizerOrAdminOrReadOnly
from .models import Media
from .serializers import MediaSerializer

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

    from rest_framework import viewsets, permissions


class IsOrganizerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["ORGANIZER", "ADMIN"]

class MediaViewSet(viewsets.ModelViewSet):
    queryset = Media.objects.all()
    serializer_class = MediaSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsOrganizerOrAdmin()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        if self.action == "list" and not self.request.user.is_staff:
            return Media.objects.filter(is_approved=True)
        return super().get_queryset()

