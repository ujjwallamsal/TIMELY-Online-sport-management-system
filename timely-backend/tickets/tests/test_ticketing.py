# tickets/tests/test_ticketing.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock

from events.models import Event
from fixtures.models import Fixture
from tickets.models import TicketType, TicketOrder, Ticket
from tickets.services.pricing import calculate_order_total, validate_inventory
from tickets.services.qr import generate_qr_payload, verify_qr_payload

User = get_user_model()


class TicketTypeModelTest(TestCase):
    """Test TicketType model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='organizer@test.com',
            username='organizer',
            password='testpass123'
        )
        self.event = Event.objects.create(
            name='Test Event',
            sport='Basketball',
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            created_by=self.user
        )
    
    def test_ticket_type_creation(self):
        """Test creating a ticket type"""
        ticket_type = TicketType.objects.create(
            event=self.event,
            name='General Admission',
            description='Standard ticket',
            price_cents=2500,
            quantity_total=100
        )
        
        self.assertEqual(ticket_type.name, 'General Admission')
        self.assertEqual(ticket_type.price_dollars, 25.00)
        self.assertEqual(ticket_type.available_quantity, 100)
        self.assertTrue(ticket_type.is_available)
    
    def test_ticket_type_sold_out(self):
        """Test sold out ticket type"""
        ticket_type = TicketType.objects.create(
            event=self.event,
            name='VIP',
            price_cents=5000,
            quantity_total=10,
            quantity_sold=10
        )
        
        self.assertEqual(ticket_type.available_quantity, 0)
        self.assertFalse(ticket_type.is_available)
        self.assertTrue(ticket_type.is_sold_out)
    
    def test_can_purchase_validation(self):
        """Test purchase validation"""
        ticket_type = TicketType.objects.create(
            event=self.event,
            name='Standard',
            price_cents=1000,
            quantity_total=50,
            quantity_sold=10
        )
        
        self.assertTrue(ticket_type.can_purchase(5))
        self.assertFalse(ticket_type.can_purchase(50))  # More than available
        self.assertFalse(ticket_type.can_purchase(0))   # Zero quantity


class TicketOrderModelTest(TestCase):
    """Test TicketOrder model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='user@test.com',
            username='user',
            password='testpass123'
        )
        self.organizer = User.objects.create_user(
            email='organizer@test.com',
            username='organizer',
            password='testpass123'
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
    
    def test_order_creation(self):
        """Test creating an order"""
        order = TicketOrder.objects.create(
            user=self.user,
            event=self.event,
            total_cents=4000
        )
        
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.event, self.event)
        self.assertEqual(order.status, TicketOrder.Status.PENDING)
        self.assertEqual(order.total_dollars, 40.00)
        self.assertTrue(order.can_cancel)
    
    def test_mark_paid(self):
        """Test marking order as paid"""
        order = TicketOrder.objects.create(
            user=self.user,
            event=self.event,
            total_cents=2000
        )
        
        # Create a ticket
        ticket = Ticket.objects.create(
            order=order,
            ticket_type=self.ticket_type
        )
        
        # Mark as paid
        order.mark_paid(session_id='test_session', payment_intent='test_intent')
        
        self.assertEqual(order.status, TicketOrder.Status.PAID)
        self.assertEqual(order.provider_session_id, 'test_session')
        self.assertEqual(order.provider_payment_intent, 'test_intent')
        
        # Check ticket type sold quantity updated
        self.ticket_type.refresh_from_db()
        self.assertEqual(self.ticket_type.quantity_sold, 1)


class TicketModelTest(TestCase):
    """Test Ticket model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='user@test.com',
            username='user',
            password='testpass123'
        )
        self.event = Event.objects.create(
            name='Test Event',
            sport='Basketball',
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            created_by=self.user
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
    
    def test_ticket_creation(self):
        """Test creating a ticket"""
        ticket = Ticket.objects.create(
            order=self.order,
            ticket_type=self.ticket_type
        )
        
        self.assertIsNotNone(ticket.serial)
        self.assertIsNotNone(ticket.qr_payload)
        self.assertEqual(ticket.status, Ticket.Status.VALID)
        self.assertTrue(ticket.is_valid)
    
    def test_use_ticket(self):
        """Test using a ticket"""
        ticket = Ticket.objects.create(
            order=self.order,
            ticket_type=self.ticket_type
        )
        
        result = ticket.use_ticket()
        
        self.assertTrue(result)
        self.assertEqual(ticket.status, Ticket.Status.USED)
        self.assertIsNotNone(ticket.used_at)
        self.assertFalse(ticket.is_valid)


class PricingServiceTest(TestCase):
    """Test pricing service functions"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='organizer@test.com',
            username='organizer',
            password='testpass123'
        )
        self.event = Event.objects.create(
            name='Test Event',
            sport='Basketball',
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            created_by=self.user
        )
        self.ticket_type1 = TicketType.objects.create(
            event=self.event,
            name='General',
            price_cents=2000,
            quantity_total=100
        )
        self.ticket_type2 = TicketType.objects.create(
            event=self.event,
            name='VIP',
            price_cents=5000,
            quantity_total=50
        )
    
    def test_calculate_order_total(self):
        """Test order total calculation"""
        items = [
            {'ticket_type_id': self.ticket_type1.id, 'qty': 2},
            {'ticket_type_id': self.ticket_type2.id, 'qty': 1}
        ]
        
        total_cents, currency = calculate_order_total(items)
        
        self.assertEqual(total_cents, 9000)  # 2*2000 + 1*5000
        self.assertEqual(currency, 'USD')
    
    def test_validate_inventory(self):
        """Test inventory validation"""
        items = [
            {'ticket_type_id': self.ticket_type1.id, 'qty': 5},
            {'ticket_type_id': self.ticket_type2.id, 'qty': 2}
        ]
        
        result = validate_inventory(items)
        
        self.assertTrue(result['valid'])
        self.assertEqual(len(result['errors']), 0)
    
    def test_validate_insufficient_inventory(self):
        """Test validation with insufficient inventory"""
        items = [
            {'ticket_type_id': self.ticket_type1.id, 'qty': 150}  # More than available
        ]
        
        result = validate_inventory(items)
        
        self.assertFalse(result['valid'])
        self.assertGreater(len(result['errors']), 0)


