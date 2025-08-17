# tickets/serializers.py
from __future__ import annotations

from rest_framework import serializers
from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    total_price_cents = serializers.IntegerField(read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "match",
            "purchaser",
            "quantity",
            "price_cents",
            "qr_code",
            "purchased_at",
            "status",
            "total_price_cents",
        ]
        read_only_fields = [
            "id",
            "purchased_at",
            "qr_code",
            "purchaser",            # purchaser is set from request.user in the view
            "total_price_cents",
        ]
