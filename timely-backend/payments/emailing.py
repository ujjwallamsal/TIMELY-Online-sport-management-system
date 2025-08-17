# payments/emailing.py
from __future__ import annotations
from django.core.mail import send_mail
from django.conf import settings

def send_registration_receipt(payment) -> None:
    """
    Sends a confirmation email for a SUCCEEDED registration payment.
    In dev, this prints to console (EMAIL_BACKEND).
    """
    user = payment.user
    to_email = getattr(user, "email", None)
    if not to_email:
        return

    amount = f"{payment.amount_cents/100:.2f} {payment.currency}"
    body = (
        "Hi,\n\n"
        "Thanks for registering!\n\n"
        f"Amount: {amount}\n"
        f"Registration ID: {getattr(payment.registration, 'id', None)}\n"
        f"Payment ID: {payment.id}\n"
        f"Status: {payment.status}\n\n"
        "See you at the event!\n— Timely"
    )

    send_mail(
        subject="Your registration is confirmed ✅",
        message=body,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@timely.local"),
        recipient_list=[to_email],
        fail_silently=True,
    )