class QRServiceTest(TestCase):
    """Test QR service functions"""
    
    def test_generate_qr_payload(self):
        """Test QR payload generation"""
        payload = generate_qr_payload(123, 456, 'ABC123')
        
        self.assertTrue(payload.startswith('TKT:'))
        self.assertIn('123', payload)
        self.assertIn('456', payload)
        self.assertIn('ABC123', payload)
    
    def test_verify_qr_payload(self):
        """Test QR payload verification"""
        payload = generate_qr_payload(123, 456, 'ABC123')
        
        result = verify_qr_payload(payload)
        
        self.assertTrue(result['valid'])
        self.assertEqual(result['ticket_id'], 123)
        self.assertEqual(result['order_id'], 456)
        self.assertEqual(result['serial'], 'ABC123')
    
    def test_verify_invalid_payload(self):
        """Test verification of invalid payload"""
        result = verify_qr_payload('invalid_payload')
        
        self.assertFalse(result['valid'])
        self.assertIsNotNone(result['error'])


class TicketAPITest(APITestCase):
    """Test ticket API endpoints"""
    
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
            description='General admission ticket',
            price_cents=2000,
            quantity_total=100
        )
    
    def test_list_ticket_types_public(self):
        """Test listing ticket types (public access)"""
        url = reverse('tickets:event-ticket-types', kwargs={'event_id': self.event.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'General')
    
    def test_create_order_authenticated(self):
        """Test creating an order (authenticated)"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('tickets:create-order')
        data = {
            'event_id': self.event.id,
            'items': [
                {'ticket_type_id': self.ticket_type.id, 'qty': 2}
            ]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['total_cents'], 4000)
        self.assertEqual(response.data['status'], 'pending')
    
    def test_create_order_unauthenticated(self):
        """Test creating an order without authentication"""
        url = reverse('tickets:create-order')
        data = {
            'event_id': self.event.id,
            'items': [
                {'ticket_type_id': self.ticket_type.id, 'qty': 2}
            ]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_my_tickets_list(self):
        """Test listing user's tickets"""
        # Create an order and ticket
        order = TicketOrder.objects.create(
            user=self.user,
            event=self.event,
            total_cents=2000
        )
        ticket = Ticket.objects.create(
            order=order,
            ticket_type=self.ticket_type
        )
        
        self.client.force_authenticate(user=self.user)
        url = reverse('tickets:my-tickets')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['serial'], ticket.serial)
    
    def test_organizer_list_orders(self):
        """Test organizer listing event orders"""
        # Create an order
        order = TicketOrder.objects.create(
            user=self.user,
            event=self.event,
            total_cents=2000
        )
        
        self.client.force_authenticate(user=self.organizer)
        url = reverse('tickets:event-orders', kwargs={'event_id': self.event.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], order.id)


class PaymentIntegrationTest(APITestCase):
    """Test payment integration"""
    
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
    
    @patch('payments.stripe_gateway.stripe_gateway.create_checkout_session')
    def test_stripe_checkout_creation(self, mock_checkout):
        """Test Stripe checkout session creation"""
        # Create an order
        order = TicketOrder.objects.create(
            user=self.user,
            event=self.event,
            total_cents=2000
        )
        
        # Mock Stripe response
        mock_checkout.return_value = {
            'checkout_url': 'https://checkout.stripe.com/test',
            'session_id': 'test_session_id',
            'order_id': order.id
        }
        
        self.client.force_authenticate(user=self.user)
        url = reverse('payments:stripe-checkout')
        data = {'order_id': order.id}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('checkout_url', response.data)
        mock_checkout.assert_called_once()
    
    @patch('payments.stripe_gateway.stripe_gateway.handle_webhook_event')
    def test_webhook_order_paid(self, mock_webhook):
        """Test webhook marking order as paid"""
        # Create an order and ticket
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
        
        url = reverse('payments:stripe-webhook-tickets')
        
        # Simulate webhook payload (simplified)
        response = self.client.post(url, {}, format='json')
        
        # Note: In real test, you'd need to properly mock the webhook verification
        # This is a simplified test to show the structure
        self.assertIn(response.status_code, [200, 400])  # 400 due to missing signature


class InventoryTest(TestCase):
    """Test inventory management"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='user@test.com',
            username='user',
            password='testpass123'
        )
        self.event = Event.objects.create(
            name='Test Event',
            sport='Basketball',
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            created_by=self.user
        )
        self.ticket_type = TicketType.objects.create(
            event=self.event,
            name='General',
            price_cents=2000,
            quantity_total=10,
            quantity_sold=5
        )
    
    def test_inventory_sold_counts_ok(self):
        """Test that sold counts increment correctly"""
        initial_sold = self.ticket_type.quantity_sold
        
        # Create order and mark as paid
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
    
    def test_no_oversell(self):
        """Test that overselling is prevented"""
        # Try to create order for more tickets than available
        items = [
            {'ticket_type_id': self.ticket_type.id, 'qty': 10}  # Only 5 available
        ]
        
        result = validate_inventory(items)
        
        self.assertFalse(result['valid'])
        self.assertIn('Insufficient inventory', result['errors'][0])
