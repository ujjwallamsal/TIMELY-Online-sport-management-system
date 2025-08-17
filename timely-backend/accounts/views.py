# accounts/views.py
from __future__ import annotations

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from .serializers import (
    UserSerializer,
    ProfileUpdateSerializer,
    SignupSerializer,
    EmailVerificationRequestSerializer,
    EmailVerificationConfirmSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)

User = get_user_model()


# -------- Admin/user management (used by router in timely/urls.py) --------

class UserViewSet(viewsets.ModelViewSet):
    """
    Minimal user admin endpoints.
    """
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=["post"], permission_classes=[permissions.AllowAny])
    def signup(self, request):
        ser = SignupSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["patch"], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """
        Update current user's first/last name.
        """
        ser = ProfileUpdateSerializer(instance=request.user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(UserSerializer(request.user).data)


# ---------------- Public auth/flow endpoints (wired in accounts/urls.py) ----------------

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def request_email_verification(request):
    ser = EmailVerificationRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    payload = ser.save()
    return Response({"detail": "If the email exists, a verification token has been issued.", **payload})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def verify_email(request):
    ser = EmailVerificationConfirmSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    payload = ser.save()
    return Response(payload)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def request_password_reset(request):
    ser = PasswordResetRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    payload = ser.save()
    return Response({"detail": "If the email exists, a reset token has been issued.", **payload})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def confirm_password_reset(request):
    ser = PasswordResetConfirmSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    payload = ser.save()
    return Response(payload)
