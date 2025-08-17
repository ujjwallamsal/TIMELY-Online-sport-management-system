# venues/views.py
from __future__ import annotations
from datetime import timedelta

from django.utils import timezone
from django.db.models import Q
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Venue
from .serializers import VenueSerializer
from fixtures.models import Match

class IsOrganizerOrAdmin(permissions.BasePermission):
    """
    Allow safe reads to authenticated users; restrict writes to ORGANIZER/ADMIN.
    Adjust if you have a global Role permission in accounts.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return getattr(user, "role", "").upper() in {"ORGANIZER", "ADMIN"}

class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.all().order_by("name")
    serializer_class = VenueSerializer
    permission_classes = [IsOrganizerOrAdmin]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["indoor", "city", "state", "country"]
    search_fields = ["name", "address", "city", "state", "country", "facilities"]
    ordering_fields = ["name", "capacity", "created_at"]
    ordering = ["name"]

    @action(detail=True, methods=["get"], url_path="availability")
    def availability(self, request, pk=None):
        """
        FR54/FR55: Show upcoming occupied time ranges for this venue.
        Query params:
          - from: ISO datetime (default: now)
          - to:   ISO datetime (default: +30 days)
        """
        v = self.get_object()
        try:
            start_from = request.query_params.get("from")
            end_to = request.query_params.get("to")
            start_from = timezone.datetime.fromisoformat(start_from) if start_from else timezone.now()
            end_to = timezone.datetime.fromisoformat(end_to) if end_to else (timezone.now() + timedelta(days=30))
            if timezone.is_naive(start_from):
                start_from = timezone.make_aware(start_from, timezone.get_current_timezone())
            if timezone.is_naive(end_to):
                end_to = timezone.make_aware(end_to, timezone.get_current_timezone())
        except Exception:
            return Response({"detail": "Invalid datetime format. Use ISO8601."}, status=400)

        # Overlapping matches: [start_time, end_time] intersects requested window
        clashes = (
            Match.objects
            .select_related("event", "team_a", "team_b")
            .filter(
                venue=v,
                start_time__lt=end_to,
                end_time__gt=start_from,
            )
            .order_by("start_time")
        )

        data = [
            {
                "match_id": m.id,
                "event": getattr(m.event, "name", None),
                "team_a": getattr(m.team_a, "name", None),
                "team_b": getattr(m.team_b, "name", None),
                "start_time": m.start_time,
                "end_time": m.end_time,
            }
            for m in clashes
        ]
        return Response({
            "venue_id": v.id,
            "window": {"from": start_from, "to": end_to},
            "occupied": data,
        })
