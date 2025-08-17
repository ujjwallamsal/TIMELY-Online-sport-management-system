# tickets/views.py
from __future__ import annotations
from django.db import transaction
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Ticket
from .serializers import TicketSerializer
from .permissions import IsOrganizerOrAdmin

class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    queryset = (
        Ticket.objects
        .select_related("purchaser", "match", "match__event", "match__venue")
        .all()
        .order_by("-purchased_at")
    )
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "match", "purchaser"]
    search_fields = ["qr_code", "purchaser__email", "match__event__name"]
    ordering_fields = ["purchased_at", "price_cents", "quantity"]
    ordering = ["-purchased_at"]

    def get_permissions(self):
        if self.action in {"list", "retrieve", "mine"}:
            return [permissions.IsAuthenticated()]
        if self.action in {"refund", "cancel"}:
            return [IsOrganizerOrAdmin()]
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsOrganizerOrAdmin()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=["get"])
    def mine(self, request):
        qs = self.queryset.filter(purchaser=request.user)
        page = self.paginate_queryset(qs)
        if page is not None:
            ser = TicketSerializer(page, many=True)
            return self.get_paginated_response(ser.data)
        return Response(TicketSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"])
    def qr(self, request, pk=None):
        ticket = self.get_object()
        # return raw qr string; frontend renders as QR image
        return Response({"qr": ticket.qr_code})

    @transaction.atomic
    @action(detail=True, methods=["post"])
    def refund(self, request, pk=None):
        ticket = self.get_object()
        if ticket.status == Ticket.Status.REFUNDED:
            return Response({"detail": "Already refunded"}, status=400)
        ticket.status = Ticket.Status.REFUNDED
        ticket.save(update_fields=["status"])
        # optionally: create refund payment record here
        return Response({"refunded": True})

    @transaction.atomic
    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        ticket = self.get_object()
        if ticket.status in (Ticket.Status.CANCELLED, Ticket.Status.REFUNDED):
            return Response({"detail": "Already cancelled/refunded"}, status=400)
        ticket.status = Ticket.Status.CANCELLED
        ticket.save(update_fields=["status"])
        return Response({"cancelled": True})
