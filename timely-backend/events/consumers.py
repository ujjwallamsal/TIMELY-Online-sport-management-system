import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import Event
from .serializers import EventSerializer

class EventConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.event_id = self.scope['url_route']['kwargs']['event_id']
        self.room_group_name = f'event_{self.event_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Send initial event data
        event_data = await self.get_event_data()
        await self.send(text_data=json.dumps({
            'type': 'event_data',
            'data': event_data
        }))

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')

        if message_type == 'join_event':
            await self.join_event(text_data_json)
        elif message_type == 'leave_event':
            await self.leave_event(text_data_json)
        elif message_type == 'chat_message':
            await self.chat_message(text_data_json)

    async def join_event(self, data):
        if isinstance(self.user, AnonymousUser):
            return

        # Add user to event room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_joined',
                'user_id': self.user.id,
                'username': self.user.username,
                'message': f'{self.user.username} joined the event'
            }
        )

    async def leave_event(self, data):
        if isinstance(self.user, AnonymousUser):
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_left',
                'user_id': self.user.id,
                'username': self.user.username,
                'message': f'{self.user.username} left the event'
            }
        )

    async def chat_message(self, data):
        if isinstance(self.user, AnonymousUser):
            return

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'user_id': self.user.id,
                'username': self.user.username,
                'message': data['message'],
                'timestamp': data.get('timestamp')
            }
        )

    async def event_update(self, event):
        # Send event update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'event_update',
            'data': event['data']
        }))

    async def match_update(self, event):
        # Send match update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'match_update',
            'data': event['data']
        }))

    async def user_joined(self, event):
        # Send user joined message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user_id': event['user_id'],
            'username': event['username'],
            'message': event['message']
        }))

    async def user_left(self, event):
        # Send user left message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'user_id': event['user_id'],
            'username': event['username'],
            'message': event['message']
        }))

    async def chat_message(self, event):
        # Send chat message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'user_id': event['user_id'],
            'username': event['username'],
            'message': event['message'],
            'timestamp': event['timestamp']
        }))

    @database_sync_to_async
    def get_event_data(self):
        try:
            event = Event.objects.get(id=self.event_id)
            return EventSerializer(event).data
        except Event.DoesNotExist:
            return None

class MatchConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.close()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        if isinstance(self.user, AnonymousUser):
            await self.close()
            return

        self.room_group_name = f'user_{self.user.id}'

        # Join user's personal notification room
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def notification_message(self, event):
        # Send notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'title': event['title'],
            'message': event['message'],
            'notification_type': event['notification_type'],
            'timestamp': event['timestamp']
        }))

    async def registration_update(self, event):
        # Send registration update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'registration_update',
            'registration_id': event['registration_id'],
            'status': event['status'],
            'message': event['message'],
            'timestamp': event['timestamp']
        }))
