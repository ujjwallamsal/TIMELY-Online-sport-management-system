# results/tests/test_results.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from unittest.mock import patch, MagicMock

from events.models import Event
from api.models import Team
from fixtures.models import Fixture, FixtureEntry
from ..models import Result, LeaderboardEntry, AthleteStat
from ..services.compute import StandingsComputer, AthleteStatsComputer

User = get_user_model()


class ResultModelTest(TestCase):
    """Test Result model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        self.event = Event.objects.create(
            name='Test Event',
            sport='Football',
            start_datetime=timezone.now(),
            end_datetime=timezone.now() + timezone.timedelta(days=1),
            location='Test Location',
            created_by=self.user
        )
        
        self.team1 = Team.objects.create(name='Team A', manager=self.user)
        self.team2 = Team.objects.create(name='Team B', manager=self.user)
        
        self.fixture = Fixture.objects.create(
            event=self.event,
            starts_at=timezone.now(),
            ends_at=timezone.now() + timezone.timedelta(hours=2)
        )
        
        # Create fixture entries
        FixtureEntry.objects.create(
            fixture=self.fixture,
            side=FixtureEntry.Side.HOME,
            team=self.team1
        )
        FixtureEntry.objects.create(
            fixture=self.fixture,
            side=FixtureEntry.Side.AWAY,
            team=self.team2
        )
    
    def test_result_creation(self):
        """Test creating a result"""
        result = Result.objects.create(
            fixture=self.fixture,
            score_home=2,
            score_away=1,
            notes='Great match!'
        )
        
        self.assertEqual(result.score_home, 2)
        self.assertEqual(result.score_away, 1)
        self.assertEqual(result.status, Result.Status.PROVISIONAL)
        self.assertFalse(result.published)
        self.assertEqual(result.winner, self.team1)  # Auto-set winner
    
    def test_result_draw(self):
        """Test result with draw (no winner)"""
        result = Result.objects.create(
            fixture=self.fixture,
            score_home=1,
            score_away=1
        )
        
        self.assertTrue(result.is_draw)
        self.assertIsNone(result.winner)
    
    def test_result_finalize(self):
        """Test finalizing a result"""
        result = Result.objects.create(
            fixture=self.fixture,
            score_home=2,
            score_away=1
        )
        
        result.finalize(user=self.user)
        
        self.assertEqual(result.status, Result.Status.FINAL)
        self.assertTrue(result.is_verified)
        self.assertEqual(result.verified_by, self.user)
        self.assertIsNotNone(result.verified_at)
    
    def test_result_publish(self):
        """Test publishing a result"""
        result = Result.objects.create(
            fixture=self.fixture,
            score_home=2,
            score_away=1
        )
        
        # Must be finalized first
        result.finalize(user=self.user)
        result.publish()
        
        self.assertTrue(result.published)
        self.assertTrue(result.can_be_published)
    
    def test_result_invalidate(self):
        """Test invalidating a result"""
        result = Result.objects.create(
            fixture=self.fixture,
            score_home=2,
            score_away=1
        )
        
        result.finalize(user=self.user)
        result.publish()
        result.invalidate()
        
        self.assertEqual(result.status, Result.Status.PROVISIONAL)
        self.assertFalse(result.published)
        self.assertIsNone(result.verified_by)
        self.assertIsNone(result.verified_at)


class LeaderboardEntryModelTest(TestCase):
    """Test LeaderboardEntry model functionality"""
    
    def setUp(self):
        self.event = Event.objects.create(
            name='Test Event',
            sport='Football',
            start_datetime=timezone.now(),
            end_datetime=timezone.now() + timezone.timedelta(days=1),
            location='Test Location',
            created_by=self.user
        )
        
        self.team = Team.objects.create(name='Test Team')
    
    def test_leaderboard_entry_creation(self):
        """Test creating a leaderboard entry"""
        entry = LeaderboardEntry.objects.create(
            event=self.event,
            team=self.team,
            points=9,
            matches_played=3,
            wins=3,
            draws=0,
            losses=0,
            goals_for=6,
            goals_against=2
        )
        
        self.assertEqual(entry.goal_difference, 4)
        self.assertEqual(entry.win_percentage, 100.0)
        self.assertEqual(entry.points_per_match, 3.0)
    
    def test_leaderboard_entry_auto_calculation(self):
        """Test automatic goal difference calculation"""
        entry = LeaderboardEntry.objects.create(
            event=self.event,
            team=self.team,
            goals_for=5,
            goals_against=3
        )
        
        # Goal difference should be calculated automatically
        self.assertEqual(entry.goal_difference, 2)


class AthleteStatModelTest(TestCase):
    """Test AthleteStat model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='athlete@example.com',
            password='testpass123',
            first_name='Athlete',
            last_name='Test'
        )
        
        self.event = Event.objects.create(
            name='Track Event',
            sport='Running',
            start_datetime=timezone.now(),
            end_datetime=timezone.now() + timezone.timedelta(hours=2),
            location='Track Stadium'
        )
    
    def test_athlete_stat_creation(self):
        """Test creating athlete stats"""
        metrics = {
            'time': '10.5',
            'distance': '100m',
            'wind': '+0.2'
        }
        
        stat = AthleteStat.objects.create(
            event=self.event,
            athlete=self.user,
            metrics=metrics,
            position=1,
            points=10
        )
        
        self.assertEqual(stat.metrics, metrics)
        self.assertEqual(stat.position, 1)
        self.assertFalse(stat.verified)
    
    def test_athlete_stat_verify(self):
        """Test verifying athlete stats"""
        stat = AthleteStat.objects.create(
            event=self.event,
            athlete=self.user,
            metrics={'time': '10.5'},
            position=1
        )
        
        stat.verify(user=self.user)
        
        self.assertTrue(stat.verified)
        self.assertEqual(stat.verified_by, self.user)
        self.assertIsNotNone(stat.verified_at)


