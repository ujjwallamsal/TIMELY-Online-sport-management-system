# fixtures/public_views.py
from __future__ import annotations

from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Match
from .serializers import MatchSerializer


class PublicMatchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public schedules/fixtures - read-only access to published matches.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = MatchSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["event", "division", "status", "venue_id", "round_no"]
    search_fields = ["event__name", "note"]
    ordering_fields = ["starts_at", "round_no", "sequence_no"]
    ordering = ["starts_at", "round_no", "sequence_no"]

    def get_queryset(self):
        """Return only published matches from published events"""
        return Fixture.objects.filter(
            status=Fixture.Status.PUBLISHED,
            event__lifecycle_status='published'
        ).select_related(
            "event", "venue"
        )
