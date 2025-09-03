"""
Comprehensive tests for notifications and messaging system.
Tests happy-path scenarios, permissions, and rate limiting.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock

from ..models import Notification, MessageThread, MessageParticipant, Message, DeliveryAttempt
from ..services.email_sms import send_email, send_sms

User = get_user_model()


class NotificationModelTests(TestCase):
    """Test Notification model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
    
    def test_notification_creation(self):
        """Test creating a notification"""
        notification = Notification.objects.create(
            user=self.user,
            kind='info',
            topic='system',
            title='Test Notification',
            body='This is a test notification'
        )
        
        self.assertEqual(notification.user, self.user)
        self.assertEqual(notification.kind, 'info')
        self.assertEqual(notification.topic, 'system')
        self.assertFalse(notification.is_read)
        self.assertIsNone(notification.read_at)
    
    def test_mark_read(self):
        """Test marking notification as read"""
        notification = Notification.objects.create(
            user=self.user,
            title='Test Notification',
            body='This is a test notification'
        )
        
        self.assertFalse(notification.is_read)
        notification.mark_read()
        self.assertTrue(notification.is_read)
        self.assertIsNotNone(notification.read_at)


class MessageModelTests(TestCase):
    """Test Message and MessageThread model functionality"""
    
    def setUp(self):
        self.user1 = User.objects.create_user(
            email='user1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            email='user2@example.com',
            password='testpass123'
        )
    
    def test_thread_creation(self):
        """Test creating a message thread"""
        thread = MessageThread.objects.create(
            scope='direct',
            title='Test Thread',
            created_by=self.user1
        )
        
        self.assertEqual(thread.scope, 'direct')
        self.assertEqual(thread.created_by, self.user1)
    
    def test_participant_creation(self):
        """Test adding participants to thread"""
        thread = MessageThread.objects.create(
            scope='direct',
            created_by=self.user1
        )
        
        participant1 = MessageParticipant.objects.create(
            thread=thread,
            user=self.user1,
            role='organizer'
        )
        
        participant2 = MessageParticipant.objects.create(
            thread=thread,
            user=self.user2,
            role='participant'
        )
        
        self.assertEqual(thread.participants.count(), 2)
        self.assertTrue(thread.participants.filter(user=self.user1).exists())
        self.assertTrue(thread.participants.filter(user=self.user2).exists())
    
    def test_message_creation(self):
        """Test creating messages in thread"""
        thread = MessageThread.objects.create(
            scope='direct',
            created_by=self.user1
        )
        
        MessageParticipant.objects.create(
            thread=thread,
            user=self.user1,
            role='organizer'
        )
        
        message = Message.objects.create(
            thread=thread,
            sender=self.user1,
            body='Hello, this is a test message!'
        )
        
        self.assertEqual(message.thread, thread)
        self.assertEqual(message.sender, self.user1)
        self.assertFalse(message.is_deleted)
    
    def test_message_soft_delete(self):
        """Test soft deleting messages"""
        thread = MessageThread.objects.create(
            scope='direct',
            created_by=self.user1
        )
        
        MessageParticipant.objects.create(
            thread=thread,
            user=self.user1,
            role='organizer'
        )
        
        message = Message.objects.create(
            thread=thread,
            sender=self.user1,
            body='Test message'
        )
        
        self.assertFalse(message.is_deleted)
        message.soft_delete()
        self.assertTrue(message.is_deleted)
        self.assertIsNotNone(message.deleted_at)


class NotificationAPITests(APITestCase):
    """Test notification API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_list_notifications(self):
        """Test listing user's notifications"""
        # Create test notifications
        Notification.objects.create(
            user=self.user,
            title='Test Notification 1',
            body='Body 1'
        )
        Notification.objects.create(
            user=self.user,
            title='Test Notification 2',
            body='Body 2'
        )
        
        url = reverse('notifications-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_mark_notification_read(self):
        """Test marking notification as read"""
        notification = Notification.objects.create(
            user=self.user,
            title='Test Notification',
            body='Test body'
        )
        
        url = reverse('notifications-mark-read', kwargs={'pk': notification.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
    
    def test_mark_all_notifications_read(self):
        """Test marking all notifications as read"""
        # Create unread notifications
        Notification.objects.create(
            user=self.user,
            title='Test Notification 1',
            body='Body 1'
        )
        Notification.objects.create(
            user=self.user,
            title='Test Notification 2',
            body='Body 2'
        )
        
        url = reverse('notifications-mark-all-read')
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['updated'], 2)
        
        # Check all notifications are marked as read
        unread_count = Notification.objects.filter(
            user=self.user,
            read_at__isnull=True
        ).count()
        self.assertEqual(unread_count, 0)


class MessageAPITests(APITestCase):
    """Test messaging API endpoints"""
    
    def setUp(self):
        self.user1 = User.objects.create_user(
            email='user1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            email='user2@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user1)
    
    def test_create_thread(self):
        """Test creating a message thread"""
        url = reverse('message-threads-list')
        data = {
            'scope': 'direct',
            'title': 'Test Thread',
            'participant_ids': [self.user2.id]
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MessageThread.objects.count(), 1)
        
        thread = MessageThread.objects.first()
        self.assertEqual(thread.participants.count(), 2)  # creator + participant
        self.assertTrue(thread.participants.filter(user=self.user1).exists())
        self.assertTrue(thread.participants.filter(user=self.user2).exists())
    
    def test_send_message(self):
        """Test sending a message in thread"""
        # Create thread with participants
        thread = MessageThread.objects.create(
            scope='direct',
            created_by=self.user1
        )
        
        MessageParticipant.objects.create(
            thread=thread,
            user=self.user1,
            role='organizer'
        )
        MessageParticipant.objects.create(
            thread=thread,
            user=self.user2,
            role='participant'
        )
        
        url = reverse('message-threads-send-message', kwargs={'pk': thread.id})
        data = {'body': 'Hello, this is a test message!'}
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Message.objects.count(), 1)
        
        message = Message.objects.first()
        self.assertEqual(message.body, 'Hello, this is a test message!')
        self.assertEqual(message.sender, self.user1)
    
    def test_non_participant_cannot_send_message(self):
        """Test that non-participants cannot send messages"""
        # Create thread with only user2
        thread = MessageThread.objects.create(
            scope='direct',
            created_by=self.user2
        )
        
        MessageParticipant.objects.create(
            thread=thread,
            user=self.user2,
            role='organizer'
        )
        
        # user1 is not a participant
        url = reverse('message-threads-send-message', kwargs={'pk': thread.id})
        data = {'body': 'This should fail!'}
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Message.objects.count(), 0)


