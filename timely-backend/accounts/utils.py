# accounts/utils.py
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.conf import settings

def send_verification_email(user):
    if not user.email_token:
        user.email_token = get_random_string(48)
        user.save(update_fields=["email_token"])
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={user.email_token}"
    send_mail(
        subject="Verify your Timely account",
        message=f"Hi,\n\nPlease verify your email:\n{verify_url}\n\nThanks,\nTimely",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )

def send_password_reset_email(user):
    # We will reuse email_token for a one-shot reset link
    if not user.email_token:
        user.email_token = get_random_string(48)
        user.save(update_fields=["email_token"])
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={user.email_token}"
    send_mail(
        subject="Reset your Timely password",
        message=f"Hi,\n\nReset your password:\n{reset_url}\n\nIf you didn’t request this, ignore.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )
