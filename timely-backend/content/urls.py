from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnnouncementViewSet,
    PageViewSet,
    NewsViewSet,
    BannerViewSet,
    PublicPageViewSet,
    PublicNewsViewSet,
    PublicBannerViewSet,
    PublicAnnouncementViewSet,
    LegalPagesViewSet,
)

# Admin routers
admin_router = DefaultRouter()
admin_router.register(r"pages", PageViewSet, basename="pages")
admin_router.register(r"news", NewsViewSet, basename="news")
admin_router.register(r"banners", BannerViewSet, basename="banners")
admin_router.register(r"announcements", AnnouncementViewSet, basename="announcements")  # Legacy

# Public router
public_router = DefaultRouter()
public_router.register(r"pages", PublicPageViewSet, basename="public-pages")
public_router.register(r"news", PublicNewsViewSet, basename="public-news")
public_router.register(r"banners", PublicBannerViewSet, basename="public-banners")
public_router.register(r"announcements", PublicAnnouncementViewSet, basename="public-announcements")  # Legacy
public_router.register(r"legal", LegalPagesViewSet, basename="legal-pages")

urlpatterns = [
    path("", include(admin_router.urls)),           # Admin CRUD - mounted at /api/content/
    path("public/", include(public_router.urls)),  # Public - mounted at /api/content/public/
]
