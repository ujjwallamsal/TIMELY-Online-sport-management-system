# realtime/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from events.models import Event
from venues.models import Venue, VenueSlot
from accounts.models import User
from registrations.models import Registration, RegistrationDocument
from tickets.models import TicketOrder, Ticket
from results.models import Result, LeaderboardEntry, AthleteStat
from teams.models import Team, TeamMember, TeamEventEntry
from notifications.models import Notification
from content.models import News, Gallery


def send_realtime_update(group_name, update_type, data):
    """Send realtime update to WebSocket group"""
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': update_type,
                    'data': data
                }
            )
    except Exception:
        # Silently continue if Channels is not available
        pass


# Event signals
@receiver(post_save, sender=Event)
def event_saved(sender, instance, created, **kwargs):
    """Send realtime update when event is saved"""
    action = 'created' if created else 'updated'
    
    data = {
        'id': instance.id,
        'name': instance.name,
        'sport': instance.sport,
        'lifecycle_status': instance.lifecycle_status,
        'start_datetime': instance.start_datetime.isoformat(),
        'end_datetime': instance.end_datetime.isoformat(),
        'phase': instance.phase,
        'created_by_id': instance.created_by_id,
        'action': action
    }
    
    # Send to admin group
    send_realtime_update('events:admin', 'event_update', data)
    
    # Send to organizer group
    send_realtime_update(f'events:org:{instance.created_by_id}', 'event_update', data)
    
    # Send to public group if published
    if instance.lifecycle_status == Event.LifecycleStatus.PUBLISHED:
        send_realtime_update('events:public', 'event_update', data)


@receiver(post_delete, sender=Event)
def event_deleted(sender, instance, **kwargs):
    """Send realtime update when event is deleted"""
    data = {
        'id': instance.id,
        'name': instance.name,
        'action': 'deleted'
    }
    
    # Send to admin group
    send_realtime_update('events:admin', 'event_update', data)
    
    # Send to organizer group
    send_realtime_update(f'events:org:{instance.created_by_id}', 'event_update', data)


# Venue signals
@receiver(post_save, sender=Venue)
def venue_saved(sender, instance, created, **kwargs):
    """Send realtime update when venue is saved"""
    action = 'created' if created else 'updated'
    
    data = {
        'id': instance.id,
        'name': instance.name,
        'address': instance.address,
        'capacity': instance.capacity,
        'created_by_id': instance.created_by_id,
        'action': action
    }
    
    # Send to admin group
    send_realtime_update('venues:admin', 'venue_update', data)
    
    # Send to organizer group
    send_realtime_update(f'venues:org:{instance.created_by_id}', 'venue_update', data)


@receiver(post_delete, sender=Venue)
def venue_deleted(sender, instance, **kwargs):
    """Send realtime update when venue is deleted"""
    data = {
        'id': instance.id,
        'name': instance.name,
        'action': 'deleted'
    }
    
    # Send to admin group
    send_realtime_update('venues:admin', 'venue_update', data)
    
    # Send to organizer group
    send_realtime_update(f'venues:org:{instance.created_by_id}', 'venue_update', data)


# Venue slot signals
@receiver(post_save, sender=VenueSlot)
def venue_slot_saved(sender, instance, created, **kwargs):
    """Send realtime update when venue slot is saved"""
    action = 'created' if created else 'updated'
    
    data = {
        'id': instance.id,
        'venue_id': instance.venue_id,
        'venue_name': instance.venue.name,
        'starts_at': instance.starts_at.isoformat(),
        'ends_at': instance.ends_at.isoformat(),
        'status': instance.status,
        'action': action
    }
    
    # Send to admin group
    send_realtime_update('venues:admin', 'venue_update', data)
    
    # Send to organizer group
    send_realtime_update(f'venues:org:{instance.venue.created_by_id}', 'venue_update', data)


