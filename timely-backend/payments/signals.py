# payments/signals.py
from __future__ import annotations
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Payment
from .emailing import send_registration_receipt

@receiver(post_save, sender=Payment)
def on_payment_saved(sender, instance: Payment, created: bool, **kwargs):
    # Only send on transitions to SUCCEEDED
    if instance.status == "SUCCEEDED":
        send_registration_receipt(instance)
