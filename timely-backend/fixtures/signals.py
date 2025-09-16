# fixtures/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone

from .models import Fixture


@receiver(post_save, sender=Fixture)
def fixture_post_save(sender, instance, created, **kwargs):
    """Send realtime update when fixture is saved"""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f"fixtures:event:{instance.event.id}"
            
            # Prepare message data
            message_data = {
                'type': 'fixtures.updated',
                'event_id': instance.event.id,
                'fixture': {
                    'id': instance.id,
                    'round': instance.round,
                    'phase': instance.phase,
                    'home_id': instance.home_id,
                    'away_id': instance.away_id,
                    'start_at': instance.start_at.isoformat() if instance.start_at else None,
                    'venue_id': instance.venue_id,
                    'status': instance.status,
                    'created': created
                }
            }
            
            # Send to group
            async_to_sync(channel_layer.group_send)(group_name, message_data)
            
    except ImportError:
        # Channels not available, skip realtime updates
        pass
    except Exception:
        # Ignore any other errors to prevent signal failures
        pass


@receiver(post_delete, sender=Fixture)
def fixture_post_delete(sender, instance, **kwargs):
    """Send realtime update when fixture is deleted"""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f"fixtures:event:{instance.event.id}"
            
            # Prepare message data
            message_data = {
                'type': 'fixtures.deleted',
                'event_id': instance.event.id,
                'fixture_id': instance.id
            }
            
            # Send to group
            async_to_sync(channel_layer.group_send)(group_name, message_data)
            
    except ImportError:
        # Channels not available, skip realtime updates
        pass
    except Exception:
        # Ignore any other errors to prevent signal failures
        pass

