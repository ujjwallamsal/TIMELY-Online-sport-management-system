from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnnouncementViewSet,
    PageViewSet,
)
from .public_views import (
    PublicAnnouncementViewSet,
)

# Admin routers
admin_router = DefaultRouter()
admin_router.register(r"announcements", AnnouncementViewSet, basename="announcements")
admin_router.register(r"pages", PageViewSet, basename="pages")

# Public router
public_router = DefaultRouter()
public_router.register(r"announcements", PublicAnnouncementViewSet, basename="public-announcements")
public_router.register(r"news", PublicAnnouncementViewSet, basename="public-news")  # Alias for news

urlpatterns = [
    path("", include(admin_router.urls)),           # Admin CRUD - mounted at /api/content/
    path("public/", include(public_router.urls)),           # Public - mounted at /api/content/public/
]
