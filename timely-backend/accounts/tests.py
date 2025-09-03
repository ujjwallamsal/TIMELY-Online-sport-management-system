# accounts/tests.py
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, UserRole, AuditLog, EmailVerificationToken, PasswordResetToken
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class UserModelTest(TestCase):
    """Test User model functionality"""
    
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'SPECTATOR'
        }
    
    def test_create_user(self):
        """Test creating a regular user"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.email, self.user_data['email'])
        self.assertEqual(user.first_name, self.user_data['first_name'])
        self.assertEqual(user.last_name, self.user_data['last_name'])
        self.assertEqual(user.role, self.user_data['role'])
        self.assertTrue(user.check_password(self.user_data['password']))
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_staff)
        self.assertTrue(user.is_active)
    
    def test_create_superuser(self):
        """Test creating a superuser"""
        user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_active)
        self.assertEqual(user.role, 'ADMIN')
    
    def test_user_str_representation(self):
        """Test user string representation"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(str(user), user.email)
    
    def test_user_full_name(self):
        """Test user full name property"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.full_name, 'Test User')
    
    def test_user_display_name(self):
        """Test user display name property"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.display_name, 'Test User')
        
        # Test with no name
        user.first_name = ''
        user.last_name = ''
        user.save()
        self.assertEqual(user.display_name, user.email)
    
    def test_email_verification(self):
        """Test email verification functionality"""
        user = User.objects.create_user(**self.user_data)
        self.assertFalse(user.is_verified)
        
        user.verify_email()
        self.assertTrue(user.is_verified)
        self.assertIsNotNone(user.email_verified_at)


class UserRoleModelTest(TestCase):
    """Test UserRole model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
    
    def test_create_user_role(self):
        """Test creating a user role"""
        role = UserRole.objects.create(
            user=self.user,
            role_type='ORGANIZER',
            is_primary=True,
            can_manage_events=True
        )
        self.assertEqual(role.user, self.user)
        self.assertEqual(role.role_type, 'ORGANIZER')
        self.assertTrue(role.is_primary)
        self.assertTrue(role.can_manage_events)
    
    def test_role_str_representation(self):
        """Test role string representation"""
        role = UserRole.objects.create(
            user=self.user,
            role_type='ORGANIZER'
        )
        self.assertIn(self.user.email, str(role))
        self.assertIn('ORGANIZER', str(role))
    
    def test_role_display_name(self):
        """Test role display name"""
        role = UserRole.objects.create(
            user=self.user,
            role_type='ORGANIZER'
        )
        self.assertEqual(role.get_display_name(), 'Event Organizer')


class AuditLogModelTest(TestCase):
    """Test AuditLog model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
    
    def test_create_audit_log(self):
        """Test creating an audit log entry"""
        log = AuditLog.log_action(
            user=self.user,
            action=AuditLog.ActionType.LOGIN,
            resource_type='User',
            resource_id=str(self.user.id),
            details={'method': 'email_password'}
        )
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.action, 'LOGIN')
        self.assertEqual(log.resource_type, 'User')
        self.assertEqual(log.resource_id, str(self.user.id))
    
    def test_audit_log_str_representation(self):
        """Test audit log string representation"""
        log = AuditLog.log_action(
            user=self.user,
            action=AuditLog.ActionType.LOGIN,
            resource_type='User',
            resource_id=str(self.user.id)
        )
        self.assertIn(self.user.email, str(log))
        self.assertIn('LOGIN', str(log))


