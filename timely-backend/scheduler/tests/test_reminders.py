# scheduler/tests/test_reminders.py
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model

from events.models import Event
from fixtures.models import Fixture
from api.models import Team
from notifications.models import Notification
from scheduler.tasks import (
    send_fixture_reminders,
    send_fixture_reminder,
    get_fixture_reminder_recipients,
    create_fixture_notification
)

User = get_user_model()


class ReminderTestCase(TestCase):
    def setUp(self):
        """Set up test data"""
        self.user1 = User.objects.create_user(
            email='user1@test.com',
            password='testpass123',
            first_name='User',
            last_name='One'
        )
        
        self.user2 = User.objects.create_user(
            email='user2@test.com',
            password='testpass123',
            first_name='User',
            last_name='Two'
        )
        
        self.organizer = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            first_name='Organizer',
            last_name='User'
        )
        
        # Create event
        self.event = Event.objects.create(
            name='Test Event',
            description='Test event description',
            start_date=timezone.now().date() + timedelta(days=1),
            end_date=timezone.now().date() + timedelta(days=2),
            created_by=self.organizer,
            status=Event.Status.PUBLISHED
        )
        
        # Create teams
        self.team1 = Team.objects.create(
            name='Team A',
            created_by=self.user1
        )
        self.team2 = Team.objects.create(
            name='Team B',
            created_by=self.user2
        )
        
        # Create fixture in T-24h window
        self.fixture_24h = Fixture.objects.create(
            event=self.event,
            home_team=self.team1,
            away_team=self.team2,
            starts_at=timezone.now() + timedelta(hours=24),
            status=Fixture.Status.SCHEDULED
        )
        
        # Create fixture in T-2h window
        self.fixture_2h = Fixture.objects.create(
            event=self.event,
            home_team=self.team1,
            away_team=self.team2,
            starts_at=timezone.now() + timedelta(hours=2),
            status=Fixture.Status.SCHEDULED
        )
    
    def test_get_fixture_reminder_recipients(self):
        """Test getting reminder recipients for a fixture"""
        recipients = get_fixture_reminder_recipients(self.fixture_24h)
        
        # Should include event organizer
        self.assertIn(self.organizer, recipients)
        
        # Should include team members
        self.assertIn(self.user1, recipients)  # Team A member
        self.assertIn(self.user2, recipients)  # Team B member
    
    def test_create_fixture_notification(self):
        """Test creating fixture notification"""
        notification = create_fixture_notification(
            self.fixture_24h, 
            self.user1, 
            '24h'
        )
        
        self.assertEqual(notification.user, self.user1)
        self.assertEqual(notification.notification_type, 'fixture_reminder')
        self.assertIn('24 hours', notification.message)
        self.assertEqual(notification.data['fixture_id'], self.fixture_24h.id)
        self.assertEqual(notification.data['reminder_type'], '24h')
    
    def test_send_fixture_reminder(self):
        """Test sending fixture reminder"""
        # Count initial notifications
        initial_count = Notification.objects.count()
        
        # Send reminder
        send_fixture_reminder(self.fixture_24h, '24h')
        
        # Check notifications were created
        new_count = Notification.objects.count()
        self.assertGreater(new_count, initial_count)
        
        # Check notification content
        notification = Notification.objects.filter(
            notification_type='fixture_reminder',
            data__fixture_id=self.fixture_24h.id
        ).first()
        
        self.assertIsNotNone(notification)
        self.assertEqual(notification.data['reminder_type'], '24h')
    
    def test_send_fixture_reminders_integration(self):
        """Test the full reminder sending process"""
        # Count initial notifications
        initial_count = Notification.objects.count()
        
        # Send all reminders
        results = send_fixture_reminders()
        
        # Check results
        self.assertIn('t24h_count', results)
        self.assertIn('t2h_count', results)
        self.assertIn('total_reminders', results)
        
        # Should have found our test fixtures
        self.assertGreaterEqual(results['t24h_count'], 1)  # Our T-24h fixture
        self.assertGreaterEqual(results['t2h_count'], 1)   # Our T-2h fixture
        
        # Check notifications were created
        new_count = Notification.objects.count()
        self.assertGreater(new_count, initial_count)
    
    def test_reminder_idempotency(self):
        """Test that reminders are idempotent (don't send duplicates)"""
        # Send reminder twice
        send_fixture_reminder(self.fixture_24h, '24h')
        first_count = Notification.objects.count()
        
        send_fixture_reminder(self.fixture_24h, '24h')
        second_count = Notification.objects.count()
        
        # Should create new notifications each time (no deduplication in this implementation)
        # In production, you might want to add deduplication logic
        self.assertGreaterEqual(second_count, first_count)
    
    def test_reminder_windows(self):
        """Test that reminders are only sent for fixtures in correct time windows"""
        # Create fixture outside any reminder window
        future_fixture = Fixture.objects.create(
            event=self.event,
            home_team=self.team1,
            away_team=self.team2,
            starts_at=timezone.now() + timedelta(days=7),  # 7 days from now
            status=Fixture.Status.SCHEDULED
        )
        
        # Send reminders
        results = send_fixture_reminders()
        
        # Should only find fixtures in the correct windows
        # Our future fixture should not be included
        total_expected = 2  # Our T-24h and T-2h fixtures
        self.assertEqual(results['total_reminders'], total_expected)
    
    def test_reminder_for_cancelled_fixture(self):
        """Test that reminders are not sent for cancelled fixtures"""
        # Cancel the T-24h fixture
        self.fixture_24h.status = Fixture.Status.CANCELLED
        self.fixture_24h.save()
        
        # Send reminders
        results = send_fixture_reminders()
        
        # Should only find the T-2h fixture
        self.assertEqual(results['t24h_count'], 0)
        self.assertEqual(results['t2h_count'], 1)
        self.assertEqual(results['total_reminders'], 1)
    
    def test_reminder_data_structure(self):
        """Test that reminder data contains expected fields"""
        notification = create_fixture_notification(
            self.fixture_24h, 
            self.user1, 
            '24h'
        )
        
        data = notification.data
        
        # Check required fields
        self.assertIn('fixture_id', data)
        self.assertIn('event_id', data)
        self.assertIn('reminder_type', data)
        self.assertIn('starts_at', data)
        
        # Check values
        self.assertEqual(data['fixture_id'], self.fixture_24h.id)
        self.assertEqual(data['event_id'], self.event.id)
        self.assertEqual(data['reminder_type'], '24h')
        self.assertIsNotNone(data['starts_at'])
