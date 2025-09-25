# tickets/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings

from .models import TicketOrder, Ticket
from notifications.models import Notification


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
                    'type': 'ticket_update',
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


@receiver(post_save, sender=TicketOrder)
def order_updated(sender, instance, created, **kwargs):
    """
    Broadcast when order status changes
    """
    if not created:  # Only for updates, not creation
        # Create a notification for the buyer
        try:
            Notification.objects.create(
                user=instance.user,
                kind='info',
                topic='ticket',
                title='Order status updated',
                body=f'Your ticket order {instance.id} is now {instance.status}.',
                link_url=None
            )
        except Exception:
            pass

        # Broadcast to user group
        user_group = f"orders:user:{instance.user.id}"
        safe_broadcast(user_group, 'order.updated', {
            'order_id': instance.id,
            'status': instance.status,
            'total_cents': instance.total_cents,
            'currency': instance.currency
        })
        
        # Broadcast to event organizer group (use numeric foreign key field)
        event_group = f"orders:event:{instance.event_id}"
        safe_broadcast(event_group, 'order.updated', {
            'order_id': instance.id,
            'user_id': instance.user.id,
            'status': instance.status,
            'total_cents': instance.total_cents,
            'currency': instance.currency
        })


@receiver(post_save, sender=Ticket)
def ticket_issued(sender, instance, created, **kwargs):
    """
    Broadcast when ticket is issued
    """
    if created:
        # Broadcast to user group
        user_group = f"orders:user:{instance.order.user.id}"
        safe_broadcast(user_group, 'ticket.issued', {
            'ticket_id': instance.id,
            'order_id': instance.order.id,
            'serial': instance.serial,
            'ticket_type': instance.ticket_type.name,
            'event_name': instance.order.event_id
        })
        
        # Broadcast to event organizer group
        event_group = f"orders:event:{instance.order.event_id}"
        safe_broadcast(event_group, 'ticket.issued', {
            'ticket_id': instance.id,
            'order_id': instance.order.id,
            'user_id': instance.order.user.id,
            'serial': instance.serial,
            'ticket_type': instance.ticket_type.name
        })


@receiver(post_save, sender=Ticket)
def ticket_used(sender, instance, **kwargs):
    """
    Broadcast when ticket is used
    """
    if instance.status == 'used':
        # Broadcast to user group
        user_group = f"orders:user:{instance.order.user.id}"
        safe_broadcast(user_group, 'ticket.used', {
            'ticket_id': instance.id,
            'order_id': instance.order.id,
            'serial': instance.serial,
            'used_at': instance.used_at.isoformat() if instance.used_at else None
        })
        
        # Broadcast to event organizer group
        event_group = f"orders:event:{instance.order.event_id}"
        safe_broadcast(event_group, 'ticket.used', {
            'ticket_id': instance.id,
            'order_id': instance.order.id,
            'user_id': instance.order.user.id,
            'serial': instance.serial,
            'used_at': instance.used_at.isoformat() if instance.used_at else None
        })
