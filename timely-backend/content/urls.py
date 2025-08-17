from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PageViewSet,
    AnnouncementViewSet,
    PublicPageViewSet,
    PublicAnnouncementViewSet,
)

router = DefaultRouter()
router.register(r"pages", PageViewSet, basename="pages")
router.register(r"announcements", AnnouncementViewSet, basename="announcements")

public_router = DefaultRouter()
public_router.register(r"pages", PublicPageViewSet, basename="public-pages")
public_router.register(r"announcements", PublicAnnouncementViewSet, basename="public-announcements")

urlpatterns = [
    path("api/content/", include(router.urls)),          # Admin CRUD
    path("api/public/content/", include(public_router.urls)),  # Public
]
