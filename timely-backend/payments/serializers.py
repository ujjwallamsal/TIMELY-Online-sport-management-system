# payments/serializers.py
from __future__ import annotations
from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id", "user", "registration", "ticket",
            "amount_cents", "currency",
            "provider", "provider_ref", "status",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
