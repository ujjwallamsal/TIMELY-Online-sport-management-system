# events/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from .models import Event
from results.models import Result, LeaderboardEntry
from fixtures.models import Fixture
from teams.models import Team

User = get_user_model()


class EventConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for event-specific real-time updates"""
    
    async def connect(self):
        self.event_id = self.scope['url_route']['kwargs']['event_id']
        self.user = self.scope['user']
        
        # Define group names for different topics
        self.event_group_name = f'event_{self.event_id}'
        self.results_group_name = f'event_{self.event_id}_results'
        self.schedule_group_name = f'event_{self.event_id}_schedule'
        self.announcements_group_name = f'event_{self.event_id}_announcements'
        
        # Verify event exists and user has permission
        event = await self.get_event(self.event_id)
        if not event:
            await self.close()
            return
        
        # Check permissions
        if not await self.can_view_event(self.user, event):
            await self.close()
            return
        
        # Join event group
        await self.channel_layer.group_add(
            self.event_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connected',
            'event_id': self.event_id,
            'message': 'Connected to event updates',
            'topics': ['results', 'schedule', 'announcements']
        }))
    
    async def disconnect(self, close_code):
        # Leave event group
        await self.channel_layer.group_discard(
            self.event_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'subscribe_results':
                # Subscribe to results updates
                await self.channel_layer.group_add(
                    self.results_group_name,
                    self.channel_name
                )
                await self.send(text_data=json.dumps({
                    'type': 'subscribed',
                    'stream': 'results'
                }))
                
            elif message_type == 'subscribe_schedule':
                # Subscribe to schedule updates
                await self.channel_layer.group_add(
                    self.schedule_group_name,
                    self.channel_name
                )
                await self.send(text_data=json.dumps({
                    'type': 'subscribed',
                    'stream': 'schedule'
                }))
                
            elif message_type == 'subscribe_announcements':
                # Subscribe to announcements
                await self.channel_layer.group_add(
                    self.announcements_group_name,
                    self.channel_name
                )
                await self.send(text_data=json.dumps({
                    'type': 'subscribed',
                    'stream': 'announcements'
                }))
                
            elif message_type == 'ping':
                # Handle ping/pong for connection health
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    # Event update handlers
    async def event_update(self, event):
        """Handle event updates"""
        await self.send(text_data=json.dumps({
            'type': 'event_update',
            'data': event['data']
        }))
    
    async def results_update(self, event):
        """Handle results updates"""
        await self.send(text_data=json.dumps({
            'type': 'results_update',
            'data': event['data']
        }))
    
    async def schedule_update(self, event):
        """Handle schedule updates"""
        await self.send(text_data=json.dumps({
            'type': 'schedule_update',
            'data': event['data']
        }))
    
    async def announcement_update(self, event):
        """Handle announcement updates"""
        await self.send(text_data=json.dumps({
            'type': 'announcement_update',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_event(self, event_id):
        """Get event by ID"""
        try:
            return Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return None
    
    @database_sync_to_async
    def can_view_event(self, user, event):
        """Check if user can view the event"""
        # Public events can be viewed by anyone
        if event.visibility == 'PUBLIC':
            return True
        
        # Private events require authentication
        if not user.is_authenticated:
            return False
        
        # Event creator can always view
        if event.created_by == user:
            return True
        
        # Check if user is registered for the event
        from registrations.models import Registration
        return Registration.objects.filter(
            event=event,
            applicant=user,
            status='APPROVED'
        ).exists()


class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for general notifications"""
    
    async def connect(self):
        self.user = self.scope['user']
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Join user-specific group
        self.user_group_name = f'user_{self.user.id}'
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        # Join role-based groups
        if self.user.role:
            self.role_group_name = f'role_{self.user.role.lower()}'
            await self.channel_layer.group_add(
                self.role_group_name,
                self.channel_name
            )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connected',
            'user_id': self.user.id,
            'role': self.user.role,
            'message': 'Connected to notifications'
        }))
    
    async def disconnect(self, close_code):
        # Leave user group
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )
        
        # Leave role group
        if hasattr(self, 'role_group_name'):
            await self.channel_layer.group_discard(
                self.role_group_name,
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
    
    # Notification handlers
    async def notification(self, event):
        """Handle notification messages"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': event['data']
        }))
    
    async def system_message(self, event):
        """Handle system messages"""
        await self.send(text_data=json.dumps({
            'type': 'system_message',
            'data': event['data']
        }))