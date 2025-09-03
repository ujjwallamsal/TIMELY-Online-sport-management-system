# accounts/utils.py
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.conf import settings
from django.http import HttpRequest
from typing import Optional


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


def get_client_ip(request: HttpRequest) -> str:
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip or 'unknown'


def get_user_agent(request: HttpRequest) -> str:
    """Get user agent from request"""
    return request.META.get('HTTP_USER_AGENT', 'unknown')


def is_ajax_request(request: HttpRequest) -> bool:
    """Check if request is AJAX/API request"""
    return request.headers.get('X-Requested-With') == 'XMLHttpRequest' or \
           request.content_type == 'application/json' or \
           request.path.startswith('/api/')


def get_request_metadata(request: HttpRequest) -> dict:
    """Get comprehensive request metadata for audit logging"""
    return {
        'ip_address': get_client_ip(request),
        'user_agent': get_user_agent(request),
        'method': request.method,
        'path': request.path,
        'query_params': dict(request.GET.items()),
        'is_ajax': is_ajax_request(request),
        'referer': request.META.get('HTTP_REFERER', ''),
        'content_type': request.content_type or '',
    }
