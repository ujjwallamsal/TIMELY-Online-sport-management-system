# accounts/tests/test_admin_users.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class AdminUsersAPITestCase(TestCase):
    """Test cases for admin users API functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            username='admin',
            password='testpass123',
            role='ADMIN',
            is_active=True
        )
        
        # Create organizer user
        self.organizer_user = User.objects.create_user(
            email='organizer@test.com',
            username='organizer',
            password='testpass123',
            role='ORGANIZER',
            is_active=True
        )
        
        # Create athlete user
        self.athlete_user = User.objects.create_user(
            email='athlete@test.com',
            username='athlete',
            password='testpass123',
            role='ATHLETE',
            is_active=True
        )
    
    def test_admin_can_view_users(self):
        """Test that admin can view users list"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/users/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertGreaterEqual(len(response.data['results']), 3)  # At least 3 users created
    
    def test_organizer_cannot_view_users(self):
        """Test that organizer cannot view admin users"""
        self.client.force_authenticate(user=self.organizer_user)
        response = self.client.get('/api/admin/users/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_athlete_cannot_view_users(self):
        """Test that athlete cannot view admin users"""
        self.client.force_authenticate(user=self.athlete_user)
        response = self.client.get('/api/admin/users/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_admin_can_create_user(self):
        """Test that admin can create users"""
        self.client.force_authenticate(user=self.admin_user)
        
        user_data = {
            'email': 'newuser@test.com',
            'username': 'newuser',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'testpass123',
            'role': 'ATHLETE',
            'is_active': True
        }
        
        response = self.client.post('/api/admin/users/', user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], 'newuser@test.com')
        self.assertEqual(response.data['role'], 'ATHLETE')
        
        # Verify user was created in database
        created_user = User.objects.get(email='newuser@test.com')
        self.assertEqual(created_user.username, 'newuser')
        self.assertEqual(created_user.role, 'ATHLETE')
    
    def test_admin_can_update_user(self):
        """Test that admin can update users"""
        self.client.force_authenticate(user=self.admin_user)
        
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'role': 'COACH',
            'is_active': False
        }
        
        response = self.client.patch(f'/api/admin/users/{self.athlete_user.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')
        self.assertEqual(response.data['role'], 'COACH')
        self.assertEqual(response.data['is_active'], False)
        
        # Verify user was updated in database
        self.athlete_user.refresh_from_db()
        self.assertEqual(self.athlete_user.first_name, 'Updated')
        self.assertEqual(self.athlete_user.role, 'COACH')
        self.assertEqual(self.athlete_user.is_active, False)
    
    def test_admin_can_activate_user(self):
        """Test that admin can activate users"""
        # First deactivate the user
        self.athlete_user.is_active = False
        self.athlete_user.save()
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(f'/api/admin/users/{self.athlete_user.id}/activate/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'User activated successfully')
        
        # Verify user is now active
        self.athlete_user.refresh_from_db()
        self.assertTrue(self.athlete_user.is_active)
    
    def test_admin_can_deactivate_user(self):
        """Test that admin can deactivate users"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(f'/api/admin/users/{self.athlete_user.id}/deactivate/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'User deactivated successfully')
        
        # Verify user is now inactive
        self.athlete_user.refresh_from_db()
        self.assertFalse(self.athlete_user.is_active)
    
    def test_admin_can_change_user_role(self):
        """Test that admin can change user roles"""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.post(f'/api/admin/users/{self.athlete_user.id}/change-role/', {
            'role': 'ORGANIZER'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'User role changed successfully')
        self.assertEqual(response.data['old_role'], 'ATHLETE')
        self.assertEqual(response.data['new_role'], 'ORGANIZER')
        
        # Verify user role was changed in database
        self.athlete_user.refresh_from_db()
        self.assertEqual(self.athlete_user.role, 'ORGANIZER')
    
    def test_user_creation_validation(self):
        """Test user creation validation"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test missing required fields
        response = self.client.post('/api/admin/users/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        self.assertIn('username', response.data)
        self.assertIn('password', response.data)
    
    def test_duplicate_email_validation(self):
        """Test that duplicate emails are rejected"""
        self.client.force_authenticate(user=self.admin_user)
        
        user_data = {
            'email': 'admin@test.com',  # Already exists
            'username': 'newuser',
            'password': 'testpass123',
            'role': 'ATHLETE'
        }
        
        response = self.client.post('/api/admin/users/', user_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_duplicate_username_validation(self):
        """Test that duplicate usernames are rejected"""
        self.client.force_authenticate(user=self.admin_user)
        
        user_data = {
            'email': 'newuser@test.com',
            'username': 'admin',  # Already exists
            'password': 'testpass123',
            'role': 'ATHLETE'
        }
        
        response = self.client.post('/api/admin/users/', user_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
    
    def test_user_filtering(self):
        """Test user filtering functionality"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test role filter
        response = self.client.get('/api/admin/users/?role=ADMIN')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test active status filter
        response = self.client.get('/api/admin/users/?is_active=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)  # All users are active
        
        # Test search filter
        response = self.client.get('/api/admin/users/?q=admin')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_unauthorized_access(self):
        """Test that unauthorized users cannot access admin endpoints"""
        # Test without authentication
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test with non-admin user
        self.client.force_authenticate(user=self.athlete_user)
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
