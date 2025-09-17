# realtime/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from results.models import Result
from api.models import Announcement
from .services import broadcast_result_update, broadcast_announcement_update


@receiver(post_save, sender=Result)
def result_created_or_updated(sender, instance, created, **kwargs):
    """Broadcast real-time update when result is created or updated"""
    if created:
        message = f"New result recorded: {instance.fixture.home.name} {instance.home_score}-{instance.away_score} {instance.fixture.away.name}"
    else:
        message = f"Result updated: {instance.fixture.home.name} {instance.home_score}-{instance.away_score} {instance.fixture.away.name}"
    
    broadcast_result_update(
        instance.fixture.event.id,
        instance,
        message
    )


@receiver(post_save, sender=Announcement)
def announcement_created_or_updated(sender, instance, created, **kwargs):
    """Broadcast real-time update when announcement is created or updated"""
    if created:
        message = f"New announcement: {instance.subject}"
    else:
        message = f"Announcement updated: {instance.subject}"
    
    broadcast_announcement_update(
        instance.event.id,
        instance,
        message
    )


@receiver(post_delete, sender=Announcement)
def announcement_deleted(sender, instance, **kwargs):
    """Broadcast real-time update when announcement is deleted"""
    broadcast_announcement_update(
        instance.event.id,
        None,
        f"Announcement removed: {instance.subject}"
    )