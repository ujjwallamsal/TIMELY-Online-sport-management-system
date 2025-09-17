# events/realtime_service.py
import json
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Q
from .models import Event
from results.models import Result, LeaderboardEntry
from fixtures.models import Fixture


class RealtimeService:
    """Service for broadcasting real-time updates"""
    
    def __init__(self):
        self.channel_layer = get_channel_layer()
    
    def _send_to_group(self, group_name, message_type, data):
        """Send message to a channel group"""
        if not self.channel_layer:
            return
        
        async_to_sync(self.channel_layer.group_send)(
            group_name,
            {
                'type': message_type,
                'data': data
            }
        )
    
    def broadcast_event_update(self, event, action, extra_data=None):
        """Broadcast event update to all subscribers"""
        group_name = f'event_{event.id}'
        
        data = {
            'event_id': event.id,
            'action': action,
            'event': {
                'id': event.id,
                'name': event.name,
                'status': event.status,
                'start_date': event.start_date.isoformat(),
                'end_date': event.end_date.isoformat(),
                'phase': event.phase,
            }
        }
        
        if extra_data:
            data.update(extra_data)
        
        self._send_to_group(group_name, 'event_update', data)
    
    def broadcast_results_update(self, event, result=None):
        """Broadcast results update and recompute leaderboard"""
        group_name = f'event_{event.id}_results'
        
        # Recompute leaderboard
        leaderboard = self._compute_leaderboard(event)
        
        data = {
            'event_id': event.id,
            'leaderboard': leaderboard,
            'timestamp': result.updated_at.isoformat() if result else None
        }
        
        if result:
            data['result'] = {
                'id': result.id,
                'fixture_id': result.fixture.id,
                'home_score': result.home_score,
                'away_score': result.away_score,
                'winner_id': result.winner.id if result.winner else None,
                'is_draw': result.is_draw,
                'finalized_at': result.finalized_at.isoformat() if result.finalized_at else None
            }
        
        self._send_to_group(group_name, 'results_update', data)
    
    def broadcast_schedule_update(self, event, fixture=None, action='update'):
        """Broadcast schedule update"""
        group_name = f'event_{event.id}_schedule'
        
        # Get all fixtures for the event
        fixtures = Fixture.objects.filter(event=event).select_related('home', 'away', 'venue')
        
        data = {
            'event_id': event.id,
            'action': action,
            'fixtures': [
                {
                    'id': f.id,
                    'round': f.round,
                    'phase': f.phase,
                    'home_team': {
                        'id': f.home.id,
                        'name': f.home.name
                    } if f.home else None,
                    'away_team': {
                        'id': f.away.id,
                        'name': f.away.name
                    } if f.away else None,
                    'venue': {
                        'id': f.venue.id,
                        'name': f.venue.name
                    } if f.venue else None,
                    'start_at': f.start_at.isoformat(),
                    'status': f.status
                }
                for f in fixtures
            ]
        }
        
        if fixture:
            data['updated_fixture'] = {
                'id': fixture.id,
                'round': fixture.round,
                'phase': fixture.phase,
                'home_team': {
                    'id': fixture.home.id,
                    'name': fixture.home.name
                } if fixture.home else None,
                'away_team': {
                    'id': fixture.away.id,
                    'name': fixture.away.name
                } if fixture.away else None,
                'venue': {
                    'id': fixture.venue.id,
                    'name': fixture.venue.name
                } if fixture.venue else None,
                'start_at': fixture.start_at.isoformat(),
                'status': fixture.status
            }
        
        self._send_to_group(group_name, 'schedule_update', data)
    
    def broadcast_announcement(self, event, announcement):
        """Broadcast announcement to event subscribers"""
        group_name = f'event_{event.id}_announcements'
        
        data = {
            'event_id': event.id,
            'announcement': {
                'id': announcement.get('id'),
                'title': announcement.get('title'),
                'message': announcement.get('message'),
                'type': announcement.get('type', 'info'),
                'timestamp': announcement.get('timestamp'),
                'priority': announcement.get('priority', 'normal')
            }
        }
        
        self._send_to_group(group_name, 'announcement_update', data)
    
    def _compute_leaderboard(self, event):
        """Compute leaderboard for an event"""
        # Get all leaderboard entries for the event
        entries = LeaderboardEntry.objects.filter(event=event).select_related('team')
        
        leaderboard = []
        for entry in entries:
            leaderboard.append({
                'team_id': entry.team.id,
                'team_name': entry.team.name,
                'pts': entry.pts,
                'w': entry.w,
                'd': entry.d,
                'l': entry.l,
                'gf': entry.gf,
                'ga': entry.ga,
                'gd': entry.gd,
                'matches_played': entry.matches_played,
                'win_percentage': entry.win_percentage,
                'points_per_match': entry.points_per_match
            })
        
        # Sort by points, then goal difference, then goals for
        leaderboard.sort(key=lambda x: (-x['pts'], -x['gd'], -x['gf']))
        
        return leaderboard
    
    def update_leaderboard(self, event, result):
        """Update leaderboard based on a result"""
        if not result or not result.is_finalized:
            return
        
        # Get or create leaderboard entries for both teams
        home_team = result.fixture.home
        away_team = result.fixture.away
        
        if not home_team or not away_team:
            return
        
        # Update home team entry
        home_entry, _ = LeaderboardEntry.objects.get_or_create(
            event=event,
            team=home_team,
            defaults={'pts': 0, 'w': 0, 'd': 0, 'l': 0, 'gf': 0, 'ga': 0}
        )
        
        # Update away team entry
        away_entry, _ = LeaderboardEntry.objects.get_or_create(
            event=event,
            team=away_team,
            defaults={'pts': 0, 'w': 0, 'd': 0, 'l': 0, 'gf': 0, 'ga': 0}
        )
        
        # Update stats based on result
        if result.is_draw:
            # Draw - both teams get 1 point
            home_entry.pts += 1
            home_entry.d += 1
            away_entry.pts += 1
            away_entry.d += 1
        elif result.winner == home_team:
            # Home team wins
            home_entry.pts += 3
            home_entry.w += 1
            away_entry.l += 1
        else:
            # Away team wins
            away_entry.pts += 3
            away_entry.w += 1
            home_entry.l += 1
        
        # Update goals
        home_entry.gf += result.home_score
        home_entry.ga += result.away_score
        away_entry.gf += result.away_score
        away_entry.ga += result.home_score
        
        # Save entries
        home_entry.save()
        away_entry.save()


# Global instance
realtime_service = RealtimeService()
