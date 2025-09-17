# teams/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from .models import Team, TeamMember
from events.models import Event
from fixtures.models import Fixture
from results.models import Result

User = get_user_model()


class TeamConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for team-specific real-time updates"""
    
    async def connect(self):
        self.team_id = self.scope['url_route']['kwargs']['team_id']
        self.user = self.scope['user']
        
        # Define group names for different topics
        self.team_group_name = f'team_{self.team_id}'
        self.schedule_group_name = f'team_{self.team_id}_schedule'
        self.results_group_name = f'team_{self.team_id}_results'
        
        # Verify team exists and user has permission
        team = await self.get_team(self.team_id)
        if not team:
            await self.close()
            return
        
        # Check permissions
        if not await self.can_view_team(self.user, team):
            await self.close()
            return
        
        # Join team group
        await self.channel_layer.group_add(
            self.team_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connected',
            'team_id': self.team_id,
            'team_name': team.name,
            'message': 'Connected to team updates',
            'topics': ['schedule', 'results']
        }))
    
    async def disconnect(self, close_code):
        # Leave team group
        await self.channel_layer.group_discard(
            self.team_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'subscribe_schedule':
                # Subscribe to team schedule updates
                await self.channel_layer.group_add(
                    self.schedule_group_name,
                    self.channel_name
                )
                await self.send(text_data=json.dumps({
                    'type': 'subscribed',
                    'stream': 'schedule'
                }))
                
            elif message_type == 'subscribe_results':
                # Subscribe to team results updates
                await self.channel_layer.group_add(
                    self.results_group_name,
                    self.channel_name
                )
                await self.send(text_data=json.dumps({
                    'type': 'subscribed',
                    'stream': 'results'
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
    
    # Team update handlers
    async def team_update(self, event):
        """Handle team updates"""
        await self.send(text_data=json.dumps({
            'type': 'team_update',
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
    
    @database_sync_to_async
    def get_team(self, team_id):
        """Get team by ID"""
        try:
            return Team.objects.get(id=team_id)
        except Team.DoesNotExist:
            return None
    
    @database_sync_to_async
    def can_view_team(self, user, team):
        """Check if user can view the team"""
        # Team members can view
        if TeamMember.objects.filter(team=team, athlete=user).exists():
            return True
        
        # Team manager and coach can view
        if team.manager == user or team.coach == user:
            return True
        
        # Event creator can view
        if team.event.created_by == user:
            return True
        
        # Check if user is registered for the event
        from registrations.models import Registration
        return Registration.objects.filter(
            event=team.event,
            applicant=user,
            status='APPROVED'
        ).exists()


class PurchaseConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for purchase/ticket status updates"""
    
    async def connect(self):
        self.purchase_id = self.scope['url_route']['kwargs']['purchase_id']
        self.user = self.scope['user']
        
        # Define group name for purchase updates
        self.purchase_group_name = f'purchase_{self.purchase_id}'
        
        # Verify purchase exists and user has permission
        purchase = await self.get_purchase(self.purchase_id)
        if not purchase:
            await self.close()
            return
        
        # Check permissions
        if not await self.can_view_purchase(self.user, purchase):
            await self.close()
            return
        
        # Join purchase group
        await self.channel_layer.group_add(
            self.purchase_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connected',
            'purchase_id': self.purchase_id,
            'message': 'Connected to purchase updates'
        }))
    
    async def disconnect(self, close_code):
        # Leave purchase group
        await self.channel_layer.group_discard(
            self.purchase_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
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
    
    # Purchase update handlers
    async def purchase_update(self, event):
        """Handle purchase updates"""
        await self.send(text_data=json.dumps({
            'type': 'purchase_update',
            'data': event['data']
        }))
    
    async def ticket_status_update(self, event):
        """Handle ticket status updates"""
        await self.send(text_data=json.dumps({
            'type': 'ticket_status_update',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_purchase(self, purchase_id):
        """Get purchase by ID"""
        try:
            # This would need to be implemented based on your purchase model
            # For now, return None as a placeholder
            return None
        except Exception:
            return None
    
    @database_sync_to_async
    def can_view_purchase(self, user, purchase):
        """Check if user can view the purchase"""
        # Only the purchaser can view their purchase
        if purchase and hasattr(purchase, 'user'):
            return purchase.user == user
        return False