class EmailSMSTests(TestCase):
    """Test email and SMS stub services"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
    
    @patch('notifications.services.email_sms.logger')
    def test_send_email_stub(self, mock_logger):
        """Test email stub service"""
        notification = Notification.objects.create(
            user=self.user,
            title='Test Notification',
            body='Test body'
        )
        
        result = send_email(
            to='test@example.com',
            subject='Test Subject',
            text='Test body',
            notification=notification
        )
        
        self.assertTrue(result)
        self.assertTrue(notification.delivered_email)
        
        # Check DeliveryAttempt was created
        attempt = DeliveryAttempt.objects.get(notification=notification)
        self.assertEqual(attempt.channel, 'email')
        self.assertEqual(attempt.status, 'sent')
        
        # Check logging was called
        mock_logger.info.assert_called()
    
    @patch('notifications.services.email_sms.logger')
    def test_send_sms_stub(self, mock_logger):
        """Test SMS stub service"""
        notification = Notification.objects.create(
            user=self.user,
            title='Test Notification',
            body='Test body'
        )
        
        result = send_sms(
            to='+1234567890',
            text='Test SMS body',
            notification=notification
        )
        
        self.assertTrue(result)
        self.assertTrue(notification.delivered_sms)
        
        # Check DeliveryAttempt was created
        attempt = DeliveryAttempt.objects.get(notification=notification)
        self.assertEqual(attempt.channel, 'sms')
        self.assertEqual(attempt.status, 'sent')
        
        # Check logging was called
        mock_logger.info.assert_called()


class RateLimitTests(APITestCase):
    """Test rate limiting functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create thread
        self.thread = MessageThread.objects.create(
            scope='direct',
            created_by=self.user
        )
        
        MessageParticipant.objects.create(
            thread=self.thread,
            user=self.user,
            role='organizer'
        )
    
    @patch('django.core.cache.cache')
    def test_rate_limit_blocks_spam(self, mock_cache):
        """Test that rate limiting blocks spam messages"""
        # Mock cache to simulate rate limit exceeded
        mock_cache.get.return_value = 10  # Already at limit
        mock_cache.set.return_value = True
        
        url = reverse('message-threads-send-message', kwargs={'pk': self.thread.id})
        data = {'body': 'This should be blocked by rate limit!'}
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Message.objects.count(), 0)
    
    @patch('django.core.cache.cache')
    def test_rate_limit_allows_normal_usage(self, mock_cache):
        """Test that rate limiting allows normal usage"""
        # Mock cache to simulate normal usage
        mock_cache.get.return_value = 5  # Under limit
        mock_cache.set.return_value = True
        
        url = reverse('message-threads-send-message', kwargs={'pk': self.thread.id})
        data = {'body': 'This should be allowed!'}
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Message.objects.count(), 1)


class WebSocketSignalTests(TestCase):
    """Test WebSocket signal functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
    
    @patch('notifications.signals._send_websocket_message')
    def test_notification_created_websocket_signal(self, mock_send):
        """Test that notification creation triggers WebSocket signal"""
        notification = Notification.objects.create(
            user=self.user,
            title='Test Notification',
            body='Test body'
        )
        
        # Check that WebSocket message was sent
        mock_send.assert_called_once()
        call_args = mock_send.call_args
        self.assertEqual(call_args[0][0], f"notify:user:{self.user.id}")
        self.assertEqual(call_args[0][1]['type'], 'notify.new')
    
    @patch('notifications.signals._send_websocket_message')
    def test_message_created_websocket_signal(self, mock_send):
        """Test that message creation triggers WebSocket signal"""
        thread = MessageThread.objects.create(
            scope='direct',
            created_by=self.user
        )
        
        MessageParticipant.objects.create(
            thread=thread,
            user=self.user,
            role='organizer'
        )
        
        message = Message.objects.create(
            thread=thread,
            sender=self.user,
            body='Test message'
        )
        
        # Check that WebSocket message was sent
        mock_send.assert_called_once()
        call_args = mock_send.call_args
        self.assertEqual(call_args[0][0], f"messages:thread:{thread.id}")
        self.assertEqual(call_args[0][1]['type'], 'message.new')
    
    def test_websocket_signal_noop_without_channels(self):
        """Test that signals work without Channels (no-op)"""
        # This test ensures the signals don't crash when Channels is not available
        # The _send_websocket_message function should handle this gracefully
        
        notification = Notification.objects.create(
            user=self.user,
            title='Test Notification',
            body='Test body'
        )
        
        # Should not raise any exceptions
        self.assertIsNotNone(notification)
