# payments/tests/test_payments.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock

from events.models import Event
from tickets.models import TicketType, TicketOrder, Ticket
from payments.stripe_gateway import StripeGateway

User = get_user_model()


class StripeGatewayTest(TestCase):
    """Test Stripe gateway functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='user@test.com',
            username='user',
            password='testpass123'
        )
        self.organizer = User.objects.create_user(
            email='organizer@test.com',
            username='organizer',
            password='testpass123',
            role=User.Role.ORGANIZER
        )
        self.event = Event.objects.create(
            name='Test Event',
            sport='Basketball',
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            created_by=self.organizer
        )
        self.ticket_type = TicketType.objects.create(
            event=self.event,
            name='General',
            price_cents=2000,
            quantity_total=100
        )
        self.order = TicketOrder.objects.create(
            user=self.user,
            event=self.event,
            total_cents=2000
        )
        self.ticket = Ticket.objects.create(
            order=self.order,
            ticket_type=self.ticket_type
        )
        
        self.gateway = StripeGateway()
    
    @patch('stripe.checkout.Session.create')
    def test_create_checkout_session(self, mock_stripe_create):
        """Test creating Stripe checkout session"""
        # Mock Stripe response
        mock_session = MagicMock()
        mock_session.id = 'test_session_id'
        mock_session.url = 'https://checkout.stripe.com/test'
        mock_stripe_create.return_value = mock_session
        
        # Mock request object
        mock_request = MagicMock()
        
        result = self.gateway.create_checkout_session(self.order, mock_request)
        
        self.assertEqual(result['session_id'], 'test_session_id')
        self.assertEqual(result['checkout_url'], 'https://checkout.stripe.com/test')
        self.assertEqual(result['order_id'], self.order.id)
        
        # Check order was updated
        self.order.refresh_from_db()
        self.assertEqual(self.order.provider_session_id, 'test_session_id')
    
    @patch('stripe.Webhook.construct_event')
    def test_verify_webhook(self, mock_webhook_construct):
        """Test webhook verification"""
        # Mock Stripe event
        mock_event = MagicMock()
        mock_event.id = 'test_event_id'
        mock_event.type = 'checkout.session.completed'
        mock_webhook_construct.return_value = mock_event
        
        payload = b'{"test": "data"}'
        signature = 'test_signature'
        
        result = self.gateway.verify_webhook(payload, signature)
        
        self.assertEqual(result, mock_event)
        mock_webhook_construct.assert_called_once()
    
    def test_handle_checkout_completed(self):
        """Test handling checkout completed event"""
        # Mock Stripe event
        mock_event = MagicMock()
        mock_event.data.object.metadata = {'order_id': str(self.order.id)}
        mock_event.data.object.id = 'test_session_id'
        mock_event.data.object.payment_intent = 'test_payment_intent'
        
        result = self.gateway._handle_checkout_completed(mock_event)
        
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['order_id'], self.order.id)
        
        # Check order was marked as paid
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, TicketOrder.Status.PAID)
        self.assertEqual(self.order.provider_session_id, 'test_session_id')
        self.assertEqual(self.order.provider_payment_intent, 'test_payment_intent')
    
    def test_handle_payment_succeeded(self):
        """Test handling payment succeeded event"""
        # Mock Stripe event
        mock_event = MagicMock()
        mock_event.data.object.metadata = {'order_id': str(self.order.id)}
        mock_event.data.object.id = 'test_payment_intent_id'
        
        result = self.gateway._handle_payment_succeeded(mock_event)
        
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['order_id'], self.order.id)
        
        # Check order was marked as paid
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, TicketOrder.Status.PAID)
        self.assertEqual(self.order.provider_payment_intent, 'test_payment_intent_id')
    
    def test_handle_payment_failed(self):
        """Test handling payment failed event"""
        # Mock Stripe event
        mock_event = MagicMock()
        mock_event.data.object.metadata = {'order_id': str(self.order.id)}
        mock_event.data.object.id = 'test_payment_intent_id'
        
        result = self.gateway._handle_payment_failed(mock_event)
        
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['order_id'], self.order.id)
        
        # Check order was marked as failed
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, TicketOrder.Status.FAILED)
    
    def test_create_refund(self):
        """Test creating refund (test mode)"""
        # Mark order as paid first
        self.order.mark_paid()
        
        result = self.gateway.create_refund(self.order)
        
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['order_id'], self.order.id)
        
        # Check order was marked as refunded
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, TicketOrder.Status.REFUNDED)


class PaymentAPITest(APITestCase):
    """Test payment API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='user@test.com',
            username='user',
            password='testpass123'
        )
        self.organizer = User.objects.create_user(
            email='organizer@test.com',
            username='organizer',
            password='testpass123',
            role=User.Role.ORGANIZER
        )
        self.event = Event.objects.create(
            name='Test Event',
            sport='Basketball',
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            created_by=self.organizer
        )
        self.ticket_type = TicketType.objects.create(
            event=self.event,
            name='General',
            price_cents=2000,
            quantity_total=100
        )
        self.order = TicketOrder.objects.create(
            user=self.user,
            event=self.event,
            total_cents=2000
        )
    
    @patch('payments.stripe_gateway.stripe_gateway.create_checkout_session')
    def test_stripe_checkout_success(self, mock_checkout):
        """Test successful Stripe checkout creation"""
        # Mock Stripe response
        mock_checkout.return_value = {
            'checkout_url': 'https://checkout.stripe.com/test',
            'session_id': 'test_session_id',
            'order_id': self.order.id
        }
        
        self.client.force_authenticate(user=self.user)
        url = reverse('payments:stripe-checkout')
        data = {'order_id': self.order.id}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('checkout_url', response.data)
        self.assertEqual(response.data['checkout_url'], 'https://checkout.stripe.com/test')
    
    def test_stripe_checkout_invalid_order(self):
        """Test Stripe checkout with invalid order"""
        self.client.force_authenticate(user=self.user)
        url = reverse('payments:stripe-checkout')
        data = {'order_id': 99999}  # Non-existent order
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_stripe_checkout_wrong_user(self):
        """Test Stripe checkout with wrong user"""
        other_user = User.objects.create_user(
            email='other@test.com',
            username='other',
            password='testpass123'
        )
        
        self.client.force_authenticate(user=other_user)
        url = reverse('payments:stripe-checkout')
        data = {'order_id': self.order.id}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_stripe_checkout_unauthenticated(self):
        """Test Stripe checkout without authentication"""
        url = reverse('payments:stripe-checkout')
        data = {'order_id': self.order.id}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    @patch('payments.stripe_gateway.stripe_gateway.create_refund')
    def test_create_refund_success(self, mock_refund):
        """Test successful refund creation"""
        # Mark order as paid
        self.order.mark_paid()
        
        # Mock refund response
        mock_refund.return_value = {
            'status': 'success',
            'message': f'Order {self.order.id} refunded (test mode)',
            'order_id': self.order.id,
            'refund_amount_cents': self.order.total_cents
        }
        
        self.client.force_authenticate(user=self.organizer)
        url = reverse('payments:create-refund', kwargs={'order_id': self.order.id})
        
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
    
    def test_create_refund_permission_denied(self):
        """Test refund creation with insufficient permissions"""
        self.client.force_authenticate(user=self.user)  # Regular user, not organizer
        url = reverse('payments:create-refund', kwargs={'order_id': self.order.id})
        
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    @patch('payments.stripe_gateway.stripe_gateway.verify_webhook')
    @patch('payments.stripe_gateway.stripe_gateway.handle_webhook_event')
    def test_webhook_processing(self, mock_handle, mock_verify):
        """Test webhook processing"""
        # Mock webhook verification
        mock_event = MagicMock()
        mock_verify.return_value = mock_event
        
        # Mock webhook handling
        mock_handle.return_value = {
            'status': 'success',
            'message': 'Webhook processed successfully'
        }
        
        url = reverse('payments:stripe-webhook-tickets')
        
        response = self.client.post(url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_verify.assert_called_once()
        mock_handle.assert_called_once_with(mock_event)
    
    @patch('payments.stripe_gateway.stripe_gateway.verify_webhook')
    def test_webhook_invalid_signature(self, mock_verify):
        """Test webhook with invalid signature"""
        # Mock webhook verification failure
        mock_verify.return_value = None
        
        url = reverse('payments:stripe-webhook-tickets')
        
        response = self.client.post(url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PaymentIntegrationTest(APITestCase):
    """Test payment integration with ticketing"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='user@test.com',
            username='user',
            password='testpass123'
        )
        self.organizer = User.objects.create_user(
            email='organizer@test.com',
            username='organizer',
            password='testpass123',
            role=User.Role.ORGANIZER
        )
        self.event = Event.objects.create(
            name='Test Event',
            sport='Basketball',
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            created_by=self.organizer
        )
        self.ticket_type = TicketType.objects.create(
            event=self.event,
            name='General',
            price_cents=2000,
            quantity_total=100
        )
    
    def test_create_order_and_checkout_url_ok(self):
        """Test creating order and getting checkout URL"""
        self.client.force_authenticate(user=self.user)
        
        # Create order
        order_url = reverse('tickets:create-order')
        order_data = {
            'event_id': self.event.id,
            'items': [
                {'ticket_type_id': self.ticket_type.id, 'qty': 2}
            ]
        }
        
        order_response = self.client.post(order_url, order_data, format='json')
        self.assertEqual(order_response.status_code, status.HTTP_201_CREATED)
        
        order_id = order_response.data['id']
        
        # Get checkout URL
        with patch('payments.stripe_gateway.stripe_gateway.create_checkout_session') as mock_checkout:
            mock_checkout.return_value = {
                'checkout_url': 'https://checkout.stripe.com/test',
                'session_id': 'test_session_id',
                'order_id': order_id
            }
            
            checkout_url = reverse('payments:stripe-checkout')
            checkout_data = {'order_id': order_id}
            
            checkout_response = self.client.post(checkout_url, checkout_data, format='json')
            self.assertEqual(checkout_response.status_code, status.HTTP_200_OK)
            self.assertIn('checkout_url', checkout_response.data)
    
    @patch('payments.stripe_gateway.stripe_gateway.handle_webhook_event')
    def test_webhook_marks_order_paid_and_issues_tickets_ok(self, mock_webhook):
        """Test webhook marking order as paid and issuing tickets"""
        # Create order and ticket
        order = TicketOrder.objects.create(
            user=self.user,
            event=self.event,
            total_cents=2000
        )
        ticket = Ticket.objects.create(
            order=order,
            ticket_type=self.ticket_type
        )
        
        # Mock webhook response
        mock_webhook.return_value = {
            'status': 'success',
            'message': f'Order {order.id} marked as paid',
            'order_id': order.id
        }
        
        # Simulate webhook call
        with patch('payments.stripe_gateway.stripe_gateway.verify_webhook') as mock_verify:
            mock_event = MagicMock()
            mock_event.data.object.metadata = {'order_id': str(order.id)}
            mock_event.data.object.id = 'test_session_id'
            mock_event.data.object.payment_intent = 'test_payment_intent'
            mock_verify.return_value = mock_event
            
            # Process webhook
            gateway = StripeGateway()
            result = gateway._handle_checkout_completed(mock_event)
            
            self.assertEqual(result['status'], 'success')
            
            # Check order is marked as paid
            order.refresh_from_db()
            self.assertEqual(order.status, TicketOrder.Status.PAID)
            
            # Check ticket type sold quantity updated
            self.ticket_type.refresh_from_db()
            self.assertEqual(self.ticket_type.quantity_sold, 1)
    
    def test_inventory_sold_counts_ok(self):
        """Test that inventory sold counts increment correctly"""
        initial_sold = self.ticket_type.quantity_sold
        
        # Create order and ticket
        order = TicketOrder.objects.create(
            user=self.user,
            event=self.event,
            total_cents=2000
        )
        ticket = Ticket.objects.create(
            order=order,
            ticket_type=self.ticket_type
        )
        
        # Mark order as paid
        order.mark_paid()
        
        # Check inventory updated
        self.ticket_type.refresh_from_db()
        self.assertEqual(self.ticket_type.quantity_sold, initial_sold + 1)
    
    def test_my_tickets_list_ok(self):
        """Test that user can only see their own tickets"""
        # Create order and ticket for user
        order = TicketOrder.objects.create(
            user=self.user,
            event=self.event,
            total_cents=2000
        )
        ticket = Ticket.objects.create(
            order=order,
            ticket_type=self.ticket_type
        )
        
        # Create another user and their ticket
        other_user = User.objects.create_user(
            email='other@test.com',
            username='other',
            password='testpass123'
        )
        other_order = TicketOrder.objects.create(
            user=other_user,
            event=self.event,
            total_cents=2000
        )
        other_ticket = Ticket.objects.create(
            order=other_order,
            ticket_type=self.ticket_type
        )
        
        # Test user can only see their own tickets
        self.client.force_authenticate(user=self.user)
        url = reverse('tickets:my-tickets')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], ticket.id)
    
    def test_organizer_list_orders_ok(self):
        """Test that organizer can list orders for their events"""
        # Create order
        order = TicketOrder.objects.create(
            user=self.user,
            event=self.event,
            total_cents=2000
        )
        
        # Test organizer can see orders for their event
        self.client.force_authenticate(user=self.organizer)
        url = reverse('tickets:event-orders', kwargs={'event_id': self.event.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], order.id)
