# teams/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Team, TeamMember, TeamEventEntry


@receiver(post_save, sender=TeamMember)
def team_member_saved(sender, instance, created, **kwargs):
    """Send realtime update when team member is saved"""
    action = 'created' if created else 'updated'
    _send_team_roster_update(instance.team, action, {
        'member_id': instance.id,
        'member_name': instance.full_name or (instance.user.get_full_name() if instance.user else 'Unknown'),
        'status': instance.status,
        'role': instance.role
    })


@receiver(post_delete, sender=TeamMember)
def team_member_deleted(sender, instance, **kwargs):
    """Send realtime update when team member is deleted"""
    _send_team_roster_update(instance.team, 'deleted', {
        'member_id': instance.id,
        'member_name': instance.full_name or (instance.user.get_full_name() if instance.user else 'Unknown')
    })


@receiver(post_save, sender=TeamEventEntry)
def team_event_entry_saved(sender, instance, created, **kwargs):
    """Send realtime update when team event entry is saved"""
    action = 'created' if created else 'updated'
    _send_team_entry_update(instance, action)


@receiver(post_delete, sender=TeamEventEntry)
def team_event_entry_deleted(sender, instance, **kwargs):
    """Send realtime update when team event entry is deleted"""
    _send_team_entry_update(instance, 'deleted')


def _send_team_roster_update(team, action, extra_data=None):
    """Send realtime roster update via WebSocket (safe no-op if Channels not available)"""
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        if channel_layer:
            payload = {
                'type': 'team.roster.updated',
                'team_id': team.id,
                'action': action,
                'data': {
                    'team_id': team.id,
                    'team_name': team.name,
                    'action': action,
                }
            }
            if extra_data:
                payload['data'].update(extra_data)
            
            # Send to team-specific subscribers
            async_to_sync(channel_layer.group_send)(
                f'teams:team:{team.id}',
                payload
            )
    except (ImportError, Exception):
        # Channels not available or any other error, silently continue
        pass


def _send_team_entry_update(entry, action):
    """Send realtime entry status update via WebSocket (safe no-op if Channels not available)"""
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        if channel_layer:
            payload = {
                'type': 'team.entry.status',
                'entry_id': entry.id,
                'action': action,
                'data': {
                    'entry_id': entry.id,
                    'team_id': entry.team.id,
                    'team_name': entry.team.name,
                    'event_id': entry.event.id,
                    'event_name': entry.event.name,
                    'division_id': entry.division.id if entry.division else None,
                    'division_name': entry.division.name if entry.division else None,
                    'status': entry.status,
                    'status_display': entry.get_status_display(),
                    'action': action,
                    'decided_at': entry.decided_at.isoformat() if entry.decided_at else None,
                    'decided_by': entry.decided_by.get_full_name() if entry.decided_by else None,
                }
            }
            
            # Send to team-specific subscribers
            async_to_sync(channel_layer.group_send)(
                f'teams:team:{entry.team.id}',
                payload
            )
            
            # Send to event-specific subscribers
            async_to_sync(channel_layer.group_send)(
                f'teams:event:{entry.event.id}',
                payload
            )
    except (ImportError, Exception):
        # Channels not available or any other error, silently continue
        pass
