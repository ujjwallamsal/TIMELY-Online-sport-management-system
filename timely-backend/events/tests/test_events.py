from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import datetime, timedelta
from .models import Event, Division

User = get_user_model()


class EventModelTest(TestCase):
    """Test Event model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            role='ORGANIZER'
        )
        self.event = Event.objects.create(
            name='Test Event',
            sport='Football',
            description='Test event description',
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            location='Test Location',
            capacity=100,
            fee_cents=5000,
            created_by=self.user
        )
    
    def test_event_creation(self):
        """Test event creation"""
        self.assertEqual(self.event.name, 'Test Event')
        self.assertEqual(self.event.sport, 'Football')
        self.assertEqual(self.event.lifecycle_status, Event.LifecycleStatus.DRAFT)
        self.assertEqual(self.event.created_by, self.user)
    
    def test_phase_computation(self):
        """Test phase computation"""
        # Future event should be upcoming
        self.assertEqual(self.event.phase, 'upcoming')
        
        # Past event should be completed
        past_event = Event.objects.create(
            name='Past Event',
            sport='Basketball',
            start_datetime=timezone.now() - timedelta(days=2),
            end_datetime=timezone.now() - timedelta(days=1),
            location='Past Location',
            created_by=self.user
        )
        self.assertEqual(past_event.phase, 'completed')
        
        # Current event should be ongoing
        current_event = Event.objects.create(
            name='Current Event',
            sport='Tennis',
            start_datetime=timezone.now() - timedelta(hours=1),
            end_datetime=timezone.now() + timedelta(hours=1),
            location='Current Location',
            created_by=self.user
        )
        self.assertEqual(current_event.phase, 'ongoing')
    
    def test_event_validation(self):
        """Test event validation"""
        # Test invalid datetime order
        with self.assertRaises(Exception):
            Event.objects.create(
                name='Invalid Event',
                sport='Soccer',
                start_datetime=timezone.now() + timedelta(days=2),
                end_datetime=timezone.now() + timedelta(days=1),  # End before start
                location='Invalid Location',
                created_by=self.user
            )


class DivisionModelTest(TestCase):
    """Test Division model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            role='ORGANIZER'
        )
        self.event = Event.objects.create(
            name='Test Event',
            sport='Football',
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            location='Test Location',
            created_by=self.user
        )
    
    def test_division_creation(self):
        """Test division creation"""
        division = Division.objects.create(
            event=self.event,
            name='U18',
            sort_order=1
        )
        self.assertEqual(division.name, 'U18')
        self.assertEqual(division.event, self.event)
    
    def test_division_uniqueness(self):
        """Test division name uniqueness within event"""
        Division.objects.create(
            event=self.event,
            name='U18',
            sort_order=1
        )
        
        # Should raise validation error for duplicate name
        with self.assertRaises(Exception):
            Division.objects.create(
                event=self.event,
                name='U18',  # Duplicate name
                sort_order=2
            )


class EventAPITest(APITestCase):
    """Test Event API endpoints"""
    
    def setUp(self):
        self.organizer = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            role='ORGANIZER'
        )
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role='ADMIN'
        )
        self.athlete = User.objects.create_user(
            email='athlete@test.com',
            password='testpass123',
            role='ATHLETE'
        )
        
        self.event = Event.objects.create(
            name='Test Event',
            sport='Football',
            description='Test event description',
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            location='Test Location',
            capacity=100,
            fee_cents=5000,
            created_by=self.organizer
        )
    
    def test_create_event_organizer_ok(self):
        """Test organizer can create events"""
        self.client.force_authenticate(user=self.organizer)
        
        data = {
            'name': 'New Event',
            'sport': 'Basketball',
            'description': 'New event description',
            'start_datetime': (timezone.now() + timedelta(days=1)).isoformat(),
            'end_datetime': (timezone.now() + timedelta(days=2)).isoformat(),
            'location': 'New Location',
            'capacity': 50,
            'fee_cents': 3000
        }
        
        response = self.client.post('/api/events/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Event.objects.count(), 2)
    
    def test_create_event_athlete_forbidden(self):
        """Test athlete cannot create events"""
        self.client.force_authenticate(user=self.athlete)
        
        data = {
            'name': 'New Event',
            'sport': 'Basketball',
            'start_datetime': (timezone.now() + timedelta(days=1)).isoformat(),
            'end_datetime': (timezone.now() + timedelta(days=2)).isoformat(),
            'location': 'New Location'
        }
        
        response = self.client.post('/api/events/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_publish_and_unpublish_ok(self):
        """Test publish and unpublish lifecycle actions"""
        self.client.force_authenticate(user=self.organizer)
        
        # Publish event
        response = self.client.post(f'/api/events/{self.event.id}/publish/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.event.refresh_from_db()
        self.assertEqual(self.event.lifecycle_status, Event.LifecycleStatus.PUBLISHED)
        
        # Unpublish event
        response = self.client.post(f'/api/events/{self.event.id}/unpublish/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.event.refresh_from_db()
        self.assertEqual(self.event.lifecycle_status, Event.LifecycleStatus.DRAFT)
    
    def test_cancel_ok(self):
        """Test event cancellation"""
        self.client.force_authenticate(user=self.organizer)
        
        # Cancel event
        response = self.client.post(f'/api/events/{self.event.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.event.refresh_from_db()
        self.assertEqual(self.event.lifecycle_status, Event.LifecycleStatus.CANCELLED)
    
    def test_public_list_filters(self):
        """Test public list with filters"""
        # Publish the event first
        self.event.lifecycle_status = Event.LifecycleStatus.PUBLISHED
        self.event.save()
        
        # Test sport filter
        response = self.client.get('/api/events/?sport=Football')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test search query
        response = self.client.get('/api/events/?q=Test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_detail_phase_field_present(self):
        """Test event detail includes computed phase field"""
        response = self.client.get(f'/api/events/{self.event.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('phase', response.data)
        self.assertEqual(response.data['phase'], 'upcoming')


class DivisionAPITest(APITestCase):
    """Test Division API endpoints"""
    
    def setUp(self):
        self.organizer = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            role='ORGANIZER'
        )
        self.event = Event.objects.create(
            name='Test Event',
            sport='Football',
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            location='Test Location',
            created_by=self.organizer
        )
    
    def test_divisions_crud_unique_names(self):
        """Test division CRUD with unique name validation"""
        self.client.force_authenticate(user=self.organizer)
        
        # Create first division
        data = {'name': 'U18', 'sort_order': 1}
        response = self.client.post(f'/api/events/{self.event.id}/divisions/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Try to create duplicate name
        data = {'name': 'U18', 'sort_order': 2}
        response = self.client.post(f'/api/events/{self.event.id}/divisions/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # List divisions
        response = self.client.get(f'/api/events/{self.event.id}/divisions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
