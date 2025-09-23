import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.core.cache import cache

from common.models import AuditLog
from events.models import Event
from registrations.models import Registration
from tickets.models import TicketOrder
from notifications.models import Notification
from adminapi.permissions import IsAdmin
from adminapi.services import AdminKPIService

User = get_user_model()


class AdminAPITestCase(APITestCase):
    """Base test case for admin API tests"""
    
    def setUp(self):
        """Set up test data"""
        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            username='admin',
            password='testpass123',
            role='ADMIN',
            is_staff=True
        )
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            email='user@test.com',
            username='user',
            password='testpass123',
            role='ATHLETE'
        )
        
        # Create test event
        self.event = Event.objects.create(
            name='Test Event',
            sport='Soccer',
            description='Test event description',
            start_datetime='2024-12-01 10:00:00+00:00',
            end_datetime='2024-12-01 18:00:00+00:00',
            location='Test Location',
            capacity=100,
            fee_cents=5000,
            lifecycle_status='published',
            created_by=self.admin_user
        )
        
        # Create test registration
        self.registration = Registration.objects.create(
            user=self.regular_user,
            event=self.event,
            status='confirmed',
            payment_status='paid',
            fee_cents=5000
        )
        
        # Create test ticket order
        self.ticket_order = TicketOrder.objects.create(
            user=self.regular_user,
            event=self.event,
            total_cents=10000,
            status='paid'
        )
        
        # Create test notification
        self.notification = Notification.objects.create(
            user=self.regular_user,
            title='Test Notification',
            body='Test notification body',
            kind='info'
        )
        
        # Create test audit log
        self.audit_log = AuditLog.objects.create(
            user=self.admin_user,
            action='CREATE',
            resource_type='Event',
            resource_id=str(self.event.id),
            details={'test': 'data'}
        )
        
        # Clear cache
        cache.clear()
    
    def tearDown(self):
        """Clean up after tests"""
        cache.clear()


