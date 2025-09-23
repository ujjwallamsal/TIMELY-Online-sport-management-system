#!/usr/bin/env python3
"""
Test script for Django Channels real-time implementation.
Tests WebSocket connections, SSE fallback, and broadcasting functionality.
"""
import asyncio
import json
import time
import requests
import websockets
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from events.models import Event, Announcement
from teams.models import Team, TeamMember
from fixtures.models import Fixture
from results.models import Result
from events.realtime_service import realtime_service

User = get_user_model()


class RealtimeChannelsTest:
    """Test class for real-time functionality"""
    
    def __init__(self):
        self.base_url = "http://127.0.0.1:8000"
        self.ws_url = "ws://127.0.0.1:8000"
        self.test_event_id = None
        self.test_team_id = None
        self.test_user = None
    
    async def setup_test_data(self):
        """Create test data for testing"""
        print("Setting up test data...")
        
        # Create test user
        self.test_user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@example.com',
                'first_name': 'Test',
                'last_name': 'User',
                'role': 'ORGANIZER'
            }
        )
        
        # Create test event
        self.test_event, created = Event.objects.get_or_create(
            name='Test Event',
            defaults={
                'description': 'Test event for real-time testing',
                'start_date': '2024-01-01',
                'end_date': '2024-01-02',
                'visibility': 'PUBLIC',
                'created_by': self.test_user
            }
        )
        self.test_event_id = self.test_event.id
        
        # Create test team
        self.test_team, created = Team.objects.get_or_create(
            name='Test Team',
            defaults={
                'event': self.test_event,
                'manager': self.test_user,
                'description': 'Test team for real-time testing'
            }
        )
        self.test_team_id = self.test_team.id
        
        print(f"Created test event: {self.test_event.name} (ID: {self.test_event_id})")
        print(f"Created test team: {self.test_team.name} (ID: {self.test_team_id})")
    
    async def test_websocket_connection(self):
        """Test WebSocket connection to event stream"""
        print("\n=== Testing WebSocket Connection ===")
        
        try:
            # Test event WebSocket
            communicator = WebsocketCommunicator(
                'events.consumers.EventConsumer',
                f'/ws/events/{self.test_event_id}/stream/'
            )
            communicator.scope['user'] = self.test_user
            
            connected, subprotocol = await communicator.connect()
            assert connected, "Failed to connect to event WebSocket"
            
            # Test subscription to results
            await communicator.send_json_to({
                'type': 'subscribe_results'
            })
            
            response = await communicator.receive_json_from()
            assert response['type'] == 'subscribed', f"Failed to subscribe to results: {response}"
            print("✓ Successfully subscribed to results stream")
            
            # Test subscription to schedule
            await communicator.send_json_to({
                'type': 'subscribe_schedule'
            })
            
            response = await communicator.receive_json_from()
            assert response['type'] == 'subscribed', f"Failed to subscribe to schedule: {response}"
            print("✓ Successfully subscribed to schedule stream")
            
            # Test subscription to announcements
            await communicator.send_json_to({
                'type': 'subscribe_announcements'
            })
            
            response = await communicator.receive_json_from()
            assert response['type'] == 'subscribed', f"Failed to subscribe to announcements: {response}"
            print("✓ Successfully subscribed to announcements stream")
            
            await communicator.disconnect()
            print("✓ WebSocket connection test passed")
            
        except Exception as e:
            print(f"✗ WebSocket connection test failed: {e}")
            raise
    
    async def test_team_websocket_connection(self):
        """Test WebSocket connection to team stream"""
        print("\n=== Testing Team WebSocket Connection ===")
        
        try:
            # Test team WebSocket
            communicator = WebsocketCommunicator(
                'teams.consumers.TeamConsumer',
                f'/ws/teams/{self.test_team_id}/'
            )
            communicator.scope['user'] = self.test_user
            
            connected, subprotocol = await communicator.connect()
            assert connected, "Failed to connect to team WebSocket"
            
            # Test subscription to team schedule
            await communicator.send_json_to({
                'type': 'subscribe_schedule'
            })
            
            response = await communicator.receive_json_from()
            assert response['type'] == 'subscribed', f"Failed to subscribe to team schedule: {response}"
            print("✓ Successfully subscribed to team schedule stream")
            
            # Test subscription to team results
            await communicator.send_json_to({
                'type': 'subscribe_results'
            })
            
            response = await communicator.receive_json_from()
            assert response['type'] == 'subscribed', f"Failed to subscribe to team results: {response}"
            print("✓ Successfully subscribed to team results stream")
            
            await communicator.disconnect()
            print("✓ Team WebSocket connection test passed")
            
        except Exception as e:
            print(f"✗ Team WebSocket connection test failed: {e}")
            raise
    
    async def test_sse_endpoints(self):
        """Test SSE fallback endpoints"""
        print("\n=== Testing SSE Endpoints ===")
        
        try:
            # Test event results SSE
            response = requests.get(
                f"{self.base_url}/api/events/{self.test_event_id}/stream/results/",
                headers={'Authorization': f'Bearer {self.get_auth_token()}'},
                stream=True,
                timeout=5
            )
            assert response.status_code == 200, f"SSE results endpoint failed: {response.status_code}"
            print("✓ Event results SSE endpoint working")
            
            # Test event schedule SSE
            response = requests.get(
                f"{self.base_url}/api/events/{self.test_event_id}/stream/schedule/",
                headers={'Authorization': f'Bearer {self.get_auth_token()}'},
                stream=True,
                timeout=5
            )
            assert response.status_code == 200, f"SSE schedule endpoint failed: {response.status_code}"
            print("✓ Event schedule SSE endpoint working")
            
            # Test team SSE
            response = requests.get(
                f"{self.base_url}/api/teams/{self.test_team_id}/stream/",
                headers={'Authorization': f'Bearer {self.get_auth_token()}'},
                stream=True,
                timeout=5
            )
            assert response.status_code == 200, f"SSE team endpoint failed: {response.status_code}"
            print("✓ Team SSE endpoint working")
            
        except Exception as e:
            print(f"✗ SSE endpoints test failed: {e}")
            raise
    
    def get_auth_token(self):
        """Get authentication token for API requests"""
        # This would need to be implemented based on your auth system
        return "test-token"
    
    async def test_broadcasting(self):
        """Test real-time broadcasting functionality"""
        print("\n=== Testing Broadcasting ===")
        
        try:
            # Test leaderboard broadcasting
            realtime_service.broadcast_event_leaderboard(self.test_event_id)
            print("✓ Leaderboard broadcasting working")
            
            # Test schedule broadcasting
            realtime_service.broadcast_fixture_schedule(self.test_event_id)
            print("✓ Schedule broadcasting working")
            
            # Test announcement broadcasting
            announcement_data = {
                'title': 'Test Announcement',
                'message': 'This is a test announcement',
                'type': 'GENERAL',
                'priority': 'NORMAL'
            }
            realtime_service.broadcast_announcement(self.test_event_id, announcement_data)
            print("✓ Announcement broadcasting working")
            
        except Exception as e:
            print(f"✗ Broadcasting test failed: {e}")
            raise
    
    async def test_permissions(self):
        """Test permission-based access control"""
        print("\n=== Testing Permissions ===")
        
        try:
            # Create a non-privileged user
            regular_user, created = User.objects.get_or_create(
                username='regularuser',
                defaults={
                    'email': 'regular@example.com',
                    'first_name': 'Regular',
                    'last_name': 'User',
                    'role': 'ATHLETE'
                }
            )
            
            # Test that regular user can connect to public event
            communicator = WebsocketCommunicator(
                'events.consumers.EventConsumer',
                f'/ws/events/{self.test_event_id}/stream/'
            )
            communicator.scope['user'] = regular_user
            
            connected, subprotocol = await communicator.connect()
            assert connected, "Regular user should be able to connect to public event"
            print("✓ Regular user can connect to public event")
            
            await communicator.disconnect()
            
        except Exception as e:
            print(f"✗ Permissions test failed: {e}")
            raise
    
    async def run_all_tests(self):
        """Run all tests"""
        print("Starting Django Channels Real-time Implementation Tests")
        print("=" * 60)
        
        try:
            await self.setup_test_data()
            await self.test_websocket_connection()
            await self.test_team_websocket_connection()
            await self.test_sse_endpoints()
            await self.test_broadcasting()
            await self.test_permissions()
            
            print("\n" + "=" * 60)
            print("🎉 All tests passed! Real-time implementation is working correctly.")
            
        except Exception as e:
            print(f"\n❌ Tests failed: {e}")
            raise


async def main():
    """Main test runner"""
    tester = RealtimeChannelsTest()
    await tester.run_all_tests()


if __name__ == "__main__":
    # Set up Django environment
    import os
    import django
    from django.conf import settings
    
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timely.settings')
    django.setup()
    
    # Run tests
    asyncio.run(main())
