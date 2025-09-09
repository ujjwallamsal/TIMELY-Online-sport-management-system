"""
Tests for audit functionality
"""
import os
import tempfile
import csv
import subprocess
from io import StringIO
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock

from audit.models import AuditLog

User = get_user_model()


class AuditLogModelTest(TestCase):
    """Test AuditLog model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
    
    def test_audit_log_creation(self):
        """Test creating an audit log entry"""
        log = AuditLog.log_action(
            actor=self.user,
            action=AuditLog.ActionType.LOGIN,
            target_type='User',
            target_id=str(self.user.id),
            meta={'ip_address': '127.0.0.1'},
            ip_address='127.0.0.1',
            user_agent='Test Agent'
        )
        
        self.assertEqual(log.actor_id, self.user)
        self.assertEqual(log.action, AuditLog.ActionType.LOGIN)
        self.assertEqual(log.target_type, 'User')
        self.assertEqual(log.target_id, str(self.user.id))
        self.assertEqual(log.meta['ip_address'], '127.0.0.1')
        self.assertEqual(log.ip_address, '127.0.0.1')
        self.assertEqual(log.user_agent, 'Test Agent')
    
    def test_audit_log_immutable(self):
        """Test that audit logs cannot be updated or deleted"""
        log = AuditLog.log_action(
            actor=self.user,
            action=AuditLog.ActionType.LOGIN,
            target_type='User',
            target_id=str(self.user.id)
        )
        
        # Test update prevention
        with self.assertRaises(Exception):
            log.action = AuditLog.ActionType.LOGOUT
            log.save()
        
        # Test delete prevention
        with self.assertRaises(Exception):
            log.delete()
    
    def test_audit_log_properties(self):
        """Test audit log properties"""
        log = AuditLog.log_action(
            actor=self.user,
            action=AuditLog.ActionType.LOGIN,
            target_type='User',
            target_id=str(self.user.id)
        )
        
        self.assertEqual(log.actor_email, self.user.email)
        self.assertEqual(log.target_display, f"User:{self.user.id}")


class AuditLogAPITest(APITestCase):
    """Test audit log API endpoints"""
    
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )
        self.regular_user = User.objects.create_user(
            email='user@example.com',
            password='userpass123'
        )
        
        # Create some test audit logs
        AuditLog.log_action(
            actor=self.admin_user,
            action=AuditLog.ActionType.LOGIN,
            target_type='User',
            target_id=str(self.admin_user.id)
        )
        AuditLog.log_action(
            actor=self.regular_user,
            action=AuditLog.ActionType.REGISTRATION_CREATE,
            target_type='Registration',
            target_id='123'
        )
    
    def test_audit_list_requires_admin(self):
        """Test that audit list requires admin permissions"""
        # Test without authentication
        response = self.client.get('/api/audit/logs/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test with regular user
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/audit/logs/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with admin user
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/audit/logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_audit_list_filters_ok(self):
        """Test audit list filtering functionality"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test action filter
        response = self.client.get('/api/audit/logs/?action=LOGIN')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['action'], 'LOGIN')
        
        # Test actor filter
        response = self.client.get(f'/api/audit/logs/?actor={self.admin_user.email}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test target_type filter
        response = self.client.get('/api/audit/logs/?target_type=Registration')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['target_type'], 'Registration')
        
        # Test search
        response = self.client.get('/api/audit/logs/?q=LOGIN')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_audit_export_csv_ok(self):
        """Test audit CSV export functionality"""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get('/api/audit/logs/export/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment', response['Content-Disposition'])
        
        # Parse CSV content
        csv_content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(StringIO(csv_content))
        rows = list(csv_reader)
        
        self.assertEqual(len(rows), 2)  # Two audit logs created in setUp
        self.assertIn('actor_email', rows[0].keys())
        self.assertIn('action', rows[0].keys())
        self.assertIn('target_type', rows[0].keys())
    
    def test_audit_stats(self):
        """Test audit statistics endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get('/api/audit/logs/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertIn('total_count', data)
        self.assertIn('recent_count', data)
        self.assertIn('action_stats', data)
        self.assertIn('top_actors', data)
        
        self.assertEqual(data['total_count'], 2)
        self.assertGreaterEqual(data['recent_count'], 0)


class BackupCommandTest(TestCase):
    """Test backup management command"""
    
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
    
    def tearDown(self):
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    @patch('subprocess.run')
    def test_backup_command_creates_file_ok(self, mock_run):
        """Test that backup command creates a file"""
        # Mock successful pg_dump execution
        mock_run.return_value = MagicMock(returncode=0, stdout='', stderr='')
        
        # Mock file creation
        with patch('pathlib.Path.exists', return_value=True):
            with patch('pathlib.Path.stat') as mock_stat:
                mock_stat.return_value.st_size = 1024 * 1024  # 1MB
                
                # Mock the directory creation
                with patch('pathlib.Path.mkdir'):
                    # Run backup command
                    call_command(
                        'backup_db',
                        '--output-dir', self.temp_dir,
                        '--format', 'sql'
                    )
                
                # Verify pg_dump was called
                mock_run.assert_called_once()
                args = mock_run.call_args[0][0]
                self.assertIn('pg_dump', args)
                self.assertIn('--file', args)
    
    @patch('subprocess.run')
    def test_backup_command_with_compression(self, mock_run):
        """Test backup command with compression"""
        mock_run.return_value = MagicMock(returncode=0, stdout='', stderr='')
        
        with patch('pathlib.Path.exists', return_value=True):
            with patch('pathlib.Path.stat') as mock_stat:
                mock_stat.return_value.st_size = 1024 * 1024
                
                with patch('pathlib.Path.mkdir'):
                    call_command(
                        'backup_db',
                        '--output-dir', self.temp_dir,
                        '--compress',
                        '--format', 'sql'
                    )
                
                # Verify gzip was used for compression
                mock_run.assert_called_once()
                args = mock_run.call_args[0][0]
                self.assertIn('gzip', args)
    
    @patch('subprocess.run')
    def test_backup_command_handles_errors(self, mock_run):
        """Test backup command error handling"""
        # Mock pg_dump failure
        mock_run.side_effect = subprocess.CalledProcessError(1, 'pg_dump', stderr='Connection failed')
        
        with self.assertRaises(Exception):
            call_command(
                'backup_db',
                '--output-dir', self.temp_dir
            )
    
    @patch('subprocess.run')
    def test_backup_command_logs_action(self, mock_run):
        """Test that backup command logs the action"""
        mock_run.return_value = MagicMock(returncode=0, stdout='', stderr='')
        
        with patch('pathlib.Path.exists', return_value=True):
            with patch('pathlib.Path.stat') as mock_stat:
                mock_stat.return_value.st_size = 1024 * 1024
                
                with patch('pathlib.Path.mkdir'):
                    # Run backup command
                    call_command(
                        'backup_db',
                        '--output-dir', self.temp_dir
                    )
                
                # Check that audit log was created
                audit_logs = AuditLog.objects.filter(action=AuditLog.ActionType.SYSTEM_BACKUP)
                self.assertEqual(audit_logs.count(), 1)
                
                log = audit_logs.first()
                self.assertEqual(log.target_type, 'Database')
                self.assertEqual(log.target_id, 'timely_db')
                self.assertIn('backup_file', log.meta)
