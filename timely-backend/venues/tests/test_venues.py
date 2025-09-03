# venues/tests/test_venues.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import timedelta

from ..models import Venue, VenueSlot
from ..services.availability import find_conflicts, check_availability

User = get_user_model()


class VenueModelTest(TestCase):
    """Test Venue model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_venue_ok(self):
        """Test creating a venue successfully"""
        venue = Venue.objects.create(
            name='Test Stadium',
            address='123 Sports Ave',
            capacity=1000,
            facilities='{"parking": true, "locker_rooms": true}',
            timezone='UTC',
            created_by=self.user
        )
        
        self.assertEqual(venue.name, 'Test Stadium')
        self.assertEqual(venue.capacity, 1000)
        self.assertEqual(venue.created_by, self.user)
        self.assertTrue(venue.id is not None)
    
    def test_venue_validation(self):
        """Test venue validation rules"""
        # Test negative capacity
        with self.assertRaises(Exception):
            venue = Venue(
                name='Test Stadium',
                address='123 Sports Ave',
                capacity=-1,
                created_by=self.user
            )
            venue.clean()


class VenueSlotModelTest(TestCase):
    """Test VenueSlot model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.venue = Venue.objects.create(
            name='Test Stadium',
            address='123 Sports Ave',
            capacity=1000,
            created_by=self.user
        )
    
    def test_create_venue_slot_ok(self):
        """Test creating a venue slot successfully"""
        starts_at = timezone.now()
        ends_at = starts_at + timedelta(hours=2)
        
        slot = VenueSlot.objects.create(
            venue=self.venue,
            starts_at=starts_at,
            ends_at=ends_at,
            status=VenueSlot.Status.AVAILABLE
        )
        
        self.assertEqual(slot.venue, self.venue)
        self.assertEqual(slot.status, VenueSlot.Status.AVAILABLE)
        self.assertEqual(slot.duration_minutes, 120)
    
    def test_cannot_add_inverted_slot(self):
        """Test that slots with end before start are rejected"""
        starts_at = timezone.now()
        ends_at = starts_at - timedelta(hours=1)  # End before start
        
        with self.assertRaises(Exception):
            slot = VenueSlot(
                venue=self.venue,
                starts_at=starts_at,
                ends_at=ends_at
            )
            slot.clean()
    
    def test_blocked_slot_requires_reason(self):
        """Test that blocked slots must have a reason"""
        starts_at = timezone.now()
        ends_at = starts_at + timedelta(hours=2)
        
        with self.assertRaises(Exception):
            slot = VenueSlot(
                venue=self.venue,
                starts_at=starts_at,
                ends_at=ends_at,
                status=VenueSlot.Status.BLOCKED,
                reason=''  # Empty reason
            )
            slot.clean()


class VenueAPITest(APITestCase):
    """Test Venue API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            is_staff=True
        )
        self.venue = Venue.objects.create(
            name='Test Stadium',
            address='123 Sports Ave',
            capacity=1000,
            created_by=self.user
        )
    
    def test_create_venue_ok(self):
        """Test creating a venue via API"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': 'New Stadium',
            'address': '456 Sports Blvd',
            'capacity': 2000,
            'facilities': '{"parking": true}',
            'timezone': 'UTC'
        }
        
        response = self.client.post('/api/venues/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Venue.objects.count(), 2)
    
    def test_update_venue_ok(self):
        """Test updating a venue via API"""
        self.client.force_authenticate(user=self.user)
        
        data = {'capacity': 1500}
        response = self.client.patch(f'/api/venues/{self.venue.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.venue.refresh_from_db()
        self.assertEqual(self.venue.capacity, 1500)
    
    def test_delete_venue_ok(self):
        """Test deleting a venue via API"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.delete(f'/api/venues/{self.venue.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Venue.objects.count(), 0)
    
    def test_list_filters_q_and_capacity_ok(self):
        """Test venue list filtering by search and capacity"""
        self.client.force_authenticate(user=self.user)
        
        # Test search filter
        response = self.client.get('/api/venues/?search=Stadium')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test capacity filter
        response = self.client.get('/api/venues/?capacity__gte=500')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class VenueSlotAPITest(APITestCase):
    """Test VenueSlot API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.venue = Venue.objects.create(
            name='Test Stadium',
            address='123 Sports Ave',
            capacity=1000,
            created_by=self.user
        )
        self.starts_at = timezone.now()
        self.ends_at = self.starts_at + timedelta(hours=2)
    
    def test_add_blocked_slot_ok(self):
        """Test adding a blocked slot via API"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'venue': self.venue.id,
            'starts_at': self.starts_at.isoformat(),
            'ends_at': self.ends_at.isoformat(),
            'status': VenueSlot.Status.BLOCKED,
            'reason': 'Maintenance'
        }
        
        response = self.client.post('/api/slots/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(VenueSlot.objects.count(), 1)
        
        slot = VenueSlot.objects.first()
        self.assertEqual(slot.status, VenueSlot.Status.BLOCKED)
        self.assertEqual(slot.reason, 'Maintenance')


class AvailabilityServiceTest(TestCase):
    """Test availability service functions"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.venue = Venue.objects.create(
            name='Test Stadium',
            address='123 Sports Ave',
            capacity=1000,
            created_by=self.user
        )
        
        # Create some test slots
        base_time = timezone.now()
        self.slot1 = VenueSlot.objects.create(
            venue=self.venue,
            starts_at=base_time,
            ends_at=base_time + timedelta(hours=2),
            status=VenueSlot.Status.AVAILABLE
        )
        self.slot2 = VenueSlot.objects.create(
            venue=self.venue,
            starts_at=base_time + timedelta(hours=3),
            ends_at=base_time + timedelta(hours=5),
            status=VenueSlot.Status.BLOCKED,
            reason='Maintenance'
        )
    
    def test_check_conflicts_detects_overlap_ok(self):
        """Test that conflict detection finds overlapping slots"""
        # Test overlapping time range
        test_start = self.slot1.starts_at + timedelta(minutes=30)
        test_end = self.slot1.ends_at + timedelta(minutes=30)
        
        conflicts = find_conflicts(self.venue.id, test_start, test_end)
        self.assertEqual(len(conflicts), 1)
        self.assertEqual(conflicts[0]['id'], self.slot1.id)
    
    def test_check_availability_returns_slots(self):
        """Test that availability check returns proper slot data"""
        from_date = self.slot1.starts_at - timedelta(hours=1)
        to_date = self.slot2.ends_at + timedelta(hours=1)
        
        availability = check_availability(self.venue.id, from_date, to_date)
        
        self.assertIn('available_slots', availability)
        self.assertIn('blocked_slots', availability)
        self.assertEqual(len(availability['available_slots']), 1)
        self.assertEqual(len(availability['blocked_slots']), 1)
        self.assertEqual(availability['total_slots'], 2)