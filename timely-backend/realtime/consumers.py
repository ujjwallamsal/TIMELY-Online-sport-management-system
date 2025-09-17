# realtime/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()


class EventConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for event-specific real-time updates"""
    
    async def connect(self):
        """Connect to event-specific WebSocket groups"""
        self.event_id = self.scope['url_route']['kwargs']['event_id']
        self.user = self.scope["user"]
        
        # Join event-specific groups
        self.results_group = f"event_{self.event_id}_results"
        self.schedule_group = f"event_{self.event_id}_schedule"
        self.announcements_group = f"event_{self.event_id}_announcements"
        
        await self.channel_layer.group_add(self.results_group, self.channel_name)
        await self.channel_layer.group_add(self.schedule_group, self.channel_name)
        await self.channel_layer.group_add(self.announcements_group, self.channel_name)
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to event {self.event_id} updates',
            'event_id': self.event_id,
            'topics': ['results', 'schedule', 'announcements']
        }))
    
    async def disconnect(self, close_code):
        """Leave all groups on disconnect"""
        await self.channel_layer.group_discard(self.results_group, self.channel_name)
        await self.channel_layer.group_discard(self.schedule_group, self.channel_name)
        await self.channel_layer.group_discard(self.announcements_group, self.channel_name)
    
    async def receive(self, text_data):
        """Handle incoming messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            elif message_type == 'subscribe_topic':
                # Subscribe to specific topic
                topic = data.get('topic')
                if topic in ['results', 'schedule', 'announcements']:
                    group_name = f"event_{self.event_id}_{topic}"
                    await self.channel_layer.group_add(group_name, self.channel_name)
        except json.JSONDecodeError:
            pass
    
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
    
    async def announcements_update(self, event):
        """Handle announcements updates"""
        await self.send(text_data=json.dumps({
            'type': 'announcements_update',
            'data': event['data']
        }))


class AdminConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for admin real-time updates"""
    
    async def connect(self):
        """Connect to admin WebSocket groups"""
        self.user = self.scope["user"]
        
        # Only allow authenticated admin users
        if not self.user.is_authenticated or self.user.role != 'ADMIN':
            await self.close()
            return
        
        # Join admin groups
        await self.channel_layer.group_add("events:admin", self.channel_name)
        await self.channel_layer.group_add("venues:admin", self.channel_name)
        await self.channel_layer.group_add("admin:users", self.channel_name)
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to admin updates'
        }))
    
    async def disconnect(self, close_code):
        """Leave all groups on disconnect"""
        await self.channel_layer.group_discard("events:admin", self.channel_name)
        await self.channel_layer.group_discard("venues:admin", self.channel_name)
        await self.channel_layer.group_discard("admin:users", self.channel_name)
    
    async def receive(self, text_data):
        """Handle incoming messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # Respond to ping with pong
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
        except json.JSONDecodeError:
            pass
    
    async def event_update(self, event):
        """Handle event updates"""
        await self.send(text_data=json.dumps({
            'type': 'event_update',
            'data': event['data']
        }))
    
    async def venue_update(self, event):
        """Handle venue updates"""
        await self.send(text_data=json.dumps({
            'type': 'venue_update',
            'data': event['data']
        }))
    
    async def user_update(self, event):
        """Handle user updates"""
        await self.send(text_data=json.dumps({
            'type': 'user_update',
            'data': event['data']
        }))


class OrganizerConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for organizer real-time updates"""
    
    async def connect(self):
        """Connect to organizer WebSocket groups"""
        self.user = self.scope["user"]
        
        # Only allow authenticated organizer users
        if not self.user.is_authenticated or self.user.role not in ['ORGANIZER', 'ADMIN']:
            await self.close()
            return
        
        # Join organizer-specific groups
        await self.channel_layer.group_add(f"events:org:{self.user.id}", self.channel_name)
        await self.channel_layer.group_add(f"venues:org:{self.user.id}", self.channel_name)
        
        # Admin organizers also get admin groups
        if self.user.role == 'ADMIN':
            await self.channel_layer.group_add("events:admin", self.channel_name)
            await self.channel_layer.group_add("venues:admin", self.channel_name)
            await self.channel_layer.group_add("admin:users", self.channel_name)
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to organizer updates'
        }))
    
    async def disconnect(self, close_code):
        """Leave all groups on disconnect"""
        await self.channel_layer.group_discard(f"events:org:{self.user.id}", self.channel_name)
        await self.channel_layer.group_discard(f"venues:org:{self.user.id}", self.channel_name)
        
        if self.user.role == 'ADMIN':
            await self.channel_layer.group_discard("events:admin", self.channel_name)
            await self.channel_layer.group_discard("venues:admin", self.channel_name)
            await self.channel_layer.group_discard("admin:users", self.channel_name)
    
    async def receive(self, text_data):
        """Handle incoming messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # Respond to ping with pong
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
        except json.JSONDecodeError:
            pass
    
    async def event_update(self, event):
        """Handle event updates"""
        await self.send(text_data=json.dumps({
            'type': 'event_update',
            'data': event['data']
        }))
    
    async def venue_update(self, event):
        """Handle venue updates"""
        await self.send(text_data=json.dumps({
            'type': 'venue_update',
            'data': event['data']
        }))
    
    async def user_update(self, event):
        """Handle user updates"""
        await self.send(text_data=json.dumps({
            'type': 'user_update',
            'data': event['data']
        }))


class PublicConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for public real-time updates"""
    
    async def connect(self):
        """Connect to public WebSocket groups"""
        # Join public groups
        await self.channel_layer.group_add("events:public", self.channel_name)
        await self.channel_layer.group_add("content:public", self.channel_name)
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to public updates'
        }))
    
    async def disconnect(self, close_code):
        """Leave all groups on disconnect"""
        await self.channel_layer.group_discard("events:public", self.channel_name)
        await self.channel_layer.group_discard("content:public", self.channel_name)
    
    async def receive(self, text_data):
        """Handle incoming messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # Respond to ping with pong
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
        except json.JSONDecodeError:
            pass
    
    async def event_update(self, event):
        """Handle event updates"""
        await self.send(text_data=json.dumps({
            'type': 'event_update',
            'data': event['data']
        }))
    
    async def content_update(self, event):
        """Handle content updates"""
        await self.send(text_data=json.dumps({
            'type': 'content_update',
            'data': event['data']
        }))


class AthleteConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for athlete real-time updates"""
    
    async def connect(self):
        """Connect to athlete WebSocket groups"""
        self.user = self.scope["user"]
        
        # Only allow authenticated athlete users
        if not self.user.is_authenticated or self.user.role not in ['ATHLETE', 'COACH', 'ADMIN']:
            await self.close()
            return
        
        # Join athlete-specific groups
        await self.channel_layer.group_add(f"registrations:user:{self.user.id}", self.channel_name)
        await self.channel_layer.group_add(f"tickets:user:{self.user.id}", self.channel_name)
        await self.channel_layer.group_add(f"messages:user:{self.user.id}", self.channel_name)
        await self.channel_layer.group_add("announcements:audience:athlete", self.channel_name)
        
        # Join public groups for events they're interested in
        await self.channel_layer.group_add("content:public", self.channel_name)
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to athlete updates'
        }))
    
    async def disconnect(self, close_code):
        """Leave all groups on disconnect"""
        await self.channel_layer.group_discard(f"registrations:user:{self.user.id}", self.channel_name)
        await self.channel_layer.group_discard(f"tickets:user:{self.user.id}", self.channel_name)
        await self.channel_layer.group_discard(f"messages:user:{self.user.id}", self.channel_name)
        await self.channel_layer.group_discard("announcements:audience:athlete", self.channel_name)
        await self.channel_layer.group_discard("content:public", self.channel_name)
    
    async def receive(self, text_data):
        """Handle incoming messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            elif message_type == 'subscribe_event':
                # Subscribe to specific event updates
                event_id = data.get('event_id')
                if event_id:
                    await self.channel_layer.group_add(f"schedule:public:{event_id}", self.channel_name)
                    await self.channel_layer.group_add(f"results:public:{event_id}", self.channel_name)
        except json.JSONDecodeError:
            pass
    
    async def registration_update(self, event):
        """Handle registration updates"""
        await self.send(text_data=json.dumps({
            'type': 'registration_update',
            'data': event['data']
        }))
    
    async def ticket_update(self, event):
        """Handle ticket updates"""
        await self.send(text_data=json.dumps({
            'type': 'ticket_update',
            'data': event['data']
        }))
    
    async def message_update(self, event):
        """Handle message updates"""
        await self.send(text_data=json.dumps({
            'type': 'message_update',
            'data': event['data']
        }))
    
    async def announcement_update(self, event):
        """Handle announcement updates"""
        await self.send(text_data=json.dumps({
            'type': 'announcement_update',
            'data': event['data']
        }))
    
    async def schedule_update(self, event):
        """Handle schedule updates"""
        await self.send(text_data=json.dumps({
            'type': 'schedule_update',
            'data': event['data']
        }))
    
    async def results_update(self, event):
        """Handle results updates"""
        await self.send(text_data=json.dumps({
            'type': 'results_update',
            'data': event['data']
        }))
    
    async def content_update(self, event):
        """Handle content updates"""
        await self.send(text_data=json.dumps({
            'type': 'content_update',
            'data': event['data']
        }))


class CoachConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for coach real-time updates"""
    
    async def connect(self):
        """Connect to coach WebSocket groups"""
        self.user = self.scope["user"]
        
        # Only allow authenticated coach users
        if not self.user.is_authenticated or self.user.role not in ['COACH', 'ADMIN']:
            await self.close()
            return
        
        # Join coach-specific groups
        await self.channel_layer.group_add(f"registrations:user:{self.user.id}", self.channel_name)
        await self.channel_layer.group_add(f"messages:user:{self.user.id}", self.channel_name)
        await self.channel_layer.group_add("announcements:audience:coach", self.channel_name)
        
        # Join public groups for events they're interested in
        await self.channel_layer.group_add("content:public", self.channel_name)
        
        # Join organizer groups if they manage events
        if hasattr(self.user, 'managed_events') or self.user.role == 'ADMIN':
            await self.channel_layer.group_add(f"events:org:{self.user.id}", self.channel_name)
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to coach updates'
        }))
    
    async def disconnect(self, close_code):
        """Leave all groups on disconnect"""
        await self.channel_layer.group_discard(f"registrations:user:{self.user.id}", self.channel_name)
        await self.channel_layer.group_discard(f"messages:user:{self.user.id}", self.channel_name)
        await self.channel_layer.group_discard("announcements:audience:coach", self.channel_name)
        await self.channel_layer.group_discard("content:public", self.channel_name)
        await self.channel_layer.group_discard(f"events:org:{self.user.id}", self.channel_name)
    
    async def receive(self, text_data):
        """Handle incoming messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            elif message_type == 'subscribe_event':
                # Subscribe to specific event updates
                event_id = data.get('event_id')
                if event_id:
                    await self.channel_layer.group_add(f"schedule:public:{event_id}", self.channel_name)
                    await self.channel_layer.group_add(f"results:public:{event_id}", self.channel_name)
        except json.JSONDecodeError:
            pass
    
    async def registration_update(self, event):
        """Handle registration updates"""
        await self.send(text_data=json.dumps({
            'type': 'registration_update',
            'data': event['data']
        }))
    
    async def message_update(self, event):
        """Handle message updates"""
        await self.send(text_data=json.dumps({
            'type': 'message_update',
            'data': event['data']
        }))
    
    async def announcement_update(self, event):
        """Handle announcement updates"""
        await self.send(text_data=json.dumps({
            'type': 'announcement_update',
            'data': event['data']
        }))
    
    async def event_update(self, event):
        """Handle event updates"""
        await self.send(text_data=json.dumps({
            'type': 'event_update',
            'data': event['data']
        }))
    
    async def schedule_update(self, event):
        """Handle schedule updates"""
        await self.send(text_data=json.dumps({
            'type': 'schedule_update',
            'data': event['data']
        }))
    
    async def results_update(self, event):
        """Handle results updates"""
        await self.send(text_data=json.dumps({
            'type': 'results_update',
            'data': event['data']
        }))
    
    async def content_update(self, event):
        """Handle content updates"""
        await self.send(text_data=json.dumps({
            'type': 'content_update',
            'data': event['data']
        }))


class SpectatorConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for spectator real-time updates"""
    
    async def connect(self):
        """Connect to spectator WebSocket groups"""
        # Join public groups
        await self.channel_layer.group_add("content:public", self.channel_name)
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to spectator updates'
        }))
    
    async def disconnect(self, close_code):
        """Leave all groups on disconnect"""
        await self.channel_layer.group_discard("content:public", self.channel_name)
    
    async def receive(self, text_data):
        """Handle incoming messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            elif message_type == 'subscribe_event':
                # Subscribe to specific event updates
                event_id = data.get('event_id')
                if event_id:
                    await self.channel_layer.group_add(f"schedule:public:{event_id}", self.channel_name)
                    await self.channel_layer.group_add(f"results:public:{event_id}", self.channel_name)
        except json.JSONDecodeError:
            pass
    
    async def content_update(self, event):
        """Handle content updates"""
        await self.send(text_data=json.dumps({
            'type': 'content_update',
            'data': event['data']
        }))
    
    async def schedule_update(self, event):
        """Handle schedule updates"""
        await self.send(text_data=json.dumps({
            'type': 'schedule_update',
            'data': event['data']
        }))
    
    async def results_update(self, event):
        """Handle results updates"""
        await self.send(text_data=json.dumps({
            'type': 'results_update',
            'data': event['data']
        }))