class StandingsComputerTest(TestCase):
    """Test standings computation functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        self.event = Event.objects.create(
            name='Test Tournament',
            sport='Football',
            start_datetime=timezone.now(),
            end_datetime=timezone.now() + timezone.timedelta(days=3),
            location='Test Stadium',
            created_by=self.user
        )
        
        self.team1 = Team.objects.create(name='Team A', manager=self.user)
        self.team2 = Team.objects.create(name='Team B', manager=self.user)
        self.team3 = Team.objects.create(name='Team C', manager=self.user)
        
        # Create fixtures
        self.fixture1 = Fixture.objects.create(
            event=self.event,
            starts_at=timezone.now(),
            ends_at=timezone.now() + timezone.timedelta(hours=2)
        )
        
        self.fixture2 = Fixture.objects.create(
            event=self.event,
            starts_at=timezone.now() + timezone.timedelta(days=1),
            ends_at=timezone.now() + timezone.timedelta(days=1, hours=2)
        )
        
        # Create fixture entries
        FixtureEntry.objects.create(fixture=self.fixture1, side=FixtureEntry.Side.HOME, team=self.team1)
        FixtureEntry.objects.create(fixture=self.fixture1, side=FixtureEntry.Side.AWAY, team=self.team2)
        
        FixtureEntry.objects.create(fixture=self.fixture2, side=FixtureEntry.Side.HOME, team=self.team1)
        FixtureEntry.objects.create(fixture=self.fixture2, side=FixtureEntry.Side.AWAY, team=self.team3)
    
    def test_compute_standings(self):
        """Test computing standings from results"""
        # Create results
        Result.objects.create(
            fixture=self.fixture1,
            score_home=2,
            score_away=1,
            status=Result.Status.FINAL
        )
        
        Result.objects.create(
            fixture=self.fixture2,
            score_home=1,
            score_away=1,
            status=Result.Status.FINAL
        )
        
        computer = StandingsComputer(self.event)
        leaderboard = computer.compute_standings()
        
        # Team A should be first (3 points from win + 1 point from draw)
        self.assertEqual(len(leaderboard), 2)  # Only teams that played
        team_a_entry = next(entry for entry in leaderboard if entry.team == self.team1)
        self.assertEqual(team_a_entry.points, 4)
        self.assertEqual(team_a_entry.position, 1)
        self.assertEqual(team_a_entry.matches_played, 2)
        self.assertEqual(team_a_entry.wins, 1)
        self.assertEqual(team_a_entry.draws, 1)
        self.assertEqual(team_a_entry.losses, 0)


class ResultsAPITest(APITestCase):
    """Test Results API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='admin@example.com',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            is_staff=True
        )
        
        self.event = Event.objects.create(
            name='Test Event',
            sport='Football',
            start_datetime=timezone.now(),
            end_datetime=timezone.now() + timezone.timedelta(days=1),
            location='Test Location',
            created_by=self.user
        )
        
        self.team1 = Team.objects.create(name='Team A', manager=self.user)
        self.team2 = Team.objects.create(name='Team B', manager=self.user)
        
        self.fixture = Fixture.objects.create(
            event=self.event,
            starts_at=timezone.now(),
            ends_at=timezone.now() + timezone.timedelta(hours=2)
        )
        
        FixtureEntry.objects.create(fixture=self.fixture, side=FixtureEntry.Side.HOME, team=self.team1)
        FixtureEntry.objects.create(fixture=self.fixture, side=FixtureEntry.Side.AWAY, team=self.team2)
        
        self.client.force_authenticate(user=self.user)
    
    def test_record_fixture_result(self):
        """Test recording a result for a fixture"""
        url = reverse('fixture-record-result', kwargs={'fixture_id': self.fixture.id})
        data = {
            'score_home': 2,
            'score_away': 1,
            'notes': 'Great match!'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Result.objects.count(), 1)
        
        result = Result.objects.first()
        self.assertEqual(result.score_home, 2)
        self.assertEqual(result.score_away, 1)
        self.assertEqual(result.winner, self.team1)
    
    def test_finalize_result(self):
        """Test finalizing a result"""
        result = Result.objects.create(
            fixture=self.fixture,
            score_home=2,
            score_away=1
        )
        
        url = reverse('results-finalize', kwargs={'pk': result.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        result.refresh_from_db()
        self.assertEqual(result.status, Result.Status.FINAL)
        self.assertTrue(result.is_verified)
    
    def test_publish_result(self):
        """Test publishing a result"""
        result = Result.objects.create(
            fixture=self.fixture,
            score_home=2,
            score_away=1,
            status=Result.Status.FINAL
        )
        result.finalize(user=self.user)
        
        url = reverse('results-publish', kwargs={'pk': result.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        result.refresh_from_db()
        self.assertTrue(result.published)
    
    def test_event_results_endpoint(self):
        """Test getting event results"""
        # Create a published result
        result = Result.objects.create(
            fixture=self.fixture,
            score_home=2,
            score_away=1,
            status=Result.Status.FINAL,
            published=True
        )
        result.finalize(user=self.user)
        
        url = reverse('event-results', kwargs={'event_id': self.event.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('leaderboard', response.data)
        self.assertIn('recent_results', response.data)
    
    def test_event_leaderboard_endpoint(self):
        """Test getting event leaderboard"""
        # Create leaderboard entries
        LeaderboardEntry.objects.create(
            event=self.event,
            team=self.team1,
            position=1,
            points=6,
            matches_played=2,
            wins=2,
            draws=0,
            losses=0,
            goals_for=4,
            goals_against=1
        )
        
        url = reverse('event-leaderboard', kwargs={'event_id': self.event.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('leaderboard', response.data)
        self.assertEqual(len(response.data['leaderboard']), 1)
    
    def test_recompute_standings(self):
        """Test recomputing standings"""
        # Create a result
        Result.objects.create(
            fixture=self.fixture,
            score_home=2,
            score_away=1,
            status=Result.Status.FINAL
        )
        
        url = reverse('recompute-standings', kwargs={'event_id': self.event.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('leaderboard', response.data)
        self.assertEqual(len(response.data['leaderboard']), 2)  # Both teams


class AthleteStatsAPITest(APITestCase):
    """Test Athlete Stats API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='admin@example.com',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            is_staff=True
        )
        
        self.athlete = User.objects.create_user(
            email='athlete@example.com',
            password='testpass123',
            first_name='Athlete',
            last_name='Test'
        )
        
        self.event = Event.objects.create(
            name='Track Event',
            sport='Running',
            start_datetime=timezone.now(),
            end_datetime=timezone.now() + timezone.timedelta(hours=2),
            location='Track Stadium'
        )
        
        self.client.force_authenticate(user=self.user)
    
    def test_create_athlete_stat(self):
        """Test creating athlete stats"""
        url = reverse('athlete-stats-list')
        data = {
            'event_id': self.event.id,
            'athlete': self.athlete.id,
            'metrics': {'time': '10.5', 'distance': '100m'},
            'points': 10
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AthleteStat.objects.count(), 1)
        
        stat = AthleteStat.objects.first()
        self.assertEqual(stat.athlete, self.athlete)
        self.assertEqual(stat.metrics['time'], '10.5')
    
    def test_verify_athlete_stat(self):
        """Test verifying athlete stats"""
        stat = AthleteStat.objects.create(
            event=self.event,
            athlete=self.athlete,
            metrics={'time': '10.5'},
            position=1
        )
        
        url = reverse('athlete-stats-verify', kwargs={'pk': stat.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        stat.refresh_from_db()
        self.assertTrue(stat.verified)
        self.assertEqual(stat.verified_by, self.user)


class ResultsPermissionsTest(APITestCase):
    """Test Results API permissions"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='user@example.com',
            password='testpass123'
        )
        
        self.event = Event.objects.create(
            name='Test Event',
            sport='Football',
            start_datetime=timezone.now(),
            end_datetime=timezone.now() + timezone.timedelta(days=1),
            location='Test Location',
            created_by=self.user
        )
        
        self.team1 = Team.objects.create(name='Team A', manager=self.user)
        self.team2 = Team.objects.create(name='Team B', manager=self.user)
        
        self.fixture = Fixture.objects.create(
            event=self.event,
            starts_at=timezone.now(),
            ends_at=timezone.now() + timezone.timedelta(hours=2)
        )
        
        FixtureEntry.objects.create(fixture=self.fixture, side=FixtureEntry.Side.HOME, team=self.team1)
        FixtureEntry.objects.create(fixture=self.fixture, side=FixtureEntry.Side.AWAY, team=self.team2)
    
    def test_unauthorized_access(self):
        """Test that unauthorized users cannot access admin endpoints"""
        url = reverse('fixture-record-result', kwargs={'fixture_id': self.fixture.id})
        data = {'score_home': 2, 'score_away': 1}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_public_results_access(self):
        """Test that public can access published results"""
        result = Result.objects.create(
            fixture=self.fixture,
            score_home=2,
            score_away=1,
            status=Result.Status.FINAL,
            published=True
        )
        
        url = reverse('event-results', kwargs={'event_id': self.event.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('recent_results', response.data)
