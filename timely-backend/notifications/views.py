from __future__ import annotations

from typing import Any
from django.db.models import QuerySet
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """
    Authenticated users read their own notifications.
    Admins can see all (optional: keep as-is if you prefer only own).
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> QuerySet[Notification]:
        qs = Notification.objects.all().select_related("recipient").order_by("-created_at")
        user = self.request.user
        # If you want admins to see all:
        if getattr(user, "is_staff", False):
            return qs
        # Otherwise, regular users see only their notifications
        return qs.filter(recipient=user)

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request, *args: Any, **kwargs: Any) -> Response:
        count = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"updated": count}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None, *args: Any, **kwargs: Any) -> Response:
        obj = self.get_queryset().filter(pk=pk).first()
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if not obj.is_read:
            obj.is_read = True
            obj.save(update_fields=["is_read"])
        return Response(NotificationSerializer(obj).data, status=status.HTTP_200_OK)
