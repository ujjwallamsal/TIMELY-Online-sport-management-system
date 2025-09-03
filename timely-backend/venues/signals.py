# venues/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Venue, VenueSlot


def send_venue_update(venue_id, action, data=None):
    """
    Send realtime update for venue changes.
    Safe no-op if Channels is not configured.
    """
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        if channel_layer:
            # Send to venues list group
            async_to_sync(channel_layer.group_send)(
                'venues:list',
                {
                    'type': 'venue.updated',
                    'venue_id': venue_id,
                    'action': action,
                    'data': data or {}
                }
            )
            
            # Send to specific venue group
            async_to_sync(channel_layer.group_send)(
                f'venue:item:{venue_id}',
                {
                    'type': 'venue.updated',
                    'venue_id': venue_id,
                    'action': action,
                    'data': data or {}
                }
            )
    except ImportError:
        # Channels not configured, safe no-op
        pass
    except Exception:
        # Other errors, safe no-op
        pass


@receiver(post_save, sender=Venue)
def venue_post_save(sender, instance, created, **kwargs):
    """Send realtime update when venue is created or updated"""
    action = 'created' if created else 'updated'
    data = {
        'id': instance.id,
        'name': instance.name,
        'capacity': instance.capacity,
        'address': instance.address,
    }
    send_venue_update(instance.id, action, data)


@receiver(post_delete, sender=Venue)
def venue_post_delete(sender, instance, **kwargs):
    """Send realtime update when venue is deleted"""
    send_venue_update(instance.id, 'deleted')


@receiver(post_save, sender=VenueSlot)
def venue_slot_post_save(sender, instance, created, **kwargs):
    """Send realtime update when venue slot is created or updated"""
    action = 'slot_created' if created else 'slot_updated'
    data = {
        'slot_id': instance.id,
        'venue_id': instance.venue.id,
        'starts_at': instance.starts_at.isoformat(),
        'ends_at': instance.ends_at.isoformat(),
        'status': instance.status,
        'reason': instance.reason,
    }
    send_venue_update(instance.venue.id, action, data)


@receiver(post_delete, sender=VenueSlot)
def venue_slot_post_delete(sender, instance, **kwargs):
    """Send realtime update when venue slot is deleted"""
    data = {
        'slot_id': instance.id,
        'venue_id': instance.venue.id,
    }
    send_venue_update(instance.venue.id, 'slot_deleted', data)