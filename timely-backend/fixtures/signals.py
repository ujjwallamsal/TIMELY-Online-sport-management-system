# fixtures/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Fixture
from events.realtime_service import realtime_service


@receiver(post_save, sender=Fixture)
def fixture_saved(sender, instance, created, **kwargs):
    """Broadcast schedule update when a fixture is saved"""
    if instance.event:
        action = 'created' if created else 'updated'
        realtime_service.broadcast_schedule_update(instance.event, instance, action)


@receiver(post_delete, sender=Fixture)
def fixture_deleted(sender, instance, **kwargs):
    """Broadcast schedule update when a fixture is deleted"""
    if instance.event:
        realtime_service.broadcast_schedule_update(instance.event, action='deleted')