"""
Django signals for notifications and messaging system.
Includes Channels WebSocket broadcasting with safe no-op fallback.
"""
from __future__ import annotations

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Notification, Message, MessageThread, MessageParticipant
from .services.email_sms import send_notification_email, send_notification_sms

User = get_user_model()

# Safe import for Channels - no-op if not available
try:
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    CHANNELS_AVAILABLE = True
except ImportError:
    CHANNELS_AVAILABLE = False
    get_channel_layer = None
    async_to_sync = None


def _send_websocket_message(group_name: str, message: dict):
    """Send WebSocket message with safe fallback"""
    if not CHANNELS_AVAILABLE:
        return
    
    try:
        # Ensure group name is valid for Channels
        if not group_name or len(group_name) >= 100:
            return
            
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(group_name, {
                'type': 'websocket_message',
                'message': message
            })
    except Exception as e:
        # Log error but don't crash the application
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to send WebSocket message: {e}")


def _create_notification(user, kind: str, topic: str, title: str, body: str, link_url: str = None):
    """Helper to create notification and send via email/SMS"""
    notification = Notification.objects.create(
        user=user,
        kind=kind,
        topic=topic,
        title=title,
        body=body,
        link_url=link_url
    )
    
    # Send email/SMS (stubs)
    send_notification_email(notification)
    send_notification_sms(notification)
    
    return notification


# Registration signals
@receiver(post_save, sender='registrations.Registration')
def registration_decision_notify(sender, instance, created, **kwargs):
    """Notify user when registration decision is made"""
    if created:
        return
    
    # Check if status changed to approved/rejected/waitlisted
    if hasattr(instance, '_previous_status'):
        old_status = instance._previous_status
        new_status = getattr(instance, 'status', None)
        
        if old_status != new_status:
            if new_status == 'approved':
                _create_notification(
                    user=instance.user,
                    kind='success',
                    topic='registration',
                    title='Registration Approved',
                    body=f'Your registration for {instance.event.name} has been approved.',
                    link_url=f'/events/{instance.event.id}/'
                )
            elif new_status == 'rejected':
                _create_notification(
                    user=instance.user,
                    kind='warning',
                    topic='registration',
                    title='Registration Not Approved',
                    body=f'Your registration for {instance.event.name} was not approved.',
                    link_url=f'/events/{instance.event.id}/'
                )
            elif new_status == 'waitlisted':
                _create_notification(
                    user=instance.user,
                    kind='info',
                    topic='registration',
                    title='Registration Waitlisted',
                    body=f'Your registration for {instance.event.name} has been waitlisted.',
                    link_url=f'/events/{instance.event.id}/'
                )


@receiver(pre_save, sender='registrations.Registration')
def registration_pre_save(sender, instance, **kwargs):
    """Store previous status for comparison"""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._previous_status = getattr(old_instance, 'status', None)
        except sender.DoesNotExist:
            instance._previous_status = None
    else:
        instance._previous_status = None


# Schedule/Fixtures signals
@receiver(post_save, sender='fixtures.Fixture')
def fixture_schedule_notify(sender, instance, created, **kwargs):
    """Notify participants when fixture is published or rescheduled"""
    if created:
        # New fixture published
        _create_notification(
            user=instance.event.organizers.first(),  # Notify organizers
            kind='info',
            topic='schedule',
            title='New Fixture Published',
            body=f'New fixture has been published for {instance.event.name}.',
            link_url=f'/events/{instance.event.id}/fixtures/'
        )
    else:
        # Check if schedule changed
        if hasattr(instance, '_previous_starts_at'):
            old_starts_at = instance._previous_starts_at
            if old_starts_at != instance.starts_at:
                # Notify all participants
                participants = User.objects.filter(
                    registrations__event=instance.event,
                    registrations__is_paid=True
                ).distinct()
                
                for participant in participants:
                    _create_notification(
                        user=participant,
                        kind='warning',
                        topic='schedule',
                        title='Schedule Change',
                        body=f'Fixture schedule has changed for {instance.event.name}.',
                        link_url=f'/events/{instance.event.id}/fixtures/'
                    )


