# accounts/serializers.py
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.validators import EmailValidator
from rest_framework import serializers

from .tokens import new_token

User = get_user_model()
_HAS_EMAIL_VERIFIED = any(f.name == "email_verified" for f in User._meta.get_fields())
_HAS_EMAIL_TOKEN = any(f.name == "email_token" for f in User._meta.get_fields())


# ------------ Core user ------------

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "is_staff",
            "date_joined",
        ]
        read_only_fields = ["id", "is_staff", "date_joined"]


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name"]
        extra_kwargs = {f: {"required": False, "allow_blank": True} for f in fields}


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name", "role"]
        extra_kwargs = {"role": {"required": False}}

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        role = validated_data.get("role") or getattr(User.Role, "SPECTATOR", "SPECTATOR")
        user = User.objects.create_user(password=password, role=role, **validated_data)
        return user


# ------------ Flows: email verify + password reset ------------

class EmailVerificationRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(validators=[EmailValidator()])

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        try:
            self.user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don’t leak whether an email exists
            self.user = None
        return attrs

    def save(self):
        if self.user and _HAS_EMAIL_TOKEN:
            self.user.email_token = new_token(16)
            self.user.save(update_fields=["email_token"])
            return {"token": self.user.email_token}
        # In dev, still return a shape
        return {"token": ""}


class EmailVerificationConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField()

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        token = attrs["token"].strip()
        try:
            self.user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "Unknown email"})
        if not _HAS_EMAIL_TOKEN or self.user.email_token != token:
            raise serializers.ValidationError({"token": "Invalid token"})
        return attrs

    def save(self):
        updates = []
        if _HAS_EMAIL_VERIFIED:
            self.user.email_verified = True
            updates.append("email_verified")
        if _HAS_EMAIL_TOKEN:
            self.user.email_token = ""
            updates.append("email_token")
        if updates:
            self.user.save(update_fields=updates)
        return {"verified": True}


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(validators=[EmailValidator()])

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        try:
            self.user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don’t leak existence
            self.user = None
        return attrs

    def save(self):
        token = ""
        if self.user and _HAS_EMAIL_TOKEN:
            token = new_token(16)
            self.user.email_token = token
            self.user.save(update_fields=["email_token"])
        return {"token": token}


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        token = attrs["token"].strip()
        try:
            self.user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "Unknown email"})
        if not _HAS_EMAIL_TOKEN or self.user.email_token != token:
            raise serializers.ValidationError({"token": "Invalid token"})
        return attrs

    def save(self):
        pwd = self.validated_data["new_password"]
        self.user.set_password(pwd)
        updates = ["password"]
        if _HAS_EMAIL_TOKEN:
            self.user.email_token = ""
            updates.append("email_token")
        self.user.save(update_fields=updates)
        return {"reset": True}
