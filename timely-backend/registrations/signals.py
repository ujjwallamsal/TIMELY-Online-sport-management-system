# registrations/signals.py
from __future__ import annotations
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Registration
from payments.models import Payment

@receiver(post_save, sender=Registration)
def create_payment_for_registration(sender, instance: Registration, created: bool, **kwargs):
    if not created:
        return
    if not instance.payments.exists():
        Payment.objects.create(
            user=instance.user,
            registration=instance,
            amount_cents=getattr(instance, "fee_cents", 0) or 0,
            currency="AUD",
            provider="DEV",
            status="PENDING",
        )
