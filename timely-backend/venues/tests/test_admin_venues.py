# venues/tests/test_admin_venues.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from venues.models import Venue, VenueSlot
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()


class AdminVenuesAPITestCase(TestCase):
    """Test cases for admin venues API functionality"""
    
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
        
        # Create test venue
        self.test_venue = Venue.objects.create(
            name='Test Stadium',
            address='123 Test Street, Test City',
            capacity=1000,
            facilities={'parking': True, 'wifi': True, 'catering': False},
            timezone='UTC',
            created_by=self.organizer_user
        )
    
    def test_admin_can_view_venues(self):
        """Test that admin can view all venues"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/venues/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Test Stadium')
    
    def test_organizer_can_view_own_venues(self):
        """Test that organizer can view their own venues"""
        self.client.force_authenticate(user=self.organizer_user)
        response = self.client.get('/api/venues/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Test Stadium')
    
    def test_athlete_cannot_view_venues(self):
        """Test that athlete cannot view venues"""
        self.client.force_authenticate(user=self.athlete_user)
        response = self.client.get('/api/venues/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_admin_can_create_venue(self):
        """Test that admin can create venues"""
        self.client.force_authenticate(user=self.admin_user)
        
        venue_data = {
            'name': 'Admin Stadium',
            'address': '456 Admin Avenue, Admin City',
            'capacity': 2000,
            'facilities': {'parking': True, 'wifi': True, 'catering': True},
            'timezone': 'America/New_York'
        }
        
        response = self.client.post('/api/venues/', venue_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Admin Stadium')
        self.assertEqual(response.data['created_by'], self.admin_user.id)
    
    def test_organizer_can_create_venue(self):
        """Test that organizer can create venues"""
        self.client.force_authenticate(user=self.organizer_user)
        
        venue_data = {
            'name': 'Organizer Arena',
            'address': '789 Organizer Boulevard, Organizer City',
            'capacity': 500,
            'facilities': {'parking': False, 'wifi': True, 'catering': False},
            'timezone': 'America/Los_Angeles'
        }
        
        response = self.client.post('/api/venues/', venue_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Organizer Arena')
    
    def test_venue_creation_validation(self):
        """Test venue creation validation"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test missing required fields
        response = self.client.post('/api/venues/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
        self.assertIn('address', response.data)
    
    def test_venue_filtering(self):
        """Test venue filtering functionality"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test search filter
        response = self.client.get('/api/venues/?q=Test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test capacity filter
        response = self.client.get('/api/venues/?capacity_min=500')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test no results
        response = self.client.get('/api/venues/?q=Nonexistent')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)
    
    def test_venue_slots_creation(self):
        """Test venue slots creation"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Create slots data
        now = timezone.now()
        slots_data = {
            'slots': [
                {
                    'starts_at': (now + timedelta(hours=1)).isoformat(),
                    'ends_at': (now + timedelta(hours=3)).isoformat(),
                    'status': 'available'
                },
                {
                    'starts_at': (now + timedelta(hours=4)).isoformat(),
                    'ends_at': (now + timedelta(hours=6)).isoformat(),
                    'status': 'available'
                }
            ]
        }
        
        response = self.client.post(f'/api/venues/{self.test_venue.id}/slots/', slots_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['created_slots']), 2)
        self.assertEqual(len(response.data['errors']), 0)
        
        # Verify slots were created in database
        slots = VenueSlot.objects.filter(venue=self.test_venue)
        self.assertEqual(slots.count(), 2)
    
    def test_venue_slots_conflict_detection(self):
        """Test venue slots conflict detection"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Create initial slot
        now = timezone.now()
        VenueSlot.objects.create(
            venue=self.test_venue,
            starts_at=now + timedelta(hours=1),
            ends_at=now + timedelta(hours=3),
            status=VenueSlot.Status.AVAILABLE
        )
        
        # Try to create overlapping slot
        slots_data = {
            'slots': [
                {
                    'starts_at': (now + timedelta(hours=2)).isoformat(),  # Overlaps
                    'ends_at': (now + timedelta(hours=4)).isoformat(),
                    'status': 'available'
                }
            ]
        }
        
        response = self.client.post(f'/api/venues/{self.test_venue.id}/slots/', slots_data)
        self.assertEqual(response.status_code, status.HTTP_207_MULTI_STATUS)  # Multi-status for partial success
        self.assertEqual(len(response.data['created_slots']), 0)
        self.assertEqual(len(response.data['errors']), 1)
        self.assertIn('conflicts', response.data['errors'][0])
    
    def test_venue_conflict_check(self):
        """Test venue conflict checking endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Create existing slot
        now = timezone.now()
        VenueSlot.objects.create(
            venue=self.test_venue,
            starts_at=now + timedelta(hours=1),
            ends_at=now + timedelta(hours=3),
            status=VenueSlot.Status.AVAILABLE
        )
        
        # Check for conflicts
        conflict_data = {
            'venue_id': self.test_venue.id,
            'starts_at': (now + timedelta(hours=2)).isoformat(),
            'ends_at': (now + timedelta(hours=4)).isoformat()
        }
        
        response = self.client.post('/api/venues/check-conflicts/', conflict_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['has_conflicts'])
        self.assertEqual(len(response.data['conflicts']), 1)
    
    def test_venue_availability(self):
        """Test venue availability endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Create some slots
        now = timezone.now()
        VenueSlot.objects.create(
            venue=self.test_venue,
            starts_at=now + timedelta(hours=1),
            ends_at=now + timedelta(hours=3),
            status=VenueSlot.Status.AVAILABLE
        )
        
        VenueSlot.objects.create(
            venue=self.test_venue,
            starts_at=now + timedelta(hours=4),
            ends_at=now + timedelta(hours=6),
            status=VenueSlot.Status.BLOCKED,
            reason='Maintenance'
        )
        
        # Get availability
        from_date = (now + timedelta(minutes=30)).isoformat()
        to_date = (now + timedelta(hours=8)).isoformat()
        
        response = self.client.get(f'/api/venues/{self.test_venue.id}/availability/?from={from_date}&to={to_date}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['venue_id'], self.test_venue.id)
        self.assertEqual(len(response.data['available_slots']), 1)
        self.assertEqual(len(response.data['blocked_slots']), 1)
        self.assertEqual(response.data['total_available'], 1)
        self.assertEqual(response.data['total_blocked'], 1)
    
    def test_venue_availability_validation(self):
        """Test venue availability validation"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test missing parameters
        response = self.client.get(f'/api/venues/{self.test_venue.id}/availability/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        
        # Test invalid date format
        response = self.client.get(f'/api/venues/{self.test_venue.id}/availability/?from=invalid&to=invalid')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_unauthorized_venue_access(self):
        """Test that unauthorized users cannot access venue management"""
        # Test without authentication
        response = self.client.get('/api/venues/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test with athlete user
        self.client.force_authenticate(user=self.athlete_user)
        response = self.client.get('/api/venues/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
