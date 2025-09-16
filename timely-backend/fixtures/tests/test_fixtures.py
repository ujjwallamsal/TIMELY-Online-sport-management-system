# fixtures/tests/test_fixtures.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import timedelta

from events.models import Event
from api.models import Team
from venues.models import Venue
from .models import Fixture, FixtureEntry
from .services.generator import generate_round_robin, generate_knockout
from .services.conflicts import find_conflicts, check_venue_availability

User = get_user_model()


class FixtureModelTest(TestCase):
    """Test fixture model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='organizer',
            email='organizer@test.com',
            password='testpass123'
        )
        self.event = Event.objects.create(
            name='Test Event',
            created_by=self.user,
            starts_at=timezone.now() + timedelta(days=1),
            ends_at=timezone.now() + timedelta(days=2)
        )
        self.venue = Venue.objects.create(
            name='Test Venue',
            address='123 Test St',
            capacity=100,
            created_by=self.user
        )
    
    def test_fixture_creation(self):
        """Test creating a fixture"""
        fixture = Fixture.objects.create(
            event=self.event,
            round_no=1,
            starts_at=timezone.now() + timedelta(hours=1),
            ends_at=timezone.now() + timedelta(hours=2),
            venue=self.venue
        )
        
        self.assertEqual(fixture.event, self.event)
        self.assertEqual(fixture.round_no, 1)
        self.assertEqual(fixture.venue, self.venue)
        self.assertEqual(fixture.status, Fixture.Status.DRAFT)
    
    def test_fixture_validation(self):
        """Test fixture validation"""
        # Test invalid end time
        with self.assertRaises(Exception):
            fixture = Fixture(
                event=self.event,
                round_no=1,
                starts_at=timezone.now() + timedelta(hours=2),
                ends_at=timezone.now() + timedelta(hours=1),  # End before start
                venue=self.venue
            )
            fixture.clean()
    
    def test_fixture_entry_creation(self):
        """Test creating fixture entries"""
        fixture = Fixture.objects.create(
            event=self.event,
            round_no=1,
            starts_at=timezone.now() + timedelta(hours=1),
            ends_at=timezone.now() + timedelta(hours=2),
            venue=self.venue
        )
        
        team1 = Team.objects.create(name='Team 1', created_by=self.user)
        team2 = Team.objects.create(name='Team 2', created_by=self.user)
        
        home_entry = FixtureEntry.objects.create(
            fixture=fixture,
            side=FixtureEntry.Side.HOME,
            team=team1
        )
        
        away_entry = FixtureEntry.objects.create(
            fixture=fixture,
            side=FixtureEntry.Side.AWAY,
            team=team2
        )
        
        self.assertEqual(fixture.home_entry, home_entry)
        self.assertEqual(fixture.away_entry, away_entry)
        self.assertEqual(fixture.home_team, team1)
        self.assertEqual(fixture.away_team, team2)


class FixtureGeneratorTest(TestCase):
    """Test fixture generation algorithms"""
    
    def test_round_robin_generation(self):
        """Test round-robin fixture generation"""
        participants = [1, 2, 3, 4]
        fixtures = generate_round_robin(participants)
        
        # Should generate 6 fixtures for 4 participants (3 rounds, 2 matches per round)
        self.assertEqual(len(fixtures), 6)
        
        # Check that each participant appears in the correct number of fixtures
        participant_counts = {}
        for fixture in fixtures:
            for entry in fixture['entries']:
                if entry['team_id']:
                    participant_counts[entry['team_id']] = participant_counts.get(entry['team_id'], 0) + 1
        
        # Each participant should appear in 3 fixtures
        for participant in participants:
            self.assertEqual(participant_counts[participant], 3)
    
    def test_knockout_generation(self):
        """Test knockout fixture generation"""
        participants = [1, 2, 3, 4]
        fixtures = generate_knockout(participants)
        
        # Should generate 3 fixtures for 4 participants (2 + 1)
        self.assertEqual(len(fixtures), 3)
        
        # Check that first round has 2 fixtures
        first_round_fixtures = [f for f in fixtures if f['round_no'] == 1]
        self.assertEqual(len(first_round_fixtures), 2)
        
        # Check that second round has 1 fixture
        second_round_fixtures = [f for f in fixtures if f['round_no'] == 2]
        self.assertEqual(len(second_round_fixtures), 1)
    
    def test_knockout_with_byes(self):
        """Test knockout generation with byes"""
        participants = [1, 2, 3]  # 3 participants, need 1 bye
        fixtures = generate_knockout(participants)
        
        # Should generate 2 fixtures (1 + 1)
        self.assertEqual(len(fixtures), 2)
        
        # First round should have 1 fixture (2 participants + 1 bye)
        first_round_fixtures = [f for f in fixtures if f['round_no'] == 1]
        self.assertEqual(len(first_round_fixtures), 1)


class FixtureConflictTest(TestCase):
    """Test conflict detection"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='organizer',
            email='organizer@test.com',
            password='testpass123'
        )
        self.event = Event.objects.create(
            name='Test Event',
            created_by=self.user,
            starts_at=timezone.now() + timedelta(days=1),
            ends_at=timezone.now() + timedelta(days=2)
        )
        self.venue = Venue.objects.create(
            name='Test Venue',
            address='123 Test St',
            capacity=100,
            created_by=self.user
        )
        
        # Create existing fixture
        self.existing_fixture = Fixture.objects.create(
            event=self.event,
            round_no=1,
            starts_at=timezone.now() + timedelta(hours=1),
            ends_at=timezone.now() + timedelta(hours=2),
            venue=self.venue
        )
    
    def test_fixture_conflict_detection(self):
        """Test detecting fixture conflicts"""
        # Test overlapping time
        conflicts = find_conflicts(
            starts_at=timezone.now() + timedelta(minutes=30),
            ends_at=timezone.now() + timedelta(hours=1, minutes=30),
            venue_id=self.venue.id
        )
        
        self.assertTrue(len(conflicts) > 0)
        self.assertEqual(conflicts[0]['type'], 'fixture')
        self.assertEqual(conflicts[0]['id'], self.existing_fixture.id)
    
    def test_no_conflict_detection(self):
        """Test no conflicts when times don't overlap"""
        conflicts = find_conflicts(
            starts_at=timezone.now() + timedelta(hours=3),
            ends_at=timezone.now() + timedelta(hours=4),
            venue_id=self.venue.id
        )
        
        self.assertEqual(len(conflicts), 0)
    
    def test_venue_availability(self):
        """Test venue availability checking"""
        # Test available time
        availability = check_venue_availability(
            venue_id=self.venue.id,
            starts_at=timezone.now() + timedelta(hours=3),
            ends_at=timezone.now() + timedelta(hours=4)
        )
        
        self.assertTrue(availability['available'])
        
        # Test unavailable time (conflicts with existing fixture)
        availability = check_venue_availability(
            venue_id=self.venue.id,
            starts_at=timezone.now() + timedelta(minutes=30),
            ends_at=timezone.now() + timedelta(hours=1, minutes=30)
        )
        
        self.assertFalse(availability['available'])


class FixtureAPITest(APITestCase):
    """Test fixture API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='organizer',
            email='organizer@test.com',
            password='testpass123'
        )
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            is_staff=True
        )
        self.event = Event.objects.create(
            name='Test Event',
            created_by=self.user,
            starts_at=timezone.now() + timedelta(days=1),
            ends_at=timezone.now() + timedelta(days=2)
        )
        self.venue = Venue.objects.create(
            name='Test Venue',
            address='123 Test St',
            capacity=100,
            created_by=self.user
        )
        self.team1 = Team.objects.create(name='Team 1', created_by=self.user)
        self.team2 = Team.objects.create(name='Team 2', created_by=self.user)
    
    def test_generate_round_robin_fixtures(self):
        """Test generating round-robin fixtures"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'event_id': self.event.id,
            'mode': 'rr',
            'participants': [self.team1.id, self.team2.id]
        }
        
        response = self.client.post('/api/fixtures/generate/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('fixtures', response.data)
        self.assertEqual(len(response.data['fixtures']), 1)  # 2 teams = 1 fixture
    
    def test_generate_knockout_fixtures(self):
        """Test generating knockout fixtures"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'event_id': self.event.id,
            'mode': 'ko',
            'participants': [self.team1.id, self.team2.id]
        }
        
        response = self.client.post('/api/fixtures/generate/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('fixtures', response.data)
        self.assertEqual(len(response.data['fixtures']), 1)  # 2 teams = 1 fixture
    
    def test_accept_fixtures(self):
        """Test accepting generated fixtures"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'event_id': self.event.id,
            'fixtures': [{
                'round_no': 1,
                'starts_at': (timezone.now() + timedelta(hours=1)).isoformat(),
                'ends_at': (timezone.now() + timedelta(hours=2)).isoformat(),
                'venue_id': self.venue.id,
                'entries': [
                    {'side': 'home', 'team_id': self.team1.id},
                    {'side': 'away', 'team_id': self.team2.id}
                ]
            }]
        }
        
        response = self.client.post('/api/fixtures/accept/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('fixtures', response.data)
        self.assertEqual(len(response.data['fixtures']), 1)
        
        # Check that fixture was created
        fixture = Fixture.objects.get(event=self.event)
        self.assertEqual(fixture.status, Fixture.Status.DRAFT)
        self.assertEqual(fixture.entries.count(), 2)
    
    def test_publish_fixture(self):
        """Test publishing a fixture"""
        self.client.force_authenticate(user=self.user)
        
        # Create a draft fixture
        fixture = Fixture.objects.create(
            event=self.event,
            round_no=1,
            starts_at=timezone.now() + timedelta(hours=1),
            ends_at=timezone.now() + timedelta(hours=2),
            venue=self.venue
        )
        
        FixtureEntry.objects.create(
            fixture=fixture,
            side=FixtureEntry.Side.HOME,
            team=self.team1
        )
        
        FixtureEntry.objects.create(
            fixture=fixture,
            side=FixtureEntry.Side.AWAY,
            team=self.team2
        )
        
        response = self.client.post(f'/api/fixtures/{fixture.id}/publish/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that fixture was published
        fixture.refresh_from_db()
        self.assertEqual(fixture.status, Fixture.Status.PUBLISHED)
    
    def test_reschedule_fixture(self):
        """Test rescheduling a fixture"""
        self.client.force_authenticate(user=self.user)
        
        # Create a fixture
        fixture = Fixture.objects.create(
            event=self.event,
            round_no=1,
            starts_at=timezone.now() + timedelta(hours=1),
            ends_at=timezone.now() + timedelta(hours=2),
            venue=self.venue
        )
        
        new_start = timezone.now() + timedelta(hours=3)
        new_end = timezone.now() + timedelta(hours=4)
        
        data = {
            'starts_at': new_start.isoformat(),
            'ends_at': new_end.isoformat()
        }
        
        response = self.client.patch(f'/api/fixtures/{fixture.id}/reschedule/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that fixture was rescheduled
        fixture.refresh_from_db()
        self.assertEqual(fixture.starts_at, new_start)
        self.assertEqual(fixture.ends_at, new_end)
    
    def test_fixture_conflicts_endpoint(self):
        """Test fixture conflicts endpoint"""
        self.client.force_authenticate(user=self.user)
        
        # Create a fixture
        fixture = Fixture.objects.create(
            event=self.event,
            round_no=1,
            starts_at=timezone.now() + timedelta(hours=1),
            ends_at=timezone.now() + timedelta(hours=2),
            venue=self.venue
        )
        
        response = self.client.get(f'/api/fixtures/{fixture.id}/conflicts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('has_conflicts', response.data)
        self.assertIn('conflicts', response.data)
    
    def test_public_fixtures_list(self):
        """Test public fixtures list endpoint"""
        # Create a published fixture
        fixture = Fixture.objects.create(
            event=self.event,
            round_no=1,
            starts_at=timezone.now() + timedelta(hours=1),
            ends_at=timezone.now() + timedelta(hours=2),
            venue=self.venue,
            status=Fixture.Status.PUBLISHED
        )
        
        # Test without authentication (public access)
        response = self.client.get(f'/api/fixtures/public/events/{self.event.id}/fixtures/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_permission_denied_for_other_organizer(self):
        """Test that organizers can't manage other organizers' events"""
        other_user = User.objects.create_user(
            username='other',
            email='other@test.com',
            password='testpass123'
        )
        
        self.client.force_authenticate(user=other_user)
        
        data = {
            'event_id': self.event.id,
            'mode': 'rr',
            'participants': [self.team1.id, self.team2.id]
        }
        
        response = self.client.post('/api/fixtures/generate/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)