from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AlbumViewSet,
    MediaAssetViewSet,
)

# Admin router
admin_router = DefaultRouter()
admin_router.register(r"albums", AlbumViewSet, basename="albums")
admin_router.register(r"media", MediaAssetViewSet, basename="media")

urlpatterns = [
    path("", include(admin_router.urls)),           # Admin CRUD - mounted at /api/gallery/
]
