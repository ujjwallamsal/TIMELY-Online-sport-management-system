# events/public_views.py
from __future__ import annotations

from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from common.auth import NoAuthentication

from .models import Event
from .serializers import EventSerializer
# from results.services import compute_event_leaderboard


class PublicEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    FR41 — Public can browse events (upcoming/ongoing/completed).
    FR44 — Public leaderboard per event (action).
    """
    permission_classes = [permissions.AllowAny]  # Use DRF's built-in AllowAny
    authentication_classes = [NoAuthentication]  # No authentication required for public endpoints
    serializer_class = EventSerializer

    def get_queryset(self):
        return Event.objects.filter(
            visibility='PUBLIC',
            status__in=['published']  # Only show published events publicly
        ).select_related("venue", "created_by")

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["sport", "venue", "status"]
    search_fields = ["name", "description"]
    ordering_fields = ["start_datetime", "name", "created_at"]
    ordering = ["-start_datetime"]

    @action(detail=True, methods=["get"], url_path="leaderboard")
    def leaderboard(self, request, pk: str | None = None):
        """
        GET /api/public/events/{id}/leaderboard/
        """
        # data = compute_event_leaderboard(int(pk))
        # return Response(data)
        return Response({"message": "Leaderboard feature coming soon"})
