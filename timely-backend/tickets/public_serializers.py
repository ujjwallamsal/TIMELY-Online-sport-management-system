# tickets/public_serializers.py
from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import serializers

from fixtures.models import Match
from .models import Ticket
from .serializers import TicketSerializer  # reuse your existing ticket output


class PublicPurchaseSerializer(serializers.Serializer):
    """
    Input validator for public ticket purchases.
    Keeps it gateway-agnostic; you can add fields like payment_intent later.
    """
    email = serializers.EmailField()
    match = serializers.PrimaryKeyRelatedField(queryset=Match.objects.all())
    quantity = serializers.IntegerField(min_value=1, default=1)
    price_cents = serializers.IntegerField(min_value=0)  # total for this purchase row

    # Optional UX niceties (ignored by backend for now)
    full_name = serializers.CharField(required=False, allow_blank=True)
    accept_terms = serializers.BooleanField(required=False, default=False)

    def validate(self, data):
        # Example check — you can add capacity checks here if you track per-match capacity.
        return data

    def create(self, validated_data):
        """
        Create (or reuse) a spectator user by email, then create a Ticket.
        """
        User = get_user_model()
        email = validated_data["email"].strip().lower()
        purchaser, _ = User.objects.get_or_create(
            email=email,
            defaults={
                "password": User.objects.make_random_password(),
                "role": "SPECTATOR",
                "is_active": True,  # allow immediate ticket usage
            },
        )

        ticket = Ticket.objects.create(
            match=validated_data["match"],
            purchaser=purchaser,
            quantity=validated_data["quantity"],
            price_cents=validated_data["price_cents"],  # treat as total
        )
        return ticket

    def to_representation(self, instance: Ticket):
        # Return your standard ticket shape to the client
        return TicketSerializer(instance).data
