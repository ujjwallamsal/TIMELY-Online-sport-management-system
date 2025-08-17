from rest_framework import viewsets, permissions
from .models import Page, Announcement
from .serializers import PageSerializer, AnnouncementSerializer


class PageViewSet(viewsets.ModelViewSet):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    permission_classes = [permissions.IsAdminUser]


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAdminUser]


# Public endpoints for only published content
class PublicPageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Page.objects.filter(is_published=True)
    serializer_class = PageSerializer
    permission_classes = [permissions.AllowAny]


class PublicAnnouncementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Announcement.objects.filter(is_published=True)
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.AllowAny]
