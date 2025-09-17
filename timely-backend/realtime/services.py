# realtime/services.py
import json
from datetime import datetime
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .serializers import (
    MinimalResultSerializer, MinimalLeaderboardEntrySerializer,
    MinimalFixtureSerializer, MinimalAnnouncementSerializer,
    ResultsUpdateSerializer, ScheduleUpdateSerializer, AnnouncementsUpdateSerializer
)
from results.models import LeaderboardEntry
from results.services.compute import recompute_event_standings


class RealtimeBroadcaster:
    """Service for broadcasting real-time updates"""
    
    def __init__(self):
        self.channel_layer = get_channel_layer()
    
    def broadcast_results_update(self, event_id, result=None, message=None):
        """Broadcast results update to event subscribers"""
        group_name = f"event_{event_id}_results"
        
        # Prepare data
        data = {
            'type': 'results_update',
            'event_id': event_id,
            'timestamp': timezone.now().isoformat()
        }
        
        if result:
            data['result'] = MinimalResultSerializer(result).data
            
            # Recompute leaderboard and include it
            leaderboard = recompute_event_standings(event_id)
            data['leaderboard'] = MinimalLeaderboardEntrySerializer(leaderboard, many=True).data
        
        if message:
            data['message'] = message
        
        # Broadcast to WebSocket group
        async_to_sync(self.channel_layer.group_send)(
            group_name,
            {
                'type': 'results_update',
                'data': data
            }
        )
    
    def broadcast_schedule_update(self, event_id, fixture=None, fixtures=None, message=None):
        """Broadcast schedule update to event subscribers"""
        group_name = f"event_{event_id}_schedule"
        
        # Prepare data
        data = {
            'type': 'schedule_update',
            'event_id': event_id,
            'timestamp': timezone.now().isoformat()
        }
        
        if fixture:
            data['fixture'] = MinimalFixtureSerializer(fixture).data
        
        if fixtures:
            data['fixtures'] = MinimalFixtureSerializer(fixtures, many=True).data
        
        if message:
            data['message'] = message
        
        # Broadcast to WebSocket group
        async_to_sync(self.channel_layer.group_send)(
            group_name,
            {
                'type': 'schedule_update',
                'data': data
            }
        )
    
    def broadcast_announcements_update(self, event_id, announcement=None, message=None):
        """Broadcast announcements update to event subscribers"""
        group_name = f"event_{event_id}_announcements"
        
        # Prepare data
        data = {
            'type': 'announcements_update',
            'event_id': event_id,
            'timestamp': timezone.now().isoformat()
        }
        
        if announcement:
            data['announcement'] = MinimalAnnouncementSerializer(announcement).data
        
        if message:
            data['message'] = message
        
        # Broadcast to WebSocket group
        async_to_sync(self.channel_layer.group_send)(
            group_name,
            {
                'type': 'announcements_update',
                'data': data
            }
        )
    
    def broadcast_leaderboard_update(self, event_id, message=None):
        """Broadcast leaderboard update to event subscribers"""
        group_name = f"event_{event_id}_results"
        
        # Recompute leaderboard
        leaderboard = recompute_event_standings(event_id)
        
        # Prepare data
        data = {
            'type': 'leaderboard_update',
            'event_id': event_id,
            'leaderboard': MinimalLeaderboardEntrySerializer(leaderboard, many=True).data,
            'timestamp': timezone.now().isoformat()
        }
        
        if message:
            data['message'] = message
        
        # Broadcast to WebSocket group
        async_to_sync(self.channel_layer.group_send)(
            group_name,
            {
                'type': 'results_update',
                'data': data
            }
        )
    
    def broadcast_event_update(self, event_id, event_data, message=None):
        """Broadcast general event update to event subscribers"""
        # Broadcast to all event groups
        groups = [
            f"event_{event_id}_results",
            f"event_{event_id}_schedule",
            f"event_{event_id}_announcements"
        ]
        
        data = {
            'type': 'event_update',
            'event_id': event_id,
            'event': event_data,
            'timestamp': timezone.now().isoformat()
        }
        
        if message:
            data['message'] = message
        
        for group_name in groups:
            async_to_sync(self.channel_layer.group_send)(
                group_name,
                {
                    'type': 'event_update',
                    'data': data
                }
            )


# Global broadcaster instance
broadcaster = RealtimeBroadcaster()


def broadcast_result_update(event_id, result, message=None):
    """Convenience function to broadcast result update"""
    broadcaster.broadcast_results_update(event_id, result, message)


def broadcast_schedule_update(event_id, fixture=None, fixtures=None, message=None):
    """Convenience function to broadcast schedule update"""
    broadcaster.broadcast_schedule_update(event_id, fixture, fixtures, message)


def broadcast_announcement_update(event_id, announcement, message=None):
    """Convenience function to broadcast announcement update"""
    broadcaster.broadcast_announcements_update(event_id, announcement, message)


def broadcast_leaderboard_update(event_id, message=None):
    """Convenience function to broadcast leaderboard update"""
    broadcaster.broadcast_leaderboard_update(event_id, message)
