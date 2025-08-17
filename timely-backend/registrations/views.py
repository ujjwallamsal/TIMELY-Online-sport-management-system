# registrations/views.py
from __future__ import annotations
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Registration
from .serializers import RegistrationSerializer
from .permissions import IsOrganizerOrAdmin

class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.select_related("user", "event").all().order_by("-created_at")
    serializer_class = RegistrationSerializer

    def get_permissions(self):
        if self.action in {"approve", "reject", "destroy", "update", "partial_update"}:
            return [IsOrganizerOrAdmin()]
        if self.action in {"create"}:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        reg = self.get_object()
        reg.is_paid = True
        reg.save(update_fields=["is_paid"])
        return Response({"approved": True})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        reg = self.get_object()
        reg.is_paid = False
        reg.save(update_fields=["is_paid"])
        return Response({"rejected": True})
