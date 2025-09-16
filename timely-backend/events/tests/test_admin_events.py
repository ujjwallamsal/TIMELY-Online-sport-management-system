# events/tests/test_admin_events.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from events.models import Event

User = get_user_model()


class AdminEventsAPITestCase(TestCase):
    """Test cases for admin events API functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test users
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            username='admin',
            password='testpass123',
            role='ADMIN',
            is_active=True
        )
        
        self.organizer_user = User.objects.create_user(
            email='organizer@test.com',
            username='organizer',
            password='testpass123',
            role='ORGANIZER',
            is_active=True
        )
        
        self.athlete_user = User.objects.create_user(
            email='athlete@test.com',
            username='athlete',
            password='testpass123',
            role='ATHLETE',
            is_active=True
        )
        
        # Create test event
        self.test_event = Event.objects.create(
            name='Test Event',
            sport='football',
            description='A test event',
            start_datetime='2024-12-01T10:00:00Z',
            end_datetime='2024-12-01T18:00:00Z',
            location='Test Stadium',
            capacity=100,
            fee_cents=5000,
            created_by=self.organizer_user
        )
    
    def test_admin_can_view_all_events(self):
        """Test that admin can view all events"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/events/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Test Event')
    
    def test_organizer_can_view_own_events(self):
        """Test that organizer can view their own events"""
        self.client.force_authenticate(user=self.organizer_user)
        response = self.client.get('/api/events/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Test Event')
    
    def test_athlete_can_view_published_events_only(self):
        """Test that athlete can only view published events"""
        self.client.force_authenticate(user=self.athlete_user)
        response = self.client.get('/api/events/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Draft event should not be visible to athlete
        self.assertEqual(len(response.data['results']), 0)
        
        # Publish the event
        self.test_event.lifecycle_status = Event.LifecycleStatus.PUBLISHED
        self.test_event.save()
        
        response = self.client.get('/api/events/')
        self.assertEqual(len(response.data['results']), 1)
    
    def test_admin_can_create_event(self):
        """Test that admin can create events"""
        self.client.force_authenticate(user=self.admin_user)
        
        event_data = {
            'name': 'Admin Event',
            'sport': 'basketball',
            'description': 'An event created by admin',
            'start_datetime': '2024-12-02T10:00:00Z',
            'end_datetime': '2024-12-02T18:00:00Z',
            'location': 'Admin Stadium',
            'capacity': 200,
            'fee_cents': 10000
        }
        
        response = self.client.post('/api/events/', event_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Admin Event')
        self.assertEqual(response.data['created_by'], self.admin_user.id)
    
    def test_organizer_can_create_event(self):
        """Test that organizer can create events"""
        self.client.force_authenticate(user=self.organizer_user)
        
        event_data = {
            'name': 'Organizer Event',
            'sport': 'tennis',
            'description': 'An event created by organizer',
            'start_datetime': '2024-12-03T10:00:00Z',
            'end_datetime': '2024-12-03T18:00:00Z',
            'location': 'Organizer Stadium',
            'capacity': 50,
            'fee_cents': 0
        }
        
        response = self.client.post('/api/events/', event_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Organizer Event')
    
    def test_athlete_cannot_create_event(self):
        """Test that athlete cannot create events"""
        self.client.force_authenticate(user=self.athlete_user)
        
        event_data = {
            'name': 'Athlete Event',
            'sport': 'swimming',
            'description': 'An event created by athlete',
            'start_datetime': '2024-12-04T10:00:00Z',
            'end_datetime': '2024-12-04T18:00:00Z',
            'location': 'Athlete Pool',
            'capacity': 25,
            'fee_cents': 0
        }
        
        response = self.client.post('/api/events/', event_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_admin_can_publish_event(self):
        """Test that admin can publish events"""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.post(f'/api/events/{self.test_event.id}/publish/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that event is now published
        self.test_event.refresh_from_db()
        self.assertEqual(self.test_event.lifecycle_status, Event.LifecycleStatus.PUBLISHED)
    
    def test_organizer_can_publish_own_event(self):
        """Test that organizer can publish their own events"""
        self.client.force_authenticate(user=self.organizer_user)
        
        response = self.client.post(f'/api/events/{self.test_event.id}/publish/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that event is now published
        self.test_event.refresh_from_db()
        self.assertEqual(self.test_event.lifecycle_status, Event.LifecycleStatus.PUBLISHED)
    
    def test_organizer_cannot_publish_others_event(self):
        """Test that organizer cannot publish others' events"""
        # Create another organizer's event
        other_organizer = User.objects.create_user(
            email='other@test.com',
            username='other',
            password='testpass123',
            role='ORGANIZER',
            is_active=True
        )
        
        other_event = Event.objects.create(
            name='Other Event',
            sport='cricket',
            description='Another test event',
            start_datetime='2024-12-05T10:00:00Z',
            end_datetime='2024-12-05T18:00:00Z',
            location='Other Stadium',
            capacity=150,
            fee_cents=7500,
            created_by=other_organizer
        )
        
        self.client.force_authenticate(user=self.organizer_user)
        response = self.client.post(f'/api/events/{other_event.id}/publish/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_event_fixtures_endpoint(self):
        """Test that fixtures endpoint works for admin/organizer"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/events/{self.test_event.id}/fixtures/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['event_id'], self.test_event.id)
        self.assertEqual(response.data['event_name'], 'Test Event')
        self.assertIn('fixtures', response.data)
    
    def test_athlete_cannot_access_fixtures(self):
        """Test that athlete cannot access fixtures endpoint"""
        self.client.force_authenticate(user=self.athlete_user)
        response = self.client.get(f'/api/events/{self.test_event.id}/fixtures/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_event_filtering(self):
        """Test event filtering functionality"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test sport filter
        response = self.client.get('/api/events/?sport=football')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test search filter
        response = self.client.get('/api/events/?q=Test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test status filter
        response = self.client.get('/api/events/?status=draft')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
