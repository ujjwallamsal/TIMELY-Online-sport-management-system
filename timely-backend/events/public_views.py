# events/public_views.py
from __future__ import annotations

from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Event
from .serializers import EventSerializer
from results.services import compute_event_leaderboard


class PublicEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    FR41 — Public can browse events (upcoming/ongoing/completed).
    FR44 — Public leaderboard per event (action).
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = EventSerializer

    queryset = (
        Event.objects
        .select_related("venue")
        .all()
        .order_by("start_date")
    )

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "sport_type", "venue", "start_date", "end_date"]
    search_fields = ["name", "sport_type", "venue__name"]
    ordering_fields = ["start_date", "end_date", "name"]
    ordering = ["start_date"]

    @action(detail=True, methods=["get"], url_path="leaderboard")
    def leaderboard(self, request, pk: str | None = None):
        """
        GET /api/public/events/{id}/leaderboard/
        """
        data = compute_event_leaderboard(int(pk))
        return Response(data)
