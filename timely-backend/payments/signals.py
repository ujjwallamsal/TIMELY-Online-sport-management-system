# payments/signals.py
from __future__ import annotations
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import PaymentIntent
from .emailing import send_registration_receipt

@receiver(post_save, sender=PaymentIntent)
def on_payment_intent_saved(sender, instance: PaymentIntent, created: bool, **kwargs):
    # Only send on transitions to succeeded
    if instance.status == "succeeded":
        send_registration_receipt(instance)
