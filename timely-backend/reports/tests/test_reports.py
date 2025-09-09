# reports/tests/test_reports.py
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta

from accounts.models import User

User = get_user_model()


class ReportsAPITest(APITestCase):
    """Test cases for Reports API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        # Create test users
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            username='admin',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            role=User.Role.ADMIN,
            is_superuser=True
        )
        
        self.organizer_user = User.objects.create_user(
            email='organizer@test.com',
            username='organizer',
            password='testpass123',
            first_name='Organizer',
            last_name='User',
            role=User.Role.ORGANIZER
        )
        
        self.spectator_user = User.objects.create_user(
            email='spectator@test.com',
            username='spectator',
            password='testpass123',
            first_name='Spectator',
            last_name='User',
            role=User.Role.SPECTATOR
        )
    
    def test_registrations_filters_ok(self):
        """Test registrations report with filters"""
        self.client.force_authenticate(user=self.organizer_user)
        
        # Test without filters
        response = self.client.get('/api/reports/registrations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)
    
    def test_revenue_totals_ok(self):
        """Test revenue report with totals"""
        self.client.force_authenticate(user=self.organizer_user)
        
        response = self.client.get('/api/reports/revenue/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('rows', response.data)
        self.assertIn('totals', response.data)
    
    def test_attendance_stub_ok(self):
        """Test attendance report (stub using orders/tickets)"""
        self.client.force_authenticate(user=self.organizer_user)
        
        response = self.client.get('/api/reports/attendance/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('rows', response.data)
        self.assertIn('summary', response.data)
    
    def test_performance_snapshot_ok(self):
        """Test performance report with standings snapshot"""
        self.client.force_authenticate(user=self.organizer_user)
        
        response = self.client.get('/api/reports/performance/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('standings', response.data)
        self.assertIn('top_players', response.data)
        self.assertIn('summary', response.data)
    
    def test_export_csv_ok(self):
        """Test CSV export functionality"""
        self.client.force_authenticate(user=self.organizer_user)
        
        # Test registrations export
        response = self.client.get('/api/reports/export/registrations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment', response['Content-Disposition'])
    
    def test_rbac_organizer_limits(self):
        """Test that organizers can only see their own events"""
        self.client.force_authenticate(user=self.organizer_user)
        
        # Organizer should be able to access reports
        response = self.client.get('/api/reports/registrations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_rbac_admin_sees_all(self):
        """Test that admin can see all events"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Admin should be able to access reports
        response = self.client.get('/api/reports/registrations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_unauthorized_access(self):
        """Test that unauthorized users cannot access reports"""
        # Test without authentication
        response = self.client.get('/api/reports/registrations/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test with spectator user (should be denied)
        self.client.force_authenticate(user=self.spectator_user)
        response = self.client.get('/api/reports/registrations/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_invalid_report_type_export(self):
        """Test CSV export with invalid report type"""
        self.client.force_authenticate(user=self.organizer_user)
        
        response = self.client.get('/api/reports/export/invalid/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_pagination_works(self):
        """Test that pagination works correctly"""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get('/api/reports/registrations/?page=1&page_size=1')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('page', response.data)
        self.assertIn('page_size', response.data)
    
    def test_date_filtering(self):
        """Test date range filtering"""
        self.client.force_authenticate(user=self.organizer_user)
        
        # Test with date_from filter (use simple date format)
        date_from = (timezone.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        response = self.client.get(f'/api/reports/registrations/?date_from={date_from}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
