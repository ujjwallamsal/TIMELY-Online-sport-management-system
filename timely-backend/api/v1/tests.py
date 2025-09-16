# api/v1/tests.py
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from accounts.models import User
from events.models import Event
from venues.models import Venue
from registrations.models import Registration
from fixtures.models import Fixture
from results.models import Result

User = get_user_model()


class APIV1PermissionTests(APITestCase):
    """Test API v1 permissions and access control"""
    
    def setUp(self):
        """Set up test data"""
        # Create test users with different roles
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role='ADMIN',
            first_name='Admin',
            last_name='User'
        )
        
        self.organizer_user = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            role='ORGANIZER',
            first_name='Organizer',
            last_name='User'
        )
        
        self.coach_user = User.objects.create_user(
            email='coach@test.com',
            password='testpass123',
            role='COACH',
            first_name='Coach',
            last_name='User'
        )
        
        self.athlete_user = User.objects.create_user(
            email='athlete@test.com',
            password='testpass123',
            role='ATHLETE',
            first_name='Athlete',
            last_name='User'
        )
        
        self.spectator_user = User.objects.create_user(
            email='spectator@test.com',
            password='testpass123',
            role='SPECTATOR',
            first_name='Spectator',
            last_name='User'
        )
        
        # Create test data
        self.venue = Venue.objects.create(
            name='Test Venue',
            address='123 Test Street',
            capacity=100,
            created_by=self.admin_user
        )
        
        self.event = Event.objects.create(
            name='Test Event',
            sport_id=1,  # Assuming Sport with id=1 exists
            start_date='2024-12-01 10:00:00',
            end_date='2024-12-01 18:00:00',
            venue=self.venue,
            created_by=self.organizer_user
        )
    
    def test_admin_can_access_all_endpoints(self):
        """Test that admin users can access all endpoints"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test user management
        response = self.client.get('/api/v1/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test event management
        response = self.client.get('/api/v1/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test venue management
        response = self.client.get('/api/v1/venues/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_organizer_can_manage_events(self):
        """Test that organizer users can manage events"""
        self.client.force_authenticate(user=self.organizer_user)
        
        # Test event creation
        event_data = {
            'name': 'New Event',
            'sport': 1,
            'start_date': '2024-12-02 10:00:00',
            'end_date': '2024-12-02 18:00:00',
            'venue': self.venue.id
        }
        response = self.client.post('/api/v1/events/', event_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Test event update
        response = self.client.patch(f'/api/v1/events/{self.event.id}/', {'name': 'Updated Event'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_athlete_can_register_for_events(self):
        """Test that athlete users can register for events"""
        self.client.force_authenticate(user=self.athlete_user)
        
        # Test registration creation
        registration_data = {
            'event': self.event.id,
            'type': 'ATHLETE',
            'applicant': self.athlete_user.id
        }
        response = self.client.post('/api/v1/registrations/', registration_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_spectator_read_only_access(self):
        """Test that spectator users have read-only access"""
        self.client.force_authenticate(user=self.spectator_user)
        
        # Test read access
        response = self.client.get('/api/v1/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test write access (should be denied)
        event_data = {
            'name': 'New Event',
            'sport': 1,
            'start_date': '2024-12-02 10:00:00',
            'end_date': '2024-12-02 18:00:00'
        }
        response = self.client.post('/api/v1/events/', event_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users are denied access"""
        # Test user management
        response = self.client.get('/api/v1/users/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test event management
        response = self.client.get('/api/v1/events/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_role_based_permissions(self):
        """Test role-based permissions for different endpoints"""
        # Test that only admins can manage users
        self.client.force_authenticate(user=self.organizer_user)
        response = self.client.patch(f'/api/v1/users/{self.athlete_user.id}/', {'role': 'COACH'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test that admins can manage users
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(f'/api/v1/users/{self.athlete_user.id}/', {'role': 'COACH'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_event_organizer_permissions(self):
        """Test that organizers can only manage their own events"""
        # Create another organizer
        other_organizer = User.objects.create_user(
            email='other@test.com',
            password='testpass123',
            role='ORGANIZER',
            first_name='Other',
            last_name='Organizer'
        )
        
        # Create event for other organizer
        other_event = Event.objects.create(
            name='Other Event',
            sport_id=1,
            start_date='2024-12-02 10:00:00',
            end_date='2024-12-02 18:00:00',
            created_by=other_organizer
        )
        
        # Test that organizer cannot edit other organizer's event
        self.client.force_authenticate(user=self.organizer_user)
        response = self.client.patch(f'/api/v1/events/{other_event.id}/', {'name': 'Hacked Event'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test that organizer can edit their own event
        response = self.client.patch(f'/api/v1/events/{self.event.id}/', {'name': 'Updated Event'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class APIV1EndpointTests(APITestCase):
    """Test API v1 endpoint functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role='ADMIN',
            first_name='Admin',
            last_name='User'
        )
        
        self.venue = Venue.objects.create(
            name='Test Venue',
            address='123 Test Street',
            capacity=100,
            created_by=self.admin_user
        )
    
    def test_events_endpoint(self):
        """Test events endpoint functionality"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test GET events
        response = self.client.get('/api/v1/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test POST event
        event_data = {
            'name': 'Test Event',
            'sport': 1,
            'start_date': '2024-12-01 10:00:00',
            'end_date': '2024-12-01 18:00:00',
            'venue': self.venue.id
        }
        response = self.client.post('/api/v1/events/', event_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_venues_endpoint(self):
        """Test venues endpoint functionality"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test GET venues
        response = self.client.get('/api/v1/venues/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test POST venue
        venue_data = {
            'name': 'New Venue',
            'address': '456 New Street',
            'capacity': 200
        }
        response = self.client.post('/api/v1/venues/', venue_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_reports_endpoint(self):
        """Test reports endpoint functionality"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test GET reports
        response = self.client.get('/api/v1/reports/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response = self.client.get('/api/v1/reports/registrations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response = self.client.get('/api/v1/reports/fixtures/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response = self.client.get('/api/v1/reports/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
