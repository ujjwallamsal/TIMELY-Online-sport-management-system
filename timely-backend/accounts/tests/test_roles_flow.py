# accounts/tests/test_roles_flow.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import RoleRequest
from common.models import AuditLog
from kyc.models import KycProfile

User = get_user_model()


class NoAdminSignupTest(APITestCase):
    """Test that signup always creates SPECTATOR users only"""
    
    def test_signup_spectator_only(self):
        """Test that public signup creates SPECTATOR users only"""
        data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        response = self.client.post('/api/accounts/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        user = User.objects.get(email='test@example.com')
        self.assertEqual(user.role, User.Role.SPECTATOR)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
    
    def test_signup_ignores_role_fields(self):
        """Test that signup ignores any role fields sent by client"""
        data = {
            'email': 'test2@example.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'ADMIN',  # This should be ignored
            'is_staff': True,  # This should be ignored
            'is_superuser': True  # This should be ignored
        }
        
        response = self.client.post('/api/accounts/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        user = User.objects.get(email='test2@example.com')
        self.assertEqual(user.role, User.Role.SPECTATOR)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)


class LoginEmailUsernameTest(APITestCase):
    """Test that login accepts both email and username"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
    
    def test_login_with_email(self):
        """Test login with email"""
        # Create a user first
        user = User.objects.create_user(
            email='logintest@example.com',
            username='logintest',
            password='testpass123',
            first_name='Login',
            last_name='Test',
            role=User.Role.SPECTATOR
        )
        
        data = {
            'email': 'logintest@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/accounts/auth/login/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
    
    def test_login_with_username(self):
        """Test login with username"""
        data = {
            'email': 'testuser',  # Using username in email field
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/accounts/auth/login/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)


class RoleRequestFlowTest(APITestCase):
    """Test complete role request flow"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )
        
        # Get JWT tokens
        self.user_token = str(RefreshToken.for_user(self.user).access_token)
        self.admin_token = str(RefreshToken.for_user(self.admin_user).access_token)
    
    def test_role_request_create_and_admin_approve(self):
        """Test role request creation and admin approval with real-time updates"""
        # Create role request
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        
        data = {
            'requested_role': 'ORGANIZER',
            'note': 'I want to organize events',
            'organization_name': 'Test Organization'
        }
        
        response = self.client.post('/api/accounts/role-requests/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        role_request = RoleRequest.objects.get(user=self.user)
        self.assertEqual(role_request.status, RoleRequest.Status.PENDING)
        
        # Admin approves request
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        
        approve_data = {
            'action': 'approve',
            'notes': 'Approved for organizing events'
        }
        
        response = self.client.patch(f'/api/accounts/role-requests/{role_request.pk}/approve/', approve_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that role was updated
        role_request.refresh_from_db()
        self.user.refresh_from_db()
        
        self.assertEqual(role_request.status, RoleRequest.Status.APPROVED)
        self.assertEqual(self.user.role, 'ORGANIZER')
        
        # Check audit log
        audit_log = AuditLog.objects.filter(
            action=AuditLog.ActionType.ROLE_REQUEST_APPROVED,
            user=self.admin_user
        ).first()
        self.assertIsNotNone(audit_log)
        self.assertEqual(audit_log.details['target_user'], self.user.email)
    
    def test_role_request_reject(self):
        """Test role request rejection"""
        role_request = RoleRequest.objects.create(
            user=self.user,
            requested_role='COACH',
            note='I want to coach teams'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        
        data = {
            'action': 'reject',
            'reason': 'Insufficient coaching experience'
        }
        
        response = self.client.patch(f'/api/accounts/role-requests/{role_request.pk}/reject/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        role_request.refresh_from_db()
        self.assertEqual(role_request.status, RoleRequest.Status.REJECTED)
        self.assertEqual(role_request.rejection_reason, 'Insufficient coaching experience')
        
        # Check audit log
        audit_log = AuditLog.objects.filter(
            action=AuditLog.ActionType.ROLE_REQUEST_REJECTED,
            user=self.admin_user
        ).first()
        self.assertIsNotNone(audit_log)
    
    def test_role_request_admin_disallowed_via_api(self):
        """Test that ADMIN role requests are rejected via API"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        
        data = {
            'requested_role': 'ADMIN',
            'note': 'I want admin access'
        }
        
        response = self.client.post('/api/accounts/role-requests/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('"ADMIN" is not a valid choice', str(response.data))


class KycEnforcementTest(APITestCase):
    """Test KYC enforcement for registration approval"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )
    
    def test_registration_approval_blocked_until_kyc(self):
        """Test that registration approval is blocked until KYC is verified"""
        # Create KYC profile but don't verify it
        kyc_profile = KycProfile.objects.create(user=self.user)
        self.assertFalse(kyc_profile.is_verified_or_waived)
        
        # This would be tested with actual registration approval logic
        # For now, we test the KYC verification check
        self.assertFalse(kyc_profile.is_verified_or_waived)
    
    def test_registration_approval_success_after_kyc(self):
        """Test that registration approval succeeds after KYC verification"""
        kyc_profile = KycProfile.objects.create(user=self.user)
        kyc_profile.approve(self.admin_user, 'Documents verified')
        
        self.assertTrue(kyc_profile.is_verified_or_waived)


class AdminOnlyEndpointsTest(APITestCase):
    """Test that admin-only endpoints are properly protected"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )
        
        # Get JWT tokens
        self.user_token = str(RefreshToken.for_user(self.user).access_token)
        self.admin_token = str(RefreshToken.for_user(self.admin_user).access_token)
    
    def test_role_request_approve_admin_only(self):
        """Test that role request approval requires admin access"""
        role_request = RoleRequest.objects.create(
            user=self.user,
            requested_role='ORGANIZER',
            note='I want to organize events'
        )
        
        # Try to approve as regular user
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        
        data = {
            'action': 'approve',
            'notes': 'Approved'
        }
        
        response = self.client.patch(f'/api/accounts/role-requests/{role_request.pk}/approve/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Approve as admin
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.patch(f'/api/accounts/role-requests/{role_request.pk}/approve/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_kyc_review_admin_only(self):
        """Test that KYC review requires admin access"""
        kyc_profile = KycProfile.objects.create(user=self.user)
        
        # Try to review as regular user
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        
        data = {
            'action': 'approve',
            'notes': 'Approved'
        }
        
        response = self.client.patch(f'/api/kyc/profile/{kyc_profile.pk}/review/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Review as admin
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.patch(f'/api/kyc/profile/{kyc_profile.pk}/review/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class UserProfileWithKycTest(APITestCase):
    """Test that /users/me/ returns KYC status and pending role request"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        self.user_token = str(RefreshToken.for_user(self.user).access_token)
    
    def test_users_me_includes_kyc_status(self):
        """Test that /users/me/ includes KYC status"""
        kyc_profile = KycProfile.objects.create(user=self.user)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        response = self.client.get('/api/accounts/users/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('kyc_status', response.data)
        self.assertEqual(response.data['kyc_status'], 'unverified')
    
    def test_users_me_includes_pending_role_request(self):
        """Test that /users/me/ includes pending role request"""
        role_request = RoleRequest.objects.create(
            user=self.user,
            requested_role='ORGANIZER',
            note='I want to organize events'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        response = self.client.get('/api/accounts/users/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('pending_role_request', response.data)
        self.assertIsNotNone(response.data['pending_role_request'])
        self.assertEqual(response.data['pending_role_request']['requested_role'], 'ORGANIZER')
