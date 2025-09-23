# fixtures/public_views.py
from __future__ import annotations

from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Fixture
from .serializers import FixtureSerializer


class PublicMatchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public schedules/fixtures - read-only access to published matches.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = FixtureSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["event", "status", "venue", "round", "phase"]
    search_fields = ["event__name"]
    ordering_fields = ["start_at", "round"]
    ordering = ["start_at", "round"]

    def get_queryset(self):
        """Return only published matches from published events"""
        queryset = Fixture.objects.filter(
            event__status='published',
            event__visibility='PUBLIC'
        ).select_related(
            "event", "venue"
        )
        
        # Filter by event_id if provided in URL
        event_id = self.kwargs.get('event_id')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
            
        return queryset