@receiver(post_delete, sender=VenueSlot)
def venue_slot_deleted(sender, instance, **kwargs):
    """Send realtime update when venue slot is deleted"""
    data = {
        'id': instance.id,
        'venue_id': instance.venue_id,
        'venue_name': instance.venue.name,
        'action': 'deleted'
    }
    
    # Send to admin group
    send_realtime_update('venues:admin', 'venue_update', data)
    
    # Send to organizer group
    send_realtime_update(f'venues:org:{instance.venue.created_by_id}', 'venue_update', data)


# User signals
@receiver(post_save, sender=User)
def user_saved(sender, instance, created, **kwargs):
    """Send realtime update when user is saved"""
    action = 'created' if created else 'updated'
    
    data = {
        'id': instance.id,
        'email': instance.email,
        'username': instance.username,
        'first_name': instance.first_name,
        'last_name': instance.last_name,
        'role': instance.role,
        'is_active': instance.is_active,
        'is_verified': instance.is_verified,
        'email_verified': instance.email_verified,
        'action': action
    }
    
    # Send to admin group
    send_realtime_update('admin:users', 'user_update', data)


@receiver(post_delete, sender=User)
def user_deleted(sender, instance, **kwargs):
    """Send realtime update when user is deleted"""
    data = {
        'id': instance.id,
        'email': instance.email,
        'username': instance.username,
        'action': 'deleted'
    }
    
    # Send to admin group
    send_realtime_update('admin:users', 'user_update', data)


# Registration signals
@receiver(post_save, sender=Registration)
def registration_saved(sender, instance, created, **kwargs):
    """Send realtime update when registration is saved"""
    action = 'created' if created else 'updated'
    
    data = {
        'id': instance.id,
        'user_id': instance.user_id,
        'event_id': instance.event_id,
        'status': instance.status,
        'type': instance.type,
        'team_name': instance.team_name,
        'payment_status': instance.payment_status,
        'submitted_at': instance.submitted_at.isoformat(),
        'action': action
    }
    
    # Send to user-specific group
    send_realtime_update(f'registrations:user:{instance.user_id}', 'registration_update', data)
    
    # Send to event-specific group
    send_realtime_update(f'registrations:event:{instance.event_id}', 'registration_update', data)
    
    # Send to organizer group if event has organizer
    if instance.event.created_by_id:
        send_realtime_update(f'registrations:org:{instance.event.created_by_id}', 'registration_update', data)


@receiver(post_save, sender=RegistrationDocument)
def registration_document_saved(sender, instance, created, **kwargs):
    """Send realtime update when registration document is saved"""
    action = 'created' if created else 'updated'
    
    data = {
        'id': instance.id,
        'registration_id': instance.registration_id,
        'user_id': instance.registration.user_id,
        'doc_type': instance.doc_type,
        'uploaded_at': instance.uploaded_at.isoformat(),
        'approved_at': instance.approved_at.isoformat() if instance.approved_at else None,
        'action': action
    }
    
    # Send to user-specific group
    send_realtime_update(f'registrations:user:{instance.registration.user_id}', 'registration_update', data)


# Ticket signals
@receiver(post_save, sender=TicketOrder)
def ticket_order_saved(sender, instance, created, **kwargs):
    """Send realtime update when ticket order is saved"""
    action = 'created' if created else 'updated'
    
    data = {
        'id': instance.id,
        'user_id': instance.user_id,
        'event_id': instance.event_id,
        'status': instance.status,
        'total_cents': instance.total_cents,
        'created_at': instance.created_at.isoformat(),
        'action': action
    }
    
    # Send to user-specific group
    send_realtime_update(f'tickets:user:{instance.user_id}', 'ticket_update', data)
    
    # Send to event-specific group for attendance tracking
    send_realtime_update(f'attendance:event:{instance.event_id}', 'ticket_update', data)


@receiver(post_save, sender=Ticket)
def ticket_saved(sender, instance, created, **kwargs):
    """Send realtime update when ticket is saved"""
    action = 'created' if created else 'updated'
    
    data = {
        'id': instance.id,
        'order_id': instance.order_id,
        'user_id': instance.order.user_id,
        'serial': instance.serial,
        'status': instance.status,
        'used_at': instance.used_at.isoformat() if instance.used_at else None,
        'action': action
    }
    
    # Send to user-specific group
    send_realtime_update(f'tickets:user:{instance.order.user_id}', 'ticket_update', data)
    
    # Send to event-specific group for attendance tracking
    send_realtime_update(f'attendance:event:{instance.order.event_id}', 'ticket_update', data)


