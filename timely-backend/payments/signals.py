# payments/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

from .models import PaymentIntent


def safe_broadcast(group_name: str, event_type: str, data: dict):
    """
    Safely broadcast to Channels group with fallback
    """
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'payment_update',
                    'event_type': event_type,
                    'data': data
                }
            )
    except ImportError:
        # Channels not available, safe no-op
        pass
    except Exception:
        # Any other error, safe no-op
        pass


@receiver(post_save, sender=PaymentIntent)
def payment_status_changed(sender, instance, created, **kwargs):
    """
    Broadcast when payment status changes
    """
    if not created:  # Only for updates, not creation
        # Broadcast to user group
        user_group = f"payments:user:{instance.registration.user.id}"
        safe_broadcast(user_group, 'payment.status_changed', {
            'payment_intent_id': instance.stripe_payment_intent_id,
            'status': instance.status,
            'amount_cents': instance.amount_cents,
            'currency': instance.currency,
            'registration_id': instance.registration.id
        })
        
        # Broadcast to event organizer group
        event_group = f"payments:event:{instance.registration.event.id}"
        safe_broadcast(event_group, 'payment.status_changed', {
            'payment_intent_id': instance.stripe_payment_intent_id,
            'user_id': instance.registration.user.id,
            'status': instance.status,
            'amount_cents': instance.amount_cents,
            'currency': instance.currency,
            'registration_id': instance.registration.id
        })