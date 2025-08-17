# results/views.py
from __future__ import annotations
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Result
from .serializers import ResultSerializer
from fixtures.models import Match


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
    queryset = Result.objects.select_related("match", "match__event", "match__venue").all()
    serializer_class = ResultSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizerOrStaff]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["match__event", "match"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    @action(detail=False, methods=["post"], url_path="set")
    def set_result(self, request):
        """
        Upsert a result and mark the match completed.
        Payload: { "match": <id>, "score_a": 1, "score_b": 0, "notes": "" }
        """
        match_id = request.data.get("match")
        if not match_id:
            return Response({"detail": "match is required"}, status=400)

        try:
            match = Match.objects.select_related("event").get(pk=match_id)
        except Match.DoesNotExist:
            return Response({"detail": "match not found"}, status=404)

        obj, _ = Result.objects.update_or_create(
            match=match,
            defaults={
                "score_a": int(request.data.get("score_a") or 0),
                "score_b": int(request.data.get("score_b") or 0),
                "notes": request.data.get("notes") or "",
            },
        )
        # mark match complete
        match.status = Match.Status.COMPLETED
        match.end_time = match.end_time or match.start_time  # if not supplied elsewhere
        match.save(update_fields=["status", "end_time"])

        return Response(ResultSerializer(obj).data, status=201)