# Results signals
@receiver(post_save, sender=Result)
def result_saved(sender, instance, created, **kwargs):
    """Send realtime update when result is saved"""
    action = 'created' if created else 'updated'
    
    data = {
        'id': instance.id,
        'fixture_id': instance.fixture_id,
        'event_id': instance.fixture.event_id if instance.fixture else None,
        'score_home': instance.score_home,
        'score_away': instance.score_away,
        'status': instance.status,
        'published': instance.published,
        'winner_id': instance.winner_id,
        'action': action
    }
    
    # Send to event-specific groups
    if instance.fixture and instance.fixture.event_id:
        send_realtime_update(f'results:event:{instance.fixture.event_id}', 'results_update', data)
        send_realtime_update(f'results:public:{instance.fixture.event_id}', 'results_update', data)
        send_realtime_update(f'schedule:public:{instance.fixture.event_id}', 'schedule_update', data)


@receiver(post_save, sender=LeaderboardEntry)
def leaderboard_entry_saved(sender, instance, created, **kwargs):
    """Send realtime update when leaderboard entry is saved"""
    action = 'created' if created else 'updated'
    
    data = {
        'id': instance.id,
        'event_id': instance.event_id,
        'team_id': instance.team_id,
        'position': instance.position,
        'points': instance.points,
        'matches_played': instance.matches_played,
        'wins': instance.wins,
        'draws': instance.draws,
        'losses': instance.losses,
        'goals_for': instance.goals_for,
        'goals_against': instance.goals_against,
        'goal_difference': instance.goal_difference,
        'action': action
    }
    
    # Send to event-specific groups
    send_realtime_update(f'results:event:{instance.event_id}', 'results_update', data)
    send_realtime_update(f'results:public:{instance.event_id}', 'results_update', data)


@receiver(post_save, sender=AthleteStat)
def athlete_stat_saved(sender, instance, created, **kwargs):
    """Send realtime update when athlete stat is saved"""
    action = 'created' if created else 'updated'
    
    data = {
        'id': instance.id,
        'event_id': instance.event_id,
        'athlete_id': instance.athlete_id,
        'position': instance.position,
        'points': instance.points,
        'metrics': instance.metrics,
        'verified': instance.verified,
        'action': action
    }
    
    # Send to event-specific groups
    send_realtime_update(f'results:event:{instance.event_id}', 'results_update', data)
    send_realtime_update(f'results:public:{instance.event_id}', 'results_update', data)


# Team signals
@receiver(post_save, sender=Team)
def team_saved(sender, instance, created, **kwargs):
    """Send realtime update when team is saved"""
    action = 'created' if created else 'updated'
    
    data = {
        'id': instance.id,
        'name': instance.name,
        'sport': instance.sport,
        'manager_id': instance.manager_id,
        'coach_id': instance.coach_id,
        'is_active': instance.is_active,
        'is_public': instance.is_public,
        'action': action
    }
    
    # Send to manager and coach groups
    send_realtime_update(f'teams:manager:{instance.manager_id}', 'team_update', data)
    if instance.coach_id:
        send_realtime_update(f'teams:coach:{instance.coach_id}', 'team_update', data)


@receiver(post_save, sender=TeamMember)
def team_member_saved(sender, instance, created, **kwargs):
    """Send realtime update when team member is saved"""
    action = 'created' if created else 'updated'
    
    data = {
        'id': instance.id,
        'team_id': instance.team_id,
        'user_id': instance.user_id,
        'full_name': instance.full_name,
        'role': instance.role,
        'status': instance.status,
        'jersey_number': instance.jersey_number,
        'action': action
    }
    
    # Send to team-specific groups
    send_realtime_update(f'teams:team:{instance.team_id}', 'team_update', data)
    
    # Send to user-specific group if user is linked
    if instance.user_id:
        send_realtime_update(f'teams:user:{instance.user_id}', 'team_update', data)


