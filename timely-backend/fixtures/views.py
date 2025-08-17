# fixtures/views.py
from __future__ import annotations

from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Match
from .serializers import MatchSerializer
from .services import generate_round_robin_for_event
from events.models import Event
from venues.models import Venue


class IsOrganizer(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = getattr(request.user, "role", "")
        return request.user.is_staff or role in {"ADMIN", "ORGANIZER"}


class MatchViewSet(viewsets.ModelViewSet):
    """
    FR16/18/19/20:
    - Create & edit schedules
    - Publish/unpublish schedules
    - Reschedule matches
    - Auto-generate round-robin fixtures
    """
    queryset = (
        Match.objects
        .select_related("event", "venue", "team_a", "team_b")
        .all()
        .order_by("start_time")
    )
    serializer_class = MatchSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["event", "venue", "team_a", "team_b", "status", "is_published"]
    search_fields = ["event__name", "venue__name", "team_a__name", "team_b__name"]
    ordering_fields = ["start_time", "status"]
    ordering = ["start_time"]

    @action(detail=False, methods=["post"], url_path="publish")
    def publish(self, request):
        """
        Publish all SCHEDULED matches of an event.
        Payload: { "event": <event_id> }
        """
        event_id = request.data.get("event")
        if not event_id:
            return Response({"detail": "event is required"}, status=400)
        updated = Match.objects.filter(event_id=event_id, status=Match.Status.SCHEDULED).update(is_published=True)
        return Response({"published": updated})

    @action(detail=False, methods=["post"], url_path="unpublish")
    def unpublish(self, request):
        event_id = request.data.get("event")
        if not event_id:
            return Response({"detail": "event is required"}, status=400)
        updated = Match.objects.filter(event_id=event_id).update(is_published=False)
        return Response({"unpublished": updated})

    @action(detail=True, methods=["post"], url_path="reschedule")
    def reschedule(self, request, pk=None):
        """
        Reschedule a single match:
        Payload: { "start_time": "2025-08-20T09:00:00Z", "end_time": "2025-08-20T10:30:00Z", "venue": <venue_id> }
        """
        match = self.get_object()
        start_iso = request.data.get("start_time")
        end_iso   = request.data.get("end_time")
        venue_id  = request.data.get("venue")

        if start_iso:
            try:
                start_dt = timezone.datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
            except Exception:
                return Response({"detail": "Invalid start_time ISO 8601"}, status=400)
            match.start_time = start_dt

        if end_iso:
            try:
                end_dt = timezone.datetime.fromisoformat(end_iso.replace("Z", "+00:00"))
            except Exception:
                return Response({"detail": "Invalid end_time ISO 8601"}, status=400)
            match.end_time = end_dt

        if venue_id:
            try:
                venue = Venue.objects.get(pk=venue_id)
            except Venue.DoesNotExist:
                return Response({"detail": "Invalid venue"}, status=404)
            match.venue = venue

        match.save()
        return Response(MatchSerializer(match).data)

    @action(detail=False, methods=["post"], url_path="generate-round-robin")
    @transaction.atomic
    def generate_round_robin(self, request):
        """
        FR17 alt path (round-robin generator):
        Payload: { "event": <event_id>, "venue": <venue_id>, "start_at": "2025-08-16T09:00:00Z", "spacing_minutes": 75 }
        """
        event_id = request.data.get("event")
        venue_id = request.data.get("venue")
        start_at = request.data.get("start_at")
        spacing  = int(request.data.get("spacing_minutes") or 90)

        if not (event_id and venue_id and start_at):
            return Response({"detail": "event, venue, start_at are required"}, status=400)
        try:
            event = Event.objects.get(pk=event_id)
            venue = Venue.objects.get(pk=venue_id)
        except (Event.DoesNotExist, Venue.DoesNotExist):
            return Response({"detail": "invalid event or venue"}, status=404)

        try:
            dt = timezone.datetime.fromisoformat(start_at.replace("Z", "+00:00"))
        except Exception:
            return Response({"detail": "start_at must be ISO 8601"}, status=400)

        created = generate_round_robin_for_event(event, venue, dt, spacing_minutes=spacing)
        return Response({"created": len(created), "matches": MatchSerializer(created, many=True).data}, status=201)
