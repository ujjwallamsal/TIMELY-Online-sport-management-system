"""
Media Hub signals for realtime updates via Django Channels.
Broadcasts media events to appropriate WebSocket groups.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import MediaItem


def send_realtime_update(group_name: str, event_type: str, data: dict):
    """
    Send realtime update via Django Channels.
    Safe no-op if Channels is not available.
    """
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'media_update',
                    'event_type': event_type,
                    'data': data
                }
            )
    except ImportError:
        # Channels not available, silently ignore
        pass
    except Exception as e:
        # Log error but don't fail the operation
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to send realtime update: {e}")


@receiver(post_save, sender=MediaItem)
def media_item_saved(sender, instance, created, **kwargs):
    """Handle media item creation and updates"""
    
    # Prepare minimal payload for realtime updates
    data = {
        'id': instance.id,
        'kind': instance.kind,
        'status': instance.status,
        'featured': instance.featured,
        'event_id': instance.event_id,
        'fixture_id': instance.fixture_id,
        'uploader_id': instance.uploader_id,
        'created_at': instance.created_at.isoformat(),
    }
    
    if created:
        # New media uploaded
        send_realtime_update(
            f"media:user:{instance.uploader_id}",
            'media.uploaded',
            data
        )
        
        # Notify event/fixture groups
        if instance.event_id:
            send_realtime_update(
                f"media:event:{instance.event_id}",
                'media.uploaded',
                data
            )
        
        if instance.fixture_id:
            send_realtime_update(
                f"media:fixture:{instance.fixture_id}",
                'media.uploaded',
                data
            )
    else:
        # Media updated (status change, featured toggle, etc.)
        if instance.status == MediaItem.Status.APPROVED:
            # Media approved - notify public and relevant groups
            send_realtime_update(
                "media:public",
                'media.approved',
                data
            )
            
            if instance.event_id:
                send_realtime_update(
                    f"media:event:{instance.event_id}",
                    'media.approved',
                    data
                )
            
            if instance.fixture_id:
                send_realtime_update(
                    f"media:fixture:{instance.fixture_id}",
                    'media.approved',
                    data
                )
        
        elif instance.status == MediaItem.Status.REJECTED:
            # Media rejected - notify uploader
            send_realtime_update(
                f"media:user:{instance.uploader_id}",
                'media.rejected',
                data
            )
        
        elif instance.status == MediaItem.Status.HIDDEN:
            # Media hidden - notify public group
            send_realtime_update(
                "media:public",
                'media.hidden',
                data
            )
        
        # Featured status change
        if instance.featured:
            send_realtime_update(
                "media:public",
                'media.featured',
                data
            )


@receiver(post_delete, sender=MediaItem)
def media_item_deleted(sender, instance, **kwargs):
    """Handle media item deletion"""
    
    data = {
        'id': instance.id,
        'kind': instance.kind,
        'status': instance.status,
        'event_id': instance.event_id,
        'fixture_id': instance.fixture_id,
        'uploader_id': instance.uploader_id,
    }
    
    # Notify all relevant groups about deletion
    send_realtime_update(
        f"media:user:{instance.uploader_id}",
        'media.deleted',
        data
    )
    
    if instance.event_id:
        send_realtime_update(
            f"media:event:{instance.event_id}",
            'media.deleted',
            data
        )
    
    if instance.fixture_id:
        send_realtime_update(
            f"media:fixture:{instance.fixture_id}",
            'media.deleted',
            data
        )
    
    # If it was public, notify public group
    if instance.is_public:
        send_realtime_update(
            "media:public",
            'media.deleted',
            data
        )
