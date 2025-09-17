# events/realtime_service.py
"""
Real-time broadcasting service for live updates.
Handles broadcasting of standings, schedules, and announcements.
"""
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db import transaction
from django.utils import timezone

from results.services import compute_event_leaderboard
from results.models import LeaderboardEntry
from fixtures.models import Fixture
from teams.models import Team


class RealtimeBroadcastService:
    """Service for broadcasting real-time updates"""
    
    def __init__(self):
        self.channel_layer = get_channel_layer()
    
    def broadcast_event_leaderboard(self, event_id):
        """Broadcast updated leaderboard for an event"""
        try:
            # Compute fresh leaderboard
            leaderboard = compute_event_leaderboard(event_id)
            
            # Prepare compact leaderboard data
            compact_leaderboard = []
            for entry in leaderboard:
                compact_leaderboard.append({
                    'team_id': entry['team_id'],
                    'team_name': self._get_team_name(entry['team_id']),
                    'points': entry['points'],
                    'played': entry['played'],
                    'won': entry['won'],
                    'drawn': entry['drawn'],
                    'lost': entry['lost'],
                    'gf': entry['gf'],
                    'ga': entry['ga'],
                    'gd': entry['gd']
                })
            
            # Broadcast to event results group
            self._broadcast_to_group(
                f'event_{event_id}_results',
                'leaderboard_update',
                {
                    'event_id': event_id,
                    'leaderboard': compact_leaderboard,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
            # Also broadcast to individual team groups
            for entry in leaderboard:
                team_id = entry['team_id']
                self._broadcast_to_group(
                    f'team_{team_id}_results',
                    'leaderboard_update',
                    {
                        'event_id': event_id,
                        'team_position': compact_leaderboard.index(next(
                            e for e in compact_leaderboard if e['team_id'] == team_id
                        )) + 1,
                        'leaderboard': compact_leaderboard,
                        'timestamp': timezone.now().isoformat()
                    }
                )
            
        except Exception as e:
            print(f"Error broadcasting leaderboard for event {event_id}: {e}")
    
    def broadcast_fixture_schedule(self, event_id, fixture_id=None):
        """Broadcast updated schedule for an event"""
        try:
            # Get all fixtures for the event
            fixtures = Fixture.objects.filter(event_id=event_id).select_related(
                'home', 'away', 'venue'
            ).order_by('start_at')
            
            # Prepare schedule data
            schedule_data = []
            for fixture in fixtures:
                schedule_data.append({
                    'fixture_id': fixture.id,
                    'home_team': {
                        'id': fixture.home.id if fixture.home else None,
                        'name': fixture.home.name if fixture.home else 'TBD'
                    },
                    'away_team': {
                        'id': fixture.away.id if fixture.away else None,
                        'name': fixture.away.name if fixture.away else 'TBD'
                    },
                    'start_at': fixture.start_at.isoformat(),
                    'venue': {
                        'id': fixture.venue.id if fixture.venue else None,
                        'name': fixture.venue.name if fixture.venue else 'TBD'
                    },
                    'status': fixture.status,
                    'round': fixture.round,
                    'phase': fixture.phase
                })
            
            # Broadcast to event schedule group
            self._broadcast_to_group(
                f'event_{event_id}_schedule',
                'schedule_update',
                {
                    'event_id': event_id,
                    'schedule': schedule_data,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
            # If specific fixture, also broadcast to team groups
            if fixture_id:
                fixture = Fixture.objects.get(id=fixture_id)
                if fixture.home:
                    self._broadcast_to_group(
                        f'team_{fixture.home.id}_schedule',
                        'fixture_update',
                        {
                            'fixture_id': fixture.id,
                            'home_team': {
                                'id': fixture.home.id,
                                'name': fixture.home.name
                            },
                            'away_team': {
                                'id': fixture.away.id if fixture.away else None,
                                'name': fixture.away.name if fixture.away else 'TBD'
                            },
                            'start_at': fixture.start_at.isoformat(),
                            'venue': {
                                'id': fixture.venue.id if fixture.venue else None,
                                'name': fixture.venue.name if fixture.venue else 'TBD'
                            },
                            'status': fixture.status,
                            'round': fixture.round,
                            'phase': fixture.phase,
                            'timestamp': timezone.now().isoformat()
                        }
                    )
                
                if fixture.away:
                    self._broadcast_to_group(
                        f'team_{fixture.away.id}_schedule',
                        'fixture_update',
                        {
                            'fixture_id': fixture.id,
                            'home_team': {
                                'id': fixture.home.id if fixture.home else None,
                                'name': fixture.home.name if fixture.home else 'TBD'
                            },
                            'away_team': {
                                'id': fixture.away.id,
                                'name': fixture.away.name
                            },
                            'start_at': fixture.start_at.isoformat(),
                            'venue': {
                                'id': fixture.venue.id if fixture.venue else None,
                                'name': fixture.venue.name if fixture.venue else 'TBD'
                            },
                            'status': fixture.status,
                            'round': fixture.round,
                            'phase': fixture.phase,
                            'timestamp': timezone.now().isoformat()
                        }
                    )
            
        except Exception as e:
            print(f"Error broadcasting schedule for event {event_id}: {e}")
    
    def broadcast_announcement(self, event_id, announcement_data):
        """Broadcast announcement to event participants"""
        try:
            self._broadcast_to_group(
                f'event_{event_id}_announcements',
                'announcement_update',
                {
                    'event_id': event_id,
                    'announcement': announcement_data,
                    'timestamp': timezone.now().isoformat()
                }
            )
        except Exception as e:
            print(f"Error broadcasting announcement for event {event_id}: {e}")
    
    def broadcast_result_update(self, event_id, result_data):
        """Broadcast result update to event participants"""
        try:
            # Broadcast to event results group
            self._broadcast_to_group(
                f'event_{event_id}_results',
                'result_update',
                {
                    'event_id': event_id,
                    'result': result_data,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
            # Broadcast to team groups if teams are involved
            if 'home_team_id' in result_data:
                self._broadcast_to_group(
                    f'team_{result_data["home_team_id"]}_results',
                    'result_update',
                    result_data
                )
            
            if 'away_team_id' in result_data:
                self._broadcast_to_group(
                    f'team_{result_data["away_team_id"]}_results',
                    'result_update',
                    result_data
                )
            
        except Exception as e:
            print(f"Error broadcasting result update for event {event_id}: {e}")
    
    def _broadcast_to_group(self, group_name, message_type, data):
        """Broadcast message to a channel group"""
        if self.channel_layer:
            async_to_sync(self.channel_layer.group_send)(
                group_name,
                {
                    'type': message_type,
                    'data': data
                }
            )
    
    def _get_team_name(self, team_id):
        """Get team name by ID"""
        try:
            team = Team.objects.get(id=team_id)
            return team.name
        except Team.DoesNotExist:
            return f"Team {team_id}"


# Global instance
realtime_service = RealtimeBroadcastService()