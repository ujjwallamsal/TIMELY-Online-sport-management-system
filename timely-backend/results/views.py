# results/views.py
from __future__ import annotations
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Result
from .serializers import ResultSerializer
from fixtures.models import Fixture


class IsOrganizerOrStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = getattr(request.user, "role", "")
        return request.user.is_staff or role in {"ADMIN", "ORGANIZER"}


class ResultViewSet(viewsets.ModelViewSet):
    """
    FR31–35: Enter results, update scores, publish for public viewing.
    """
    queryset = Result.objects.select_related("match", "match__event").all()
    serializer_class = ResultSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizerOrStaff]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["match"]  # Only filter by match ID, not nested fields
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    @action(detail=False, methods=["post"], url_path="set")
    def set_result(self, request):
        """
        Upsert a result and mark the match completed.
        Payload: { "match": <id>, "score_a": 1, "score_b": 0, "notes": "" }
        """
        fixture_id = request.data.get("fixture")
        if not fixture_id:
            return Response({"detail": "fixture is required"}, status=400)

        try:
            fixture = Fixture.objects.select_related("event").get(pk=fixture_id)
        except Fixture.DoesNotExist:
            return Response({"detail": "fixture not found"}, status=404)

        obj, _ = Result.objects.update_or_create(
            fixture=fixture,
            defaults={
                "score_a": int(request.data.get("score_a") or 0),
                "score_b": int(request.data.get("score_b") or 0),
                "notes": request.data.get("notes") or "",
            },
        )
        # mark fixture complete
        fixture.status = Fixture.Status.COMPLETED
        fixture.ends_at = fixture.ends_at or fixture.starts_at  # if not supplied elsewhere
        fixture.save(update_fields=["status", "ends_at"])

        return Response(ResultSerializer(obj).data, status=201)
