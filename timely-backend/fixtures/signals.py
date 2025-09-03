# fixtures/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone

from .models import Fixture, FixtureEntry


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
                    'round_no': instance.round_no,
                    'starts_at': instance.starts_at.isoformat() if instance.starts_at else None,
                    'ends_at': instance.ends_at.isoformat() if instance.ends_at else None,
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


@receiver(post_save, sender=FixtureEntry)
def fixture_entry_post_save(sender, instance, created, **kwargs):
    """Send realtime update when fixture entry is saved"""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f"fixtures:event:{instance.fixture.event.id}"
            
            # Prepare message data
            message_data = {
                'type': 'fixtures.entry_updated',
                'event_id': instance.fixture.event.id,
                'fixture_id': instance.fixture.id,
                'entry': {
                    'id': instance.id,
                    'side': instance.side,
                    'team_id': instance.team_id,
                    'participant_id': instance.participant_id,
                    'name': instance.name,
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


@receiver(post_delete, sender=FixtureEntry)
def fixture_entry_post_delete(sender, instance, **kwargs):
    """Send realtime update when fixture entry is deleted"""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f"fixtures:event:{instance.fixture.event.id}"
            
            # Prepare message data
            message_data = {
                'type': 'fixtures.entry_deleted',
                'event_id': instance.fixture.event.id,
                'fixture_id': instance.fixture.id,
                'entry_id': instance.id
            }
            
            # Send to group
            async_to_sync(channel_layer.group_send)(group_name, message_data)
            
    except ImportError:
        # Channels not available, skip realtime updates
        pass
    except Exception:
        # Ignore any other errors to prevent signal failures
        pass