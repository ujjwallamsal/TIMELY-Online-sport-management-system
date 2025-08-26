# accounts/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import User

class UserConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for user-specific updates"""
    
    async def connect(self):
        self.user = self.scope["user"]
        
        if isinstance(self.user, AnonymousUser):
            await self.close()
            return

        # Join user's personal room for updates
        self.room_group_name = f'user_{self.user.id}'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial user data
        user_data = await self.get_user_data()
        await self.send(text_data=json.dumps({
            'type': 'user_data',
            'data': user_data
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Handle incoming messages (not used for user updates)"""
        pass

    async def user_updated(self, event):
        """Send user update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'user.updated',
            'user_data': event['user_data']
        }))

    @database_sync_to_async
    def get_user_data(self):
        """Get current user data"""
        try:
            from .serializers import UserSerializer
            return UserSerializer(self.user).data
        except Exception:
            return None
