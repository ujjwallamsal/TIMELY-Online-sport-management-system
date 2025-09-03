"""
Signals for registration realtime updates via Django Channels
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Registration, RegistrationDocument


def _send_registration_update(registration, event_type, data=None):
    """
    Send realtime update via Django Channels (safe no-op if Channels missing)
    """
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
        
        # Prepare payload
        payload = {
            'type': 'registration_update',
            'event_type': event_type,
            'registration_id': registration.id,
            'data': data or {}
        }
        
        # Send to participant
        async_to_sync(channel_layer.group_send)(
            f'registrations_user_{registration.user.id}',
            payload
        )
        
        # Send to event organizer
        async_to_sync(channel_layer.group_send)(
            f'registrations_event_{registration.event.id}',
            payload
        )
        
    except ImportError:
        # Django Channels not available, silently continue
        pass
    except Exception as e:
        # Log error but don't break the main flow
        print(f"Warning: Failed to send realtime update: {e}")


@receiver(post_save, sender=Registration)
def registration_saved(sender, instance, created, **kwargs):
    """Handle registration save events"""
    if created:
        # New registration created
        _send_registration_update(
            instance, 
            'registration.created',
            {
                'status': instance.status,
                'event_name': instance.event.name,
                'user_email': instance.user.email
            }
        )
    else:
        # Registration updated
        _send_registration_update(
            instance,
            'registration.updated',
            {
                'status': instance.status,
                'payment_status': instance.payment_status,
                'event_name': instance.event.name
            }
        )


@receiver(post_save, sender=RegistrationDocument)
def document_uploaded(sender, instance, created, **kwargs):
    """Handle document upload events"""
    if created:
        _send_registration_update(
            instance.registration,
            'registration.document.uploaded',
            {
                'doc_type': instance.doc_type,
                'registration_id': instance.registration.id
            }
        )


@receiver(post_delete, sender=RegistrationDocument)
def document_deleted(sender, instance, **kwargs):
    """Handle document deletion events"""
    _send_registration_update(
        instance.registration,
        'registration.document.deleted',
        {
            'doc_type': instance.doc_type,
            'registration_id': instance.registration.id
        }
    )