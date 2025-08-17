# tickets/public_views.py
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Sum
from rest_framework import status, permissions, throttling
from rest_framework.views import APIView
from rest_framework.response import Response

from fixtures.models import Match
from .models import Ticket
from .serializers import TicketSerializer


class PublicCheckoutThrottle(throttling.AnonRateThrottle):
    """
    Basic abuse protection for public checkout.
    Set REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']['public_checkout'] in settings.
    """
    scope = "public_checkout"


class PublicCheckoutView(APIView):
    """
    FR43 — Public checkout (gateway-agnostic stub).
    POST /api/public/checkout/
      {
        "email": "fan@example.com",
        "match": 1,
        "quantity": 2,
        "price_cents": 3000
      }
    → 201 with created Ticket (uses TicketSerializer for response)
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PublicCheckoutThrottle]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        data = request.data or {}
        email = (data.get("email") or "").strip().lower()
        match_id = data.get("match")
        quantity = int(data.get("quantity") or 1)
        price_cents = int(data.get("price_cents") or 0)

        # Basic validation
        if not email:
            return Response({"detail": "email is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not match_id:
            return Response({"detail": "match is required"}, status=status.HTTP_400_BAD_REQUEST)
        if quantity < 1:
            return Response({"detail": "quantity must be >= 1"}, status=status.HTTP_400_BAD_REQUEST)
        if price_cents < 0:
            return Response({"detail": "price_cents must be >= 0"}, status=status.HTTP_400_BAD_REQUEST)

        # Match lookup
        try:
            match = Match.objects.select_related("event", "venue").get(pk=match_id)
        except Match.DoesNotExist:
            return Response({"detail": "match not found"}, status=status.HTTP_404_NOT_FOUND)

        # (Optional) capacity control via venue.capacity (or add match.capacity later)
        cap = getattr(match.venue, "capacity", None)
        if cap:
            sold = (
                Ticket.objects.filter(match=match, status=Ticket.Status.ACTIVE)
                .aggregate(n=Sum("quantity"))["n"] or 0
            )
            if sold + quantity > cap:
                remaining = max(cap - sold, 0)
                return Response(
                    {"detail": f"Not enough seats. Remaining: {remaining}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Create/reuse spectator user
        User = get_user_model()
        purchaser, _ = User.objects.get_or_create(
            email=email,
            defaults={"password": User.objects.make_random_password(), "role": "SPECTATOR", "is_active": True},
        )

        # Create ticket
        ticket = Ticket.objects.create(
            match=match,
            purchaser=purchaser,
            quantity=quantity,
            price_cents=price_cents,  # treated as total for this ticket row
        )

        # Respond with standard TicketSerializer
        return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)
