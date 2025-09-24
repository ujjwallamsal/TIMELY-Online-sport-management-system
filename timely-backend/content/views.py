from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import models
from accounts.rbac_permissions import OrganizerOrAdminPermission
from .models import Page, News, Banner, Announcement
from .serializers import PageSerializer, NewsSerializer, NewsPublicSerializer, BannerSerializer, AnnouncementSerializer


class PageViewSet(viewsets.ModelViewSet):
    """Admin CRUD for static pages."""
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'slug'

    @action(detail=False, methods=['get'])
    def published(self, request):
        """Get all published pages."""
        queryset = Page.objects.filter(
            published=True,
            publish_at__lte=timezone.now()
        ).union(
            Page.objects.filter(published=True, publish_at__isnull=True)
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class NewsViewSet(viewsets.ModelViewSet):
    """Organizer/Admin CRUD for news articles."""
    queryset = News.objects.all()
    serializer_class = NewsSerializer
    permission_classes = [OrganizerOrAdminPermission]

    def get_serializer_context(self):
        """Ensure request context is passed to serializer."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['get'])
    def published(self, request):
        """Get all published news articles."""
        queryset = News.objects.filter(
            is_published=True,
            publish_at__lte=timezone.now()
        ).union(
            News.objects.filter(is_published=True, publish_at__isnull=True)
        ).order_by('-published_at', '-created_at')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class BannerViewSet(viewsets.ModelViewSet):
    """Admin CRUD for promotional banners."""
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all currently active banners."""
        now = timezone.now()
        queryset = Banner.objects.filter(
            active=True,
            starts_at__lte=now
        ).filter(
            models.Q(ends_at__isnull=True) | models.Q(ends_at__gte=now)
        ).order_by('-created_at')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# Keep AnnouncementViewSet for backward compatibility
class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAdminUser]


# Public endpoints for only published content
class PublicPageViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only access to published pages."""
    queryset = Page.objects.filter(published=True)
    serializer_class = PageSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        """Filter by published status and publish_at."""
        now = timezone.now()
        return Page.objects.filter(
            published=True
        ).filter(
            models.Q(publish_at__isnull=True) | models.Q(publish_at__lte=now)
        )

    @action(detail=False, methods=['get'])
    def by_slug(self, request, slug=None):
        """Get a specific page by slug."""
        page = get_object_or_404(
            self.get_queryset(),
            slug=slug
        )
        serializer = self.get_serializer(page)
        return Response(serializer.data)


class PublicNewsViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only access to published news."""
    queryset = News.objects.filter(is_published=True)
    serializer_class = NewsPublicSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        """Filter by published status and publish_at."""
        now = timezone.now()
        return News.objects.filter(
            is_published=True
        ).filter(
            models.Q(publish_at__isnull=True) | models.Q(publish_at__lte=now)
        ).order_by('-published_at', '-created_at')


class PublicBannerViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only access to active banners."""
    queryset = Banner.objects.filter(active=True)
    serializer_class = BannerSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        """Filter by active status and time window."""
        now = timezone.now()
        return Banner.objects.filter(
            active=True,
            starts_at__lte=now
        ).filter(
            models.Q(ends_at__isnull=True) | models.Q(ends_at__gte=now)
        ).order_by('-created_at')


# Keep PublicAnnouncementViewSet for backward compatibility
class PublicAnnouncementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Announcement.objects.filter(is_published=True)
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.AllowAny]


# Legal Pages Views
class LegalPagesViewSet(viewsets.ReadOnlyModelViewSet):
    """Public legal pages (Terms, Privacy Policy)"""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    
    @action(detail=False, methods=['get'])
    def terms(self, request):
        """Get Terms of Service page"""
        try:
            page = Page.objects.get(slug='terms', published=True)
            # Check if publish_at is in the past or None
            if page.publish_at and page.publish_at > timezone.now():
                return Response({'error': 'Terms page not available'}, status=404)
            
            serializer = PageSerializer(page)
            return Response(serializer.data)
        except Page.DoesNotExist:
            return Response({'error': 'Terms page not found'}, status=404)
    
    @action(detail=False, methods=['get'])
    def privacy(self, request):
        """Get Privacy Policy page"""
        try:
            page = Page.objects.get(slug='privacy', published=True)
            # Check if publish_at is in the past or None
            if page.publish_at and page.publish_at > timezone.now():
                return Response({'error': 'Privacy page not available'}, status=404)
            
            serializer = PageSerializer(page)
            return Response(serializer.data)
        except Page.DoesNotExist:
            return Response({'error': 'Privacy page not found'}, status=404)