class AdminPermissionTest(AdminAPITestCase):
    """Test admin permissions"""
    
    def test_admin_can_access_kpis(self):
        """Test that admin users can access KPI endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('adminapi:kpis'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_regular_user_cannot_access_kpis(self):
        """Test that regular users cannot access KPI endpoint"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(reverse('adminapi:kpis'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_unauthenticated_user_cannot_access_kpis(self):
        """Test that unauthenticated users cannot access KPI endpoint"""
        response = self.client.get(reverse('adminapi:kpis'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class KPITest(AdminAPITestCase):
    """Test KPI endpoint"""
    
    def test_kpis_ok(self):
        """Test KPI endpoint returns correct data"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('adminapi:kpis'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Check required fields
        self.assertIn('usersByRole', data)
        self.assertIn('eventsByStatus', data)
        self.assertIn('registrationsByStatus', data)
        self.assertIn('tickets', data)
        self.assertIn('notificationsSent', data)
        self.assertIn('errorsRecent', data)
        self.assertIn('lastUpdated', data)
        
        # Check data types
        self.assertIsInstance(data['usersByRole'], dict)
        self.assertIsInstance(data['eventsByStatus'], dict)
        self.assertIsInstance(data['registrationsByStatus'], dict)
        self.assertIsInstance(data['tickets'], dict)
        self.assertIsInstance(data['notificationsSent'], int)
        self.assertIsInstance(data['errorsRecent'], int)
        
        # Check ticket data structure
        self.assertIn('count', data['tickets'])
        self.assertIn('totalCents', data['tickets'])


class DrilldownTest(AdminAPITestCase):
    """Test drilldown endpoints"""
    
    def test_drill_users_filter_ok(self):
        """Test users drilldown with filtering"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test without filters
        response = self.client.get(reverse('adminapi:drill_users'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('results', data)
        self.assertIn('count', data)
        self.assertIn('page', data)
        self.assertIn('total_pages', data)
        
        # Test with role filter
        response = self.client.get(reverse('adminapi:drill_users') + '?role=ADMIN')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['results']), 1)  # Only admin user
        
        # Test with search filter
        response = self.client.get(reverse('adminapi:drill_users') + '?q=admin')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['results']), 1)  # Only admin user
    
    def test_drill_events_filter_ok(self):
        """Test events drilldown with filtering"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test without filters
        response = self.client.get(reverse('adminapi:drill_events'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('results', data)
        self.assertIn('count', data)
        
        # Test with status filter
        response = self.client.get(reverse('adminapi:drill_events') + '?status=published')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['results']), 1)  # Only published event
    
    def test_drill_orders_filter_ok(self):
        """Test orders drilldown with filtering"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test without filters
        response = self.client.get(reverse('adminapi:drill_orders'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('results', data)
        self.assertIn('count', data)
        
        # Test with status filter
        response = self.client.get(reverse('adminapi:drill_orders') + '?status=paid')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['results']), 1)  # Only paid order
    
    def test_audit_list_ok(self):
        """Test audit logs endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get(reverse('adminapi:audit_logs'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('results', data)
        self.assertIn('count', data)
        self.assertEqual(len(data['results']), 1)  # One audit log


class CSVExportTest(AdminAPITestCase):
    """Test CSV export functionality"""
    
    def test_export_csv_ok(self):
        """Test CSV export returns correct content type and header row"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test users export
        response = self.client.get(reverse('adminapi:export_csv', args=['users']))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment; filename="users_export.csv"', response['Content-Disposition'])
        
        # Check CSV content
        content = response.content.decode('utf-8')
        lines = content.strip().split('\n')
        self.assertGreater(len(lines), 1)  # Header + data rows
        
        # Check header row
        header_row = lines[0]
        self.assertIn('ID', header_row)
        self.assertIn('Email', header_row)
        self.assertIn('Role', header_row)
        
        # Test events export
        response = self.client.get(reverse('adminapi:export_csv', args=['events']))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        
        # Test registrations export
        response = self.client.get(reverse('adminapi:export_csv', args=['registrations']))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        
        # Test orders export
        response = self.client.get(reverse('adminapi:export_csv', args=['orders']))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        
        # Test audit export
        response = self.client.get(reverse('adminapi:export_csv', args=['audit']))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
    
    def test_export_csv_with_filters(self):
        """Test CSV export respects filters"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Export only admin users
        response = self.client.get(reverse('adminapi:export_csv', args=['users']) + '?role=ADMIN')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        content = response.content.decode('utf-8')
        lines = content.strip().split('\n')
        # Should have header + 1 admin user
        self.assertEqual(len(lines), 2)
    
    def test_export_csv_invalid_kind(self):
        """Test CSV export with invalid kind returns 400"""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get(reverse('adminapi:export_csv', args=['invalid']))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AdminKPIServiceTest(TestCase):
    """Test AdminKPIService functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            username='admin',
            password='testpass123',
            role='ADMIN'
        )
        
        self.regular_user = User.objects.create_user(
            email='user@test.com',
            username='user',
            password='testpass123',
            role='ATHLETE'
        )
        
        # Clear cache
        cache.clear()
    
    def test_kpi_service_computation(self):
        """Test KPI service computes correct values"""
        kpis = AdminKPIService.get_kpis()
        
        # Check users by role
        self.assertIn('ADMIN', kpis['usersByRole'])
        self.assertIn('ATHLETE', kpis['usersByRole'])
        self.assertEqual(kpis['usersByRole']['ADMIN'], 1)
        self.assertEqual(kpis['usersByRole']['ATHLETE'], 1)
        
        # Check notifications sent
        self.assertEqual(kpis['notificationsSent'], 0)  # No notifications created yet
    
    def test_kpi_service_caching(self):
        """Test KPI service caching works"""
        # First call should compute
        kpis1 = AdminKPIService.get_kpis()
        
        # Second call should use cache
        kpis2 = AdminKPIService.get_kpis()
        
        # Should be the same data
        self.assertEqual(kpis1['lastUpdated'], kpis2['lastUpdated'])
        
        # Invalidate cache
        AdminKPIService.invalidate_cache()
        
        # Third call should compute again
        kpis3 = AdminKPIService.get_kpis()
        
        # Should have different timestamp
        self.assertNotEqual(kpis1['lastUpdated'], kpis3['lastUpdated'])
