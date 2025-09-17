from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AlbumViewSet,
    MediaAssetViewSet,
    MediaUploadViewSet,
    MediaModerationViewSet,
    PublicMediaViewSet,
    MediaViewSet,
)

# Admin router
admin_router = DefaultRouter()
admin_router.register(r"albums", AlbumViewSet, basename="albums")
admin_router.register(r"media", MediaAssetViewSet, basename="media")
admin_router.register(r"media-upload", MediaUploadViewSet, basename="media-upload")
admin_router.register(r"media-moderation", MediaModerationViewSet, basename="media-moderation")

# Public router
public_router = DefaultRouter()
public_router.register(r"media", PublicMediaViewSet, basename="public-media")

urlpatterns = [
    path("", include(admin_router.urls)),           # Admin CRUD - mounted at /api/gallery/
    path("public/", include(public_router.urls)),  # Public - mounted at /api/gallery/public/
]
