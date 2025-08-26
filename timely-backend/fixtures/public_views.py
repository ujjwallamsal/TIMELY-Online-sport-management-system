# fixtures/public_views.py
from __future__ import annotations

from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend

from .models import Match
from .serializers import MatchSerializer


class PublicMatchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    FR42 — Public schedules/fixtures.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = MatchSerializer

    queryset = (
        Match.objects
        .select_related("fixture", "venue")
        .prefetch_related("entries")
        .filter(is_published=True)
        .all()
        .order_by("scheduled_at")
    )

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["fixture", "venue", "status", "round_number"]
    ordering_fields = ["scheduled_at", "round_number", "match_number"]
    ordering = ["scheduled_at"]