class AuthenticationAPITest(APITestCase):
    """Test authentication API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'SPECTATOR'
        }
        self.user = User.objects.create_user(**self.user_data)
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        url = reverse('register')
        data = {
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password_confirm': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'ATHLETE'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertIn('user_id', response.data)
        
        # Check if user was created
        user = User.objects.get(email='newuser@example.com')
        self.assertEqual(user.first_name, 'New')
        self.assertEqual(user.role, 'ATHLETE')
    
    def test_user_login(self):
        """Test user login endpoint"""
        url = reverse('login')
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertIn('user', response.data)
        
        # Check if cookies were set
        self.assertIn('access', response.cookies)
        self.assertIn('refresh', response.cookies)
    
    def test_user_logout(self):
        """Test user logout endpoint"""
        # First login to get cookies
        login_url = reverse('login')
        login_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        login_response = self.client.post(login_url, login_data)
        
        # Then logout
        logout_url = reverse('logout')
        response = self.client.post(logout_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if cookies were cleared
        self.assertNotIn('access', response.cookies)
        self.assertNotIn('refresh', response.cookies)


class UserManagementAPITest(APITestCase):
    """Test user management API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            role='SPECTATOR'
        )
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
    
    def test_get_user_profile(self):
        """Test getting user profile"""
        self.client.force_authenticate(user=self.user)
        url = reverse('user-me')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)
        self.assertEqual(response.data['first_name'], self.user.first_name)
    
    def test_update_user_profile(self):
        """Test updating user profile"""
        self.client.force_authenticate(user=self.user)
        url = reverse('user-me')
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'bio': 'New bio'
        }
        
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if user was updated
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.user.bio, 'New bio')
    
    def test_change_password(self):
        """Test changing user password"""
        self.client.force_authenticate(user=self.user)
        url = reverse('user-change-password', kwargs={'pk': self.user.id})
        data = {
            'current_password': 'testpass123',
            'new_password': 'newpass123',
            'new_password_confirm': 'newpass123'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpass123'))
    
    def test_admin_list_users(self):
        """Test admin listing users"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('admin-user-list')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 2)  # admin + test user


class PermissionTest(APITestCase):
    """Test permission system"""
    
    def setUp(self):
        self.client = APIClient()
        self.regular_user = User.objects.create_user(
            email='user@example.com',
            password='userpass123',
            first_name='Regular',
            last_name='User',
            role='SPECTATOR'
        )
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
    
    def test_regular_user_cannot_access_admin_endpoints(self):
        """Test that regular users cannot access admin endpoints"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('admin-user-list')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_admin_can_access_admin_endpoints(self):
        """Test that admin users can access admin endpoints"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('admin-user-list')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_user_can_access_own_profile(self):
        """Test that users can access their own profile"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('user-me')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.regular_user.email)


class TokenTest(APITestCase):
    """Test JWT token functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
    
    def test_token_refresh(self):
        """Test JWT token refresh"""
        # Create tokens
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Test refresh endpoint
        url = reverse('refresh')
        self.client.cookies['refresh'] = refresh_token
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.cookies)


class EmailVerificationTest(APITestCase):
    """Test email verification functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
    
    def test_email_verification_token_creation(self):
        """Test creating email verification token"""
        token = EmailVerificationToken.objects.create(
            user=self.user,
            token='test-token-123',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        self.assertEqual(token.user, self.user)
        self.assertEqual(token.token, 'test-token-123')
        self.assertFalse(token.is_used)
        self.assertFalse(token.is_expired)
    
    def test_email_verification_token_expiry(self):
        """Test email verification token expiry"""
        token = EmailVerificationToken.objects.create(
            user=self.user,
            token='expired-token',
            expires_at=timezone.now() - timedelta(hours=1)
        )
        
        self.assertTrue(token.is_expired)


class PasswordResetTest(APITestCase):
    """Test password reset functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
    
    def test_password_reset_token_creation(self):
        """Test creating password reset token"""
        token = PasswordResetToken.objects.create(
            user=self.user,
            token='reset-token-123',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        self.assertEqual(token.user, self.user)
        self.assertEqual(token.token, 'reset-token-123')
        self.assertFalse(token.is_used)
        self.assertFalse(token.is_expired)
    
    def test_password_reset_token_usage(self):
        """Test using password reset token"""
        token = PasswordResetToken.objects.create(
            user=self.user,
            token='reset-token-123',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        token.use_token()
        self.assertTrue(token.is_used)
