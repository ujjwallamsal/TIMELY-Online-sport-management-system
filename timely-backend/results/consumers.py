# results/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.core.serializers.json import DjangoJSONEncoder

from .models import Result, LeaderboardEntry
from .serializers import ResultSerializer, LeaderboardEntrySerializer

User = get_user_model()


class ResultsConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time results updates"""
    
    async def connect(self):
        """Connect to WebSocket and join event group"""
        self.event_id = self.scope['url_route']['kwargs']['event_id']
        self.event_group_name = f'results_event_{self.event_id}'
        
        # Join event group
        await self.channel_layer.group_add(
            self.event_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial data
        await self.send_initial_data()
    
    async def disconnect(self, close_code):
        """Leave event group when disconnecting"""
        await self.channel_layer.group_discard(
            self.event_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle messages from WebSocket client"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'get_leaderboard':
                await self.send_leaderboard()
            elif message_type == 'get_recent_results':
                await self.send_recent_results()
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
            
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    async def send_initial_data(self):
        """Send initial data when client connects"""
        await self.send_leaderboard()
        await self.send_recent_results()
    
    async def send_leaderboard(self):
        """Send current leaderboard"""
        leaderboard_data = await self.get_leaderboard_data()
        await self.send(text_data=json.dumps({
            'type': 'leaderboard_update',
            'data': leaderboard_data
        }))
    
    async def send_recent_results(self):
        """Send recent results"""
        results_data = await self.get_recent_results_data()
        await self.send(text_data=json.dumps({
            'type': 'recent_results_update',
            'data': results_data
        }))
    
    @database_sync_to_async
    def get_leaderboard_data(self):
        """Get leaderboard data from database"""
        leaderboard = LeaderboardEntry.objects.filter(
            event_id=self.event_id
        ).select_related('team').order_by('position')[:10]
        
        serializer = LeaderboardEntrySerializer(leaderboard, many=True)
        return serializer.data
    
    @database_sync_to_async
    def get_recent_results_data(self):
        """Get recent results data from database"""
        results = Result.objects.filter(
            fixture__event_id=self.event_id,
            published=True
        ).select_related(
            'fixture__home_team', 'fixture__away_team', 'winner'
        ).order_by('-created_at')[:10]
        
        serializer = ResultSerializer(results, many=True)
        return serializer.data
    
    # Group message handlers
    async def result_created(self, event):
        """Handle result created message"""
        await self.send(text_data=json.dumps({
            'type': 'result_created',
            'data': event['data']
        }))
    
    async def result_updated(self, event):
        """Handle result updated message"""
        await self.send(text_data=json.dumps({
            'type': 'result_updated',
            'data': event['data']
        }))
    
    async def result_published(self, event):
        """Handle result published message"""
        await self.send(text_data=json.dumps({
            'type': 'result_published',
            'data': event['data']
        }))
    
    async def leaderboard_updated(self, event):
        """Handle leaderboard updated message"""
        await self.send(text_data=json.dumps({
            'type': 'leaderboard_updated',
            'data': event['data']
        }))
    
    async def standings_recomputed(self, event):
        """Handle standings recomputed message"""
        await self.send(text_data=json.dumps({
            'type': 'standings_recomputed',
            'data': event['data']
        }))


class GlobalResultsConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for global results updates (admin)"""
    
    async def connect(self):
        """Connect to WebSocket and join global group"""
        self.global_group_name = 'results_global'
        
        # Check if user is authenticated and has admin permissions
        if not self.scope['user'].is_authenticated:
            await self.close()
            return
        
        # Join global group
        await self.channel_layer.group_add(
            self.global_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """Leave global group when disconnecting"""
        await self.channel_layer.group_discard(
            self.global_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle messages from WebSocket client"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
            
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    # Group message handlers
    async def result_created(self, event):
        """Handle result created message"""
        await self.send(text_data=json.dumps({
            'type': 'result_created',
            'data': event['data']
        }))
    
    async def result_updated(self, event):
        """Handle result updated message"""
        await self.send(text_data=json.dumps({
            'type': 'result_updated',
            'data': event['data']
        }))
    
    async def result_published(self, event):
        """Handle result published message"""
        await self.send(text_data=json.dumps({
            'type': 'result_published',
            'data': event['data']
        }))
    
    async def leaderboard_updated(self, event):
        """Handle leaderboard updated message"""
        await self.send(text_data=json.dumps({
            'type': 'leaderboard_updated',
            'data': event['data']
        }))


# Utility functions for sending WebSocket messages
async def send_result_update(channel_layer, event_id, result, update_type):
    """Send result update to event group"""
    serializer = ResultSerializer(result)
    
    await channel_layer.group_send(
        f'results_event_{event_id}',
        {
            'type': f'result_{update_type}',
            'data': serializer.data
        }
    )
    
    # Also send to global group for admin updates
    await channel_layer.group_send(
        'results_global',
        {
            'type': f'result_{update_type}',
            'data': serializer.data
        }
    )


async def send_leaderboard_update(channel_layer, event_id, leaderboard_data):
    """Send leaderboard update to event group"""
    await channel_layer.group_send(
        f'results_event_{event_id}',
        {
            'type': 'leaderboard_updated',
            'data': leaderboard_data
        }
    )
    
    # Also send to global group for admin updates
    await channel_layer.group_send(
        'results_global',
        {
            'type': 'leaderboard_updated',
            'data': leaderboard_data
        }
    )


async def send_standings_recomputed(channel_layer, event_id, leaderboard_data):
    """Send standings recomputed message to event group"""
    await channel_layer.group_send(
        f'results_event_{event_id}',
        {
            'type': 'standings_recomputed',
            'data': leaderboard_data
        }
    )
