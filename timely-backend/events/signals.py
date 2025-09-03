from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Event, Division


@receiver(post_save, sender=Event)
def event_saved(sender, instance, created, **kwargs):
    """Send realtime update when event is saved"""
    action = 'created' if created else 'updated'
    _send_event_update(instance, action)


@receiver(post_delete, sender=Event)
def event_deleted(sender, instance, **kwargs):
    """Send realtime update when event is deleted"""
    _send_event_update(instance, 'deleted')


@receiver(post_save, sender=Division)
def division_saved(sender, instance, created, **kwargs):
    """Send realtime update when division is saved"""
    action = 'division_created' if created else 'division_updated'
    _send_event_update(instance.event, action, {'division_id': instance.id})


@receiver(post_delete, sender=Division)
def division_deleted(sender, instance, **kwargs):
    """Send realtime update when division is deleted"""
    _send_event_update(instance.event, 'division_deleted', {'division_id': instance.id})


def _send_event_update(event, action, extra_data=None):
    """Send realtime update via WebSocket (safe no-op if Channels not available)"""
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        if channel_layer:
            payload = {
                'type': 'event_update',
                'event_id': event.id,
                'action': action,
                'data': {
                    'id': event.id,
                    'name': event.name,
                    'lifecycle_status': event.lifecycle_status,
                    'start_datetime': event.start_datetime.isoformat(),
                    'end_datetime': event.end_datetime.isoformat(),
                    'phase': event.phase,
                }
            }
            if extra_data:
                payload['data'].update(extra_data)
            
            # Send to list subscribers
            async_to_sync(channel_layer.group_send)(
                'events_list',
                payload
            )
            
            # Send to specific event subscribers
            async_to_sync(channel_layer.group_send)(
                f'events_item_{event.id}',
                payload
            )
    except (ImportError, Exception):
        # Channels not available or any other error, silently continue
        pass