@receiver(pre_save, sender='fixtures.Fixture')
def fixture_pre_save(sender, instance, **kwargs):
    """Store previous starts_at for comparison"""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._previous_starts_at = old_instance.starts_at
        except sender.DoesNotExist:
            instance._previous_starts_at = None
    else:
        instance._previous_starts_at = None


# Results signals
@receiver(post_save, sender='results.Result')
def result_update_notify(sender, instance, created, **kwargs):
    """Notify participants when results are updated"""
    if created or not created:  # Both new and updated results
        _create_notification(
            user=instance.participant,
            kind='info',
            topic='results',
            title='Results Updated',
            body=f'Your results for {instance.fixture.event.name} have been updated.',
            link_url=f'/events/{instance.fixture.event.id}/results/'
        )


# Payment signals
@receiver(post_save, sender='payments.Payment')
def payment_confirmation_notify(sender, instance, created, **kwargs):
    """Notify user when payment is confirmed"""
    if created and instance.status == 'paid':
        _create_notification(
            user=instance.user,
            kind='success',
            topic='payment',
            title='Payment Confirmed',
            body=f'Your payment of ${instance.amount/100:.2f} has been confirmed.',
            link_url=f'/payments/{instance.id}/'
        )


# Ticket signals
@receiver(post_save, sender='tickets.Ticket')
def ticket_issued_notify(sender, instance, created, **kwargs):
    """Notify user when ticket is issued"""
    if created:
        _create_notification(
            user=instance.order.user,
            kind='success',
            topic='ticket',
            title='Ticket Issued',
            body=f'Your ticket for {instance.ticket_type.event.name} has been issued.',
            link_url=f'/tickets/{instance.id}/'
        )


# Notification signals
@receiver(post_save, sender=Notification)
def notification_created_websocket(sender, instance, created, **kwargs):
    """Send WebSocket notification when new notification is created"""
    if created:
        group_name = f"notify:user:{instance.user.id}"
        message = {
            'type': 'notify.new',
            'data': {
                'id': str(instance.id),
                'title': instance.title,
                'body': instance.body,
                'topic': instance.topic,
                'kind': instance.kind,
                'link_url': instance.link_url,
                'created_at': instance.created_at.isoformat()
            }
        }
        _send_websocket_message(group_name, message)


# Message signals
@receiver(post_save, sender=Message)
def message_created_websocket(sender, instance, created, **kwargs):
    """Send WebSocket message when new message is created"""
    if created and not instance.deleted_at:
        group_name = f"messages:thread:{instance.thread.id}"
        message = {
            'type': 'message.new',
            'data': {
                'thread_id': str(instance.thread.id),
                'message_id': str(instance.id),
                'body': instance.body,
                'sender': {
                    'id': instance.sender.id,
                    'email': instance.sender.email,
                    'name': instance.sender.get_full_name()
                },
                'created_at': instance.created_at.isoformat()
            }
        }
        _send_websocket_message(group_name, message)


@receiver(post_save, sender=MessageThread)
def thread_updated_websocket(sender, instance, created, **kwargs):
    """Send WebSocket message when thread is updated"""
    if not created:  # Only for updates, not creation
        group_name = f"messages:thread:{instance.id}"
        message = {
            'type': 'thread.updated',
            'data': {
                'thread_id': str(instance.id),
                'title': instance.title,
                'updated_at': timezone.now().isoformat()
            }
        }
        _send_websocket_message(group_name, message)


@receiver(post_save, sender=MessageParticipant)
def participant_added_websocket(sender, instance, created, **kwargs):
    """Send WebSocket message when participant is added to thread"""
    if created:
        group_name = f"messages:thread:{instance.thread.id}"
        message = {
            'type': 'thread.updated',
            'data': {
                'thread_id': str(instance.thread.id),
                'participant_added': {
                    'id': instance.user.id,
                    'email': instance.user.email,
                    'name': instance.user.get_full_name(),
                    'role': instance.role
                },
                'updated_at': timezone.now().isoformat()
            }
        }
        _send_websocket_message(group_name, message)