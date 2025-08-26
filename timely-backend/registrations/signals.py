# registrations/signals.py
from __future__ import annotations
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Registration
from payments.models import PaymentIntent

@receiver(post_save, sender=Registration)
def create_payment_intent_for_registration(sender, instance: Registration, created: bool, **kwargs):
    if not created:
        return
    
    # Only create payment intent if registration requires payment
    if instance.requires_payment and not instance.payment_intents.exists():
        PaymentIntent.objects.create(
            amount_cents=instance.event.fee_cents,
            currency="AUD",
            status="requires_payment_method",
            registration=instance,
        )
