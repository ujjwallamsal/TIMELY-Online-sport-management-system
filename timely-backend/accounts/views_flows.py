from django.utils.crypto import get_random_string
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, status
from rest_framework.response import Response

User = get_user_model()

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def request_email_verification(request):
    email = (request.data.get("email") or "").strip().lower()
    try:
        u = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"detail": "If the email exists, a verification link will be sent."})
    u.email_token = get_random_string(32)
    u.save(update_fields=["email_token"])
    # TODO: configure real email backend
    send_mail(
        "Verify your email",
        f"Click to verify: https://your-frontend/verify?token={u.email_token}",
        "no-reply@timely.local",
        [u.email],
        fail_silently=True,
    )
    return Response({"detail": "If the email exists, a verification link will be sent."})

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def verify_email(request):
    token = request.data.get("token")
    if not token:
        return Response({"detail": "token required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        u = User.objects.get(email_token=token)
    except User.DoesNotExist:
        return Response({"detail": "invalid token"}, status=status.HTTP_400_BAD_REQUEST)
    u.email_token = None
    u.save(update_fields=["email_token"])
    return Response({"detail": "email verified"})

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def request_password_reset(request):
    email = (request.data.get("email") or "").strip().lower()
    try:
        u = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"detail": "If the email exists, a reset link will be sent."})
    u.email_token = get_random_string(32)
    u.save(update_fields=["email_token"])
    send_mail(
        "Reset your password",
        f"Reset here: https://your-frontend/reset?token={u.email_token}",
        "no-reply@timely.local",
        [u.email],
        fail_silently=True,
    )
    return Response({"detail": "If the email exists, a reset link will be sent."})

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def confirm_password_reset(request):
    token = request.data.get("token")
    new_password = request.data.get("password")
    if not token or not new_password:
        return Response({"detail": "token and password required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        u = User.objects.get(email_token=token)
    except User.DoesNotExist:
        return Response({"detail": "invalid token"}, status=status.HTTP_400_BAD_REQUEST)
    u.set_password(new_password)
    u.email_token = None
    u.save()
    return Response({"detail": "password updated"})
