# fixtures/consumers.py
"""
WebSocket consumer for fixtures realtime updates.
Minimal consumer for fixtures:event:{event_id} groups.
"""

from __future__ import annotations

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

from events.models import Event


class FixturesConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for fixtures updates"""
    
    async def connect(self):
        """Connect to fixtures WebSocket"""
        self.event_id = self.scope['url_route']['kwargs']['event_id']
        self.group_name = f'fixtures:event:{self.event_id}'
        
        # Check if user has permission to view this event
        if await self.check_event_permission():
            # Join group
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            
            await self.accept()
        else:
            await self.close()
    
    async def disconnect(self, close_code):
        """Disconnect from fixtures WebSocket"""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
        
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    async def fixtures_updated(self, event):
        """Handle fixtures update messages"""
        await self.send(text_data=json.dumps({
            'type': 'fixtures.updated',
            'event_id': event['event_id'],
            'action': event['action'],
            'match': event['match']
        }))
    
    @database_sync_to_async
    def check_event_permission(self):
        """Check if user has permission to view this event"""
        try:
            # Get event
            event = Event.objects.get(id=self.event_id)
            
            # Check if event is published (public access)
            if event.lifecycle_status == 'published':
                return True
            
            # Check authenticated user permissions
            user = self.scope.get('user')
            if isinstance(user, AnonymousUser):
                return False
            
            # Staff and organizers can view all events
            if user.is_staff:
                return True
            
            role = getattr(user, 'role', '')
            if role in ['ADMIN', 'ORGANIZER']:
                return True
            
            # Event creator can view their own events
            if event.created_by == user:
                return True
            
            return False
        
        except Event.DoesNotExist:
            return False
