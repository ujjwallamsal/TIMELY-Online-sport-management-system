# events/signals.py
"""
Django signals for real-time broadcasting.
Automatically broadcast updates when models are created/updated.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction

from results.models import Result, LeaderboardEntry
from fixtures.models import Fixture
from .models import Announcement
from .realtime_service import realtime_service


@receiver(post_save, sender=Result)
def broadcast_result_update(sender, instance, created, **kwargs):
    """Broadcast when a result is created or updated"""
    if instance.fixture and instance.fixture.event:
        event_id = instance.fixture.event.id
        
        # Prepare result data
        result_data = {
            'result_id': instance.id,
            'fixture_id': instance.fixture.id,
            'home_team_id': instance.fixture.home.id if instance.fixture.home else None,
            'away_team_id': instance.fixture.away.id if instance.fixture.away else None,
            'home_score': instance.home_score,
            'away_score': instance.away_score,
            'winner_id': instance.winner.id if instance.winner else None,
            'is_draw': instance.is_draw,
            'finalized_at': instance.finalized_at.isoformat() if instance.finalized_at else None,
            'created': created
        }
        
        # Broadcast result update
        realtime_service.broadcast_result_update(event_id, result_data)
        
        # Recompute and broadcast leaderboard
        realtime_service.broadcast_event_leaderboard(event_id)


@receiver(post_save, sender=Fixture)
def broadcast_fixture_update(sender, instance, created, **kwargs):
    """Broadcast when a fixture is created, updated, or rescheduled"""
    if instance.event:
        event_id = instance.event.id
        
        # Broadcast schedule update
        realtime_service.broadcast_fixture_schedule(event_id, instance.id)


@receiver(post_delete, sender=Fixture)
def broadcast_fixture_deletion(sender, instance, **kwargs):
    """Broadcast when a fixture is deleted"""
    if instance.event:
        event_id = instance.event.id
        
        # Broadcast updated schedule (without the deleted fixture)
        realtime_service.broadcast_fixture_schedule(event_id)


@receiver(post_save, sender=Result)
def update_leaderboard_entries(sender, instance, created, **kwargs):
    """Update LeaderboardEntry model when results change"""
    if instance.fixture and instance.fixture.event:
        event = instance.fixture.event
        
        # Update leaderboard entries for both teams
        with transaction.atomic():
            # Update home team entry
            if instance.fixture.home:
                home_entry, _ = LeaderboardEntry.objects.get_or_create(
                    event=event,
                    team=instance.fixture.home
                )
                _update_leaderboard_entry(home_entry, instance, is_home_team=True)
            
            # Update away team entry
            if instance.fixture.away:
                away_entry, _ = LeaderboardEntry.objects.get_or_create(
                    event=event,
                    team=instance.fixture.away
                )
                _update_leaderboard_entry(away_entry, instance, is_home_team=False)


def _update_leaderboard_entry(entry, result, is_home_team):
    """Update a single leaderboard entry based on result"""
    if is_home_team:
        goals_for = result.home_score
        goals_against = result.away_score
    else:
        goals_for = result.away_score
        goals_against = result.home_score
    
    # Update stats
    entry.gf += goals_for
    entry.ga += goals_against
    entry.pts += 1  # Will be adjusted based on win/loss/draw
    
    if result.is_draw:
        entry.d += 1
        entry.pts -= 1  # Remove the point we added above, draw = 1 point
    elif (is_home_team and result.home_score > result.away_score) or \
         (not is_home_team and result.away_score > result.home_score):
        # Win
        entry.w += 1
        entry.pts += 2  # Win = 3 points total (1 + 2)
    else:
        # Loss
        entry.l += 1
        entry.pts -= 1  # Loss = 0 points (remove the point we added)
    
    entry.save()


@receiver(post_save, sender=Announcement)
def broadcast_announcement(sender, instance, created, **kwargs):
    """Broadcast when an announcement is created or updated"""
    if created and instance.is_active:
        # Only broadcast new announcements that are active
        instance.broadcast()