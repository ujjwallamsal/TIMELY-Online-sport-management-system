# public/tests/test_public.py
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from events.models import Event
from fixtures.models import Fixture
from results.models import Result
from content.models import Announcement
from teams.models import Team
from venues.models import Venue
from accounts.models import User


class PublicAPITestCase(APITestCase):
    """Test public API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create test venue
        self.venue = Venue.objects.create(
            name='Test Stadium',
            address='123 Test St',
            capacity=1000
        )
        
        # Create test teams
        self.team1 = Team.objects.create(
            name='Team Alpha',
            sport='Basketball'
        )
        self.team2 = Team.objects.create(
            name='Team Beta',
            sport='Basketball'
        )
        
        # Create test event
        self.event = Event.objects.create(
            name='Test Basketball Tournament',
            sport='Basketball',
            description='A test basketball tournament',
            start_datetime=timezone.now() + timezone.timedelta(days=7),
            end_datetime=timezone.now() + timezone.timedelta(days=8),
            location='Test Stadium',
            venue=self.venue,
            capacity=100,
            fee_cents=5000,
            lifecycle_status=Event.LifecycleStatus.PUBLISHED,
            created_by=self.user
        )
        
        # Create test fixture
        self.fixture = Fixture.objects.create(
            event=self.event,
            round_no=1,
            starts_at=timezone.now() + timezone.timedelta(days=7, hours=2),
            ends_at=timezone.now() + timezone.timedelta(days=7, hours=4),
            venue=self.venue,
            home_team=self.team1,
            away_team=self.team2,
            status=Fixture.Status.PUBLISHED
        )
        
        # Create test result
        self.result = Result.objects.create(
            fixture=self.fixture,
            score_home=85,
            score_away=78,
            notes='Great game!'
        )
        
        # Create test announcement
        self.announcement = Announcement.objects.create(
            title='Test Announcement',
            body='This is a test announcement',
            is_published=True,
            author=self.user
        )

    def test_public_events_list_published_only_ok(self):
        """Test that only published events are returned"""
        # Create a draft event
        draft_event = Event.objects.create(
            name='Draft Event',
            sport='Soccer',
            start_datetime=timezone.now() + timezone.timedelta(days=10),
            end_datetime=timezone.now() + timezone.timedelta(days=11),
            location='Test Location',
            lifecycle_status=Event.LifecycleStatus.DRAFT,
            created_by=self.user
        )
        
        url = reverse('public:events-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.event.id)

    def test_public_events_list_filters_ok(self):
        """Test event filtering by sport and date"""
        # Create another event with different sport
        soccer_event = Event.objects.create(
            name='Soccer Match',
            sport='Soccer',
            start_datetime=timezone.now() + timezone.timedelta(days=5),
            end_datetime=timezone.now() + timezone.timedelta(days=5, hours=2),
            location='Soccer Field',
            lifecycle_status=Event.LifecycleStatus.PUBLISHED,
            created_by=self.user
        )
        
        # Test sport filter
        url = reverse('public:events-list')
        response = self.client.get(url, {'sport': 'Basketball'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['sport'], 'Basketball')
        
        # Test search filter
        response = self.client.get(url, {'q': 'Basketball'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_public_event_detail_ok(self):
        """Test event detail endpoint"""
        url = reverse('public:event-detail', kwargs={'event_id': self.event.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.event.id)
        self.assertEqual(response.data['name'], self.event.name)
        self.assertIn('divisions', response.data)

    def test_public_event_detail_not_found(self):
        """Test event detail for non-existent event"""
        url = reverse('public:event-detail', kwargs={'event_id': 99999})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_public_fixtures_only_published_ok(self):
        """Test that only published fixtures are returned"""
        # Create a draft fixture
        draft_fixture = Fixture.objects.create(
            event=self.event,
            round_no=2,
            starts_at=timezone.now() + timezone.timedelta(days=8),
            ends_at=timezone.now() + timezone.timedelta(days=8, hours=2),
            status=Fixture.Status.DRAFT
        )
        
        url = reverse('public:event-fixtures', kwargs={'event_id': self.event.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.fixture.id)

    def test_public_fixtures_ordering_ok(self):
        """Test fixtures are ordered by starts_at"""
        # Create another fixture with earlier start time
        earlier_fixture = Fixture.objects.create(
            event=self.event,
            round_no=1,
            starts_at=timezone.now() + timezone.timedelta(days=7, hours=1),
            ends_at=timezone.now() + timezone.timedelta(days=7, hours=3),
            status=Fixture.Status.PUBLISHED
        )
        
        url = reverse('public:event-fixtures', kwargs={'event_id': self.event.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        # Should be ordered by starts_at
        self.assertEqual(response.data['results'][0]['id'], earlier_fixture.id)

    def test_public_results_and_leaderboard_ok(self):
        """Test results and leaderboard endpoint"""
        url = reverse('public:event-results', kwargs={'event_id': self.event.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('leaderboard', response.data)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['score_home'], 85)
        self.assertEqual(response.data['results'][0]['score_away'], 78)

    def test_public_news_ok(self):
        """Test news endpoint returns published announcements"""
        # Create unpublished announcement
        unpublished = Announcement.objects.create(
            title='Unpublished News',
            body='This should not appear',
            is_published=False,
            author=self.user
        )
        
        url = reverse('public:news-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.announcement.id)

    def test_public_home_ok(self):
        """Test home endpoint returns aggregated data"""
        url = reverse('public:home')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('heroEvents', response.data)
        self.assertIn('news', response.data)
        self.assertIn('highlights', response.data)
        self.assertEqual(len(response.data['heroEvents']), 1)
        self.assertEqual(len(response.data['news']), 1)
