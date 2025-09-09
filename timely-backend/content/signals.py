# content/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import Page, News, Banner


def send_realtime_update(group_name, event_type, data):
    """
    Send realtime update via WebSocket channels.
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
                    'type': 'content_update',
                    'event': event_type,
                    'data': data
                }
            )
    except ImportError:
        # Channels not available, silently ignore
        pass
    except Exception:
        # Any other error, silently ignore
        pass


@receiver(post_save, sender=Page)
def page_published_signal(sender, instance, created, **kwargs):
    """Send realtime update when page is published or updated."""
    if instance.is_published_now():
        send_realtime_update(
            'content:pages',
            'content.published',
            {
                'id': instance.id,
                'slug': instance.slug,
                'title': instance.title,
                'updated_at': instance.updated_at.isoformat()
            }
        )


@receiver(post_save, sender=News)
def news_published_signal(sender, instance, created, **kwargs):
    """Send realtime update when news article is published or updated."""
    if instance.is_published_now():
        send_realtime_update(
            'content:news',
            'content.published',
            {
                'id': instance.id,
                'title': instance.title,
                'author': instance.author.get_full_name() if instance.author else None,
                'created_at': instance.created_at.isoformat(),
                'updated_at': instance.updated_at.isoformat()
            }
        )


@receiver(post_save, sender=Banner)
def banner_activated_signal(sender, instance, created, **kwargs):
    """Send realtime update when banner becomes active."""
    if instance.is_active_now():
        send_realtime_update(
            'content:banners',
            'banner.activated',
            {
                'id': instance.id,
                'title': instance.title,
                'image_url': instance.image.url if instance.image else None,
                'link_url': instance.link_url,
                'created_at': instance.created_at.isoformat()
            }
        )


@receiver(post_delete, sender=Page)
def page_deleted_signal(sender, instance, **kwargs):
    """Send realtime update when page is deleted."""
    send_realtime_update(
        'content:pages',
        'content.deleted',
        {
            'id': instance.id,
            'slug': instance.slug,
            'title': instance.title
        }
    )


@receiver(post_delete, sender=News)
def news_deleted_signal(sender, instance, **kwargs):
    """Send realtime update when news article is deleted."""
    send_realtime_update(
        'content:news',
        'content.deleted',
        {
            'id': instance.id,
            'title': instance.title
        }
    )


@receiver(post_delete, sender=Banner)
def banner_deleted_signal(sender, instance, **kwargs):
    """Send realtime update when banner is deleted."""
    send_realtime_update(
        'content:banners',
        'banner.deleted',
        {
            'id': instance.id,
            'title': instance.title
        }
    )
