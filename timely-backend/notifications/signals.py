# notifications/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Notification, NotificationUnread


@receiver(post_save, sender=Notification)
def update_unread_count_on_notification_save(sender, instance, created, **kwargs):
    """Update unread count when notification is created or modified"""
    if created:
        # New notification - increment count
        NotificationUnread.increment_for_user(instance.user)
    else:
        # Existing notification - recalculate to ensure accuracy
        NotificationUnread.update_count_for_user(instance.user)


@receiver(post_delete, sender=Notification)
def update_unread_count_on_notification_delete(sender, instance, **kwargs):
    """Update unread count when notification is deleted"""
    if not instance.read_at:  # Only decrement if it was unread
        NotificationUnread.decrement_for_user(instance.user)
    else:
        # Recalculate to ensure accuracy
        NotificationUnread.update_count_for_user(instance.user)