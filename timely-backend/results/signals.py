# results/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Result, LeaderboardEntry
from .services.compute import recompute_event_standings
from .consumers import send_result_update, send_leaderboard_update, send_standings_recomputed
from .serializers import ResultSerializer, LeaderboardEntrySerializer


@receiver(post_save, sender=Result)
def result_saved(sender, instance, created, **kwargs):
    """Handle result save/update"""
    if created:
        # New result created
        async_to_sync(send_result_update)(
            get_channel_layer(),
            instance.fixture.event.id,
            instance,
            'created'
        )
    else:
        # Result updated
        async_to_sync(send_result_update)(
            get_channel_layer(),
            instance.fixture.event.id,
            instance,
            'updated'
        )
    
    # Recompute standings if result is final
    if instance.status == instance.Status.FINAL:
        with transaction.atomic():
            leaderboard = recompute_event_standings(instance.fixture.event.id)
            
            # Send leaderboard update
            serializer = LeaderboardEntrySerializer(leaderboard, many=True)
            async_to_sync(send_leaderboard_update)(
                get_channel_layer(),
                instance.fixture.event.id,
                serializer.data
            )
    
    # Send published update if result was published
    if instance.published and instance.status == instance.Status.PUBLISHED:
        async_to_sync(send_result_update)(
            get_channel_layer(),
            instance.fixture.event.id,
            instance,
            'published'
        )


@receiver(post_save, sender=LeaderboardEntry)
def leaderboard_entry_saved(sender, instance, created, **kwargs):
    """Handle leaderboard entry save/update"""
    # Send leaderboard update
    serializer = LeaderboardEntrySerializer(instance)
    async_to_sync(send_leaderboard_update)(
        get_channel_layer(),
        instance.event.id,
        [serializer.data]
    )


@receiver(post_delete, sender=Result)
def result_deleted(sender, instance, **kwargs):
    """Handle result deletion"""
    # Recompute standings after deletion
    with transaction.atomic():
        leaderboard = recompute_event_standings(instance.fixture.event.id)
        
        # Send standings recomputed message
        serializer = LeaderboardEntrySerializer(leaderboard, many=True)
        async_to_sync(send_standings_recomputed)(
            get_channel_layer(),
            instance.fixture.event.id,
            serializer.data
        )
