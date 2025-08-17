# registrations/serializers.py
from __future__ import annotations
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Registration

User = get_user_model()

class RegistrationSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(write_only=True, required=False)

    class Meta:
        model = Registration
        fields = [
            "id", "event", "user", "user_email", "is_paid", "created_at"
        ]
        read_only_fields = ["id", "user", "created_at"]

    def create(self, validated):
        # If user already authenticated, use it; else allow email to create a spectator account.
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            validated["user"] = user
        else:
            email = (validated.pop("user_email", "") or "").strip().lower()
            if not email:
                raise serializers.ValidationError({"user_email": "Email required for guest registration"})
            U = get_user_model()
            user, _ = U.objects.get_or_create(email=email, defaults={
                "password": U.objects.make_random_password(), "role": "SPECTATOR"
            })
            validated["user"] = user
        return super().create(validated)