@receiver(post_save, sender=TeamEventEntry)
def team_event_entry_saved(sender, instance, created, **kwargs):
    """Send realtime update when team event entry is saved"""
    action = 'created' if created else 'updated'
    
    data = {
        'id': instance.id,
        'team_id': instance.team_id,
        'event_id': instance.event_id,
        'division_id': instance.division_id,
        'status': instance.status,
        'decided_at': instance.decided_at.isoformat() if instance.decided_at else None,
        'action': action
    }
    
    # Send to team-specific groups
    send_realtime_update(f'teams:team:{instance.team_id}', 'team_update', data)
    
    # Send to event-specific groups
    send_realtime_update(f'registrations:event:{instance.event_id}', 'registration_update', data)
    if instance.event.created_by_id:
        send_realtime_update(f'registrations:org:{instance.event.created_by_id}', 'registration_update', data)


# Notification signals
@receiver(post_save, sender=Notification)
def notification_saved(sender, instance, created, **kwargs):
    """Send realtime update when notification is saved"""
    if not created:  # Only send for new notifications
        return
    
    data = {
        'id': instance.id,
        'user_id': instance.user_id,
        'title': instance.title,
        'message': instance.message,
        'type': instance.type,
        'is_read': instance.is_read,
        'created_at': instance.created_at.isoformat()
    }
    
    # Send to user-specific group
    send_realtime_update(f'notifications:user:{instance.user_id}', 'notification_update', data)


# Content signals
@receiver(post_save, sender=News)
def news_saved(sender, instance, created, **kwargs):
    """Send realtime update when news is saved"""
    action = 'created' if created else 'updated'
    
    data = {
        'id': instance.id,
        'title': instance.title,
        'excerpt': instance.excerpt,
        'published': instance.published,
        'created_at': instance.created_at.isoformat(),
        'action': action
    }
    
    # Send to public group
    send_realtime_update('content:public', 'content_update', data)


@receiver(post_save, sender=Gallery)
def gallery_saved(sender, instance, created, **kwargs):
    """Send realtime update when gallery item is saved"""
    action = 'created' if created else 'updated'
    
    data = {
        'id': instance.id,
        'title': instance.title,
        'description': instance.description,
        'event_id': instance.event_id,
        'approved': instance.approved,
        'created_at': instance.created_at.isoformat(),
        'action': action
    }
    
    # Send to public group
    send_realtime_update('content:public', 'content_update', data)
    
    # Send to event-specific group if event is specified
    if instance.event_id:
        send_realtime_update(f'content:event:{instance.event_id}', 'content_update', data)


# Stats update signals - trigger when counts change
@receiver(post_save, sender=Event)
def event_stats_updated(sender, instance, created, **kwargs):
    """Send stats update when event count changes"""
    if instance.lifecycle_status == Event.LifecycleStatus.PUBLISHED:
        send_realtime_update('content:public', 'stats_updated', {
            'type': 'event_published',
            'event_id': instance.id,
            'timestamp': instance.updated_at.isoformat()
        })


@receiver(post_save, sender=User)
def user_stats_updated(sender, instance, created, **kwargs):
    """Send stats update when user count changes"""
    if instance.role == 'ATHLETE' and instance.is_active:
        send_realtime_update('content:public', 'stats_updated', {
            'type': 'participant_added',
            'user_id': instance.id,
            'timestamp': instance.date_joined.isoformat()
        })


@receiver(post_save, sender=Team)
def team_stats_updated(sender, instance, created, **kwargs):
    """Send stats update when team count changes"""
    if instance.is_active:
        send_realtime_update('content:public', 'stats_updated', {
            'type': 'team_created',
            'team_id': instance.id,
            'timestamp': instance.created_at.isoformat()
        })


@receiver(post_save, sender=Venue)
def venue_stats_updated(sender, instance, created, **kwargs):
    """Send stats update when venue count changes"""
    if instance.is_active:
        send_realtime_update('content:public', 'stats_updated', {
            'type': 'venue_added',
            'venue_id': instance.id,
            'timestamp': instance.created_at.isoformat()
        })
