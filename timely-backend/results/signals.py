# results/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Result
from events.realtime_service import realtime_service


@receiver(post_save, sender=Result)
def result_saved(sender, instance, created, **kwargs):
    """Broadcast result update when a result is saved"""
    if instance.fixture and instance.fixture.event:
        # Update leaderboard
        realtime_service.update_leaderboard(instance.fixture.event, instance)
        
        # Broadcast results update
        realtime_service.broadcast_results_update(instance.fixture.event, instance)


@receiver(post_delete, sender=Result)
def result_deleted(sender, instance, **kwargs):
    """Broadcast result update when a result is deleted"""
    if instance.fixture and instance.fixture.event:
        # Recompute leaderboard without this result
        realtime_service.broadcast_results_update(instance.fixture.event)