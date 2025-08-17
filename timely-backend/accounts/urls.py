# accounts/urls.py
from django.urls import path
from .views import (
    request_password_reset,
    confirm_password_reset,
    request_email_verification,
    verify_email,
)
from .views_verify import RequestEmailVerification, VerifyEmail

app_name = "accounts"

urlpatterns = [
    path("password/reset/request/", request_password_reset, name="password-reset-request"),
    path("password/reset/confirm/", confirm_password_reset, name="password-reset-confirm"),
    path("email/verify/request/", request_email_verification, name="request-email-verification"),
    path("email/verify/", verify_email, name="verify-email"),
    path("request-email-verification/", RequestEmailVerification.as_view()),
    path("verify/", VerifyEmail.as_view()),
]
