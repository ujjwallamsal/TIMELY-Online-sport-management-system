# accounts/serializers.py - Simplified for minimal boot profile
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.validators import EmailValidator
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .models import User, OrganizerApplication
from common.models import AuditLog


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
            "is_active",
            "is_staff",
            "is_superuser",
            "email_verified",
            "date_joined",
            "created_at",
            "updated_at",
            "role"
        ]
        read_only_fields = [
            "id",
            "is_staff",
            "is_superuser",
            "email_verified",
            "date_joined",
            "created_at",
            "updated_at",
            "role"
        ]


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "password",
            "password_confirm"
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    is_verified = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_active",
            "email_verified",
            "is_verified",
            "date_joined",
            "role"
        ]
        read_only_fields = [
            "id",
            "email",
            "is_active",
            "email_verified",
            "is_verified",
            "date_joined",
            "role"
        ]


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name"
        ]


class UserListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_active",
            "email_verified",
            "date_joined",
            "role"
        ]


class UserProfileWithKycSerializer(UserProfileSerializer):
    """Extended user profile with KYC information"""
    class Meta(UserProfileSerializer.Meta):
        fields = UserProfileSerializer.Meta.fields + [
            "phone_number",
            "date_of_birth",
            "address",
            "city",
            "state",
            "postal_code",
            "country"
        ]


# ------------ Password management ------------

class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()
    
    def validate_current_password(self, value):
        user = self.context['user']
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs


# ------------ Email verification ------------
# Disabled for minimal boot profile - no token models


# ------------ Organizer applications ------------

class OrganizerApplicationSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    reviewed_by_email = serializers.CharField(source='reviewed_by.email', read_only=True)
    
    class Meta:
        model = OrganizerApplication
        fields = [
            'id',
            'user',
            'user_email',
            'user_name',
            'status',
            'reason',
            'reviewed_by',
            'reviewed_by_email',
            'reviewed_at',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'user',
            'reviewed_by',
            'reviewed_at',
            'created_at',
            'updated_at'
        ]


class OrganizerApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizerApplication
        fields = ['reason']
    
    def create(self, validated_data):
        user = self.context['request'].user
        return OrganizerApplication.objects.create(
            user=user,
            **validated_data
        )


# ------------ Audit logs ------------

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id',
            'user',
            'user_email',
            'action',
            'resource_type',
            'resource_id',
            'details',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']