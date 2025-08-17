# payments/views.py
from __future__ import annotations
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Payment
from .serializers import PaymentSerializer

class IsAdminOrOrganizer(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "role", "").upper() in {"ADMIN", "ORGANIZER"})

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("user", "registration", "ticket").all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminOrOrganizer]

    @action(detail=True, methods=["post"], url_path="simulate-succeed")
    def simulate_succeed(self, request, pk=None):
        """
        Dev-only: mark a payment as SUCCEEDED and trigger emails (via signal).
        Replace with real gateway webhook in production.
        """
        p = self.get_object()
        p.status = "SUCCEEDED"
        p.provider = p.provider or "DEV"
        p.save(update_fields=["status", "provider"])
        return Response(PaymentSerializer(p, context={"request": request}).data, status=status.HTTP_200_OK)
