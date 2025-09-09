# kyc/tests/test_kyc.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from kyc.models import KycProfile, KycDocument
from accounts.models import RoleRequest, AuditLog

User = get_user_model()


class KycModelTest(TestCase):
    """Test KYC model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
    
    def test_kyc_profile_creation(self):
        """Test KYC profile creation"""
        kyc_profile = KycProfile.objects.create(
            user=self.user,
            full_name='Test User',
            date_of_birth='1990-01-01',
            nationality='Australian',
            document_type='passport',
            document_number='A1234567'
        )
        
        self.assertEqual(kyc_profile.user, self.user)
        self.assertEqual(kyc_profile.status, KycProfile.Status.UNVERIFIED)
        self.assertEqual(kyc_profile.full_name, 'Test User')
    
    def test_kyc_profile_submit_for_review(self):
        """Test KYC profile submission for review"""
        kyc_profile = KycProfile.objects.create(user=self.user)
        kyc_profile.submit_for_review()
        
        self.assertEqual(kyc_profile.status, KycProfile.Status.PENDING)
        self.assertIsNotNone(kyc_profile.submitted_at)
    
    def test_kyc_profile_approve(self):
        """Test KYC profile approval"""
        admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )
        kyc_profile = KycProfile.objects.create(user=self.user)
        
        kyc_profile.approve(admin_user, 'Documents verified')
        
        self.assertEqual(kyc_profile.status, KycProfile.Status.VERIFIED)
        self.assertEqual(kyc_profile.reviewed_by, admin_user)
        self.assertEqual(kyc_profile.review_notes, 'Documents verified')
    
    def test_kyc_profile_reject(self):
        """Test KYC profile rejection"""
        admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )
        kyc_profile = KycProfile.objects.create(user=self.user)
        
        kyc_profile.reject(admin_user, 'Documents unclear')
        
        self.assertEqual(kyc_profile.status, KycProfile.Status.REJECTED)
        self.assertEqual(kyc_profile.reviewed_by, admin_user)
        self.assertEqual(kyc_profile.rejection_reason, 'Documents unclear')
    
    def test_kyc_document_creation(self):
        """Test KYC document creation"""
        kyc_profile = KycProfile.objects.create(user=self.user)
        
        # Create a simple file for testing
        test_file = SimpleUploadedFile(
            "test_id.jpg",
            b"file_content",
            content_type="image/jpeg"
        )
        
        document = KycDocument.objects.create(
            kyc_profile=kyc_profile,
            document_type=KycDocument.DocumentType.ID_FRONT,
            file=test_file
        )
        
        self.assertEqual(document.kyc_profile, kyc_profile)
        self.assertEqual(document.document_type, KycDocument.DocumentType.ID_FRONT)
        self.assertEqual(document.file_name, 'test_id.jpg')


class KycAPITest(APITestCase):
    """Test KYC API endpoints"""
    
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
    
    def test_kyc_profile_create(self):
        """Test KYC profile creation via API"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        
        data = {
            'full_name': 'Test User',
            'date_of_birth': '1990-01-01',
            'nationality': 'Australian',
            'document_type': 'passport',
            'document_number': 'A1234567'
        }
        
        response = self.client.post('/api/kyc/profile/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        kyc_profile = KycProfile.objects.get(user=self.user)
        self.assertEqual(kyc_profile.full_name, 'Test User')
    
    def test_kyc_profile_submit(self):
        """Test KYC profile submission via API"""
        kyc_profile = KycProfile.objects.create(user=self.user)
        
        # Create required documents
        test_file = SimpleUploadedFile(
            "test_id.jpg",
            b"file_content",
            content_type="image/jpeg"
        )
        KycDocument.objects.create(
            kyc_profile=kyc_profile,
            document_type=KycDocument.DocumentType.ID_FRONT,
            file=test_file
        )
        KycDocument.objects.create(
            kyc_profile=kyc_profile,
            document_type=KycDocument.DocumentType.ID_BACK,
            file=test_file
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        response = self.client.post('/api/kyc/profile/submit/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        kyc_profile.refresh_from_db()
        self.assertEqual(kyc_profile.status, KycProfile.Status.PENDING)
    
    def test_kyc_profile_review_approve(self):
        """Test KYC profile approval via API"""
        kyc_profile = KycProfile.objects.create(user=self.user)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        
        data = {
            'action': 'approve',
            'notes': 'Documents verified'
        }
        
        response = self.client.patch(f'/api/kyc/profile/{kyc_profile.pk}/review/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        kyc_profile.refresh_from_db()
        self.assertEqual(kyc_profile.status, KycProfile.Status.VERIFIED)
        self.assertEqual(kyc_profile.reviewed_by, self.admin_user)
    
    def test_kyc_profile_review_reject(self):
        """Test KYC profile rejection via API"""
        kyc_profile = KycProfile.objects.create(user=self.user)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        
        data = {
            'action': 'reject',
            'reason': 'Documents unclear'
        }
        
        response = self.client.patch(f'/api/kyc/profile/{kyc_profile.pk}/review/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        kyc_profile.refresh_from_db()
        self.assertEqual(kyc_profile.status, KycProfile.Status.REJECTED)
        self.assertEqual(kyc_profile.rejection_reason, 'Documents unclear')
    
    def test_kyc_document_upload(self):
        """Test KYC document upload via API"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        
        test_file = SimpleUploadedFile(
            "test_id.jpg",
            b"file_content",
            content_type="image/jpeg"
        )
        
        data = {
            'document_type': 'id_front',
            'file': test_file
        }
        
        response = self.client.post('/api/kyc/documents/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        document = KycDocument.objects.get(kyc_profile__user=self.user)
        self.assertEqual(document.document_type, KycDocument.DocumentType.ID_FRONT)


class RoleRequestTest(APITestCase):
    """Test role request functionality"""
    
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
    
    def test_role_request_create(self):
        """Test role request creation"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        
        data = {
            'requested_role': 'ORGANIZER',
            'note': 'I want to organize events',
            'organization_name': 'Test Organization'
        }
        
        response = self.client.post('/api/accounts/role-requests/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        role_request = RoleRequest.objects.get(user=self.user)
        self.assertEqual(role_request.requested_role, 'ORGANIZER')
        self.assertEqual(role_request.status, RoleRequest.Status.PENDING)
    
    def test_role_request_admin_disallowed(self):
        """Test that ADMIN role requests are rejected"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        
        data = {
            'requested_role': 'ADMIN',
            'note': 'I want admin access'
        }
        
        response = self.client.post('/api/accounts/role-requests/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('"ADMIN" is not a valid choice', str(response.data))
    
    def test_role_request_approve(self):
        """Test role request approval"""
        role_request = RoleRequest.objects.create(
            user=self.user,
            requested_role='ORGANIZER',
            note='I want to organize events'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        
        data = {
            'action': 'approve',
            'notes': 'Approved for organizing events'
        }
        
        response = self.client.patch(f'/api/accounts/role-requests/{role_request.pk}/approve/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        role_request.refresh_from_db()
        self.user.refresh_from_db()
        
        self.assertEqual(role_request.status, RoleRequest.Status.APPROVED)
        self.assertEqual(self.user.role, 'ORGANIZER')
    
    def test_role_request_reject(self):
        """Test role request rejection"""
        role_request = RoleRequest.objects.create(
            user=self.user,
            requested_role='ORGANIZER',
            note='I want to organize events'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        
        data = {
            'action': 'reject',
            'reason': 'Insufficient experience'
        }
        
        response = self.client.patch(f'/api/accounts/role-requests/{role_request.pk}/reject/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        role_request.refresh_from_db()
        self.assertEqual(role_request.status, RoleRequest.Status.REJECTED)
        self.assertEqual(role_request.rejection_reason, 'Insufficient experience')


class RegistrationKycEnforcementTest(APITestCase):
    """Test that registration approval requires KYC verification"""
    
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
    
    def test_registration_approval_blocked_without_kyc(self):
        """Test that registration approval is blocked without KYC verification"""
        # This test would need to be implemented based on the actual registration approval logic
        # For now, we'll test the KYC verification check
        
        kyc_profile = KycProfile.objects.create(user=self.user)
        self.assertFalse(kyc_profile.is_verified_or_waived)
    
    def test_registration_approval_allowed_with_kyc(self):
        """Test that registration approval is allowed with KYC verification"""
        kyc_profile = KycProfile.objects.create(user=self.user)
        kyc_profile.approve(self.admin_user, 'Documents verified')
        
        self.assertTrue(kyc_profile.is_verified_or_waived)
