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
        .select_related("event", "venue", "team_a", "team_b")
        .all()
        .order_by("start_time")
    )

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["event", "venue", "team_a", "team_b"]
    ordering_fields = ["start_time"]
    ordering = ["start_time"]
