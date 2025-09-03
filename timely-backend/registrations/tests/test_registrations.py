"""
Tests for registration functionality
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from events.models import Event, Division

from ..models import Registration, RegistrationDocument

User = get_user_model()


class RegistrationModelTest(TestCase):
    """Test Registration model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            role='ATHLETE'
        )
        self.organizer = User.objects.create_user(
            email='organizer@example.com',
            username='organizer',
            role='ORGANIZER'
        )
        self.event = Event.objects.create(
            name='Test Event',
            sport='Football',
            description='Test event',
            start_datetime=timezone.now() + timedelta(days=7),
            end_datetime=timezone.now() + timedelta(days=8),
            location='Test Stadium',
            capacity=100,
            fee_cents=5000,
            created_by=self.organizer
        )
        self.division = Division.objects.create(
            event=self.event,
            name='Senior Division',
            sort_order=1
        )
    
    def test_create_individual_registration(self):
        """Test creating individual registration"""
        registration = Registration.objects.create(
            user=self.user,
            event=self.event,
            division=self.division,
            type='individual',
            fee_cents=self.event.fee_cents
        )
        
        self.assertEqual(registration.user, self.user)
        self.assertEqual(registration.event, self.event)
        self.assertEqual(registration.type, 'individual')
        self.assertEqual(registration.status, 'pending')
        self.assertEqual(registration.payment_status, 'unpaid')
        self.assertEqual(registration.fee_cents, 5000)
    
    def test_create_team_registration(self):
        """Test creating team registration"""
        registration = Registration.objects.create(
            user=self.user,
            event=self.event,
            division=self.division,
            type='team',
            team_name='Test Team',
            team_manager_name='John Manager',
            team_contact='john@team.com',
            fee_cents=self.event.fee_cents
        )
        
        self.assertEqual(registration.type, 'team')
        self.assertEqual(registration.team_name, 'Test Team')
        self.assertTrue(registration.is_team_registration)
    
    def test_fee_dollars_property(self):
        """Test fee conversion from cents to dollars"""
        registration = Registration.objects.create(
            user=self.user,
            event=self.event,
            fee_cents=5000
        )
        
        self.assertEqual(registration.fee_dollars, 50.0)


class RegistrationAPITest(APITestCase):
    """Test Registration API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            role='ATHLETE'
        )
        self.organizer = User.objects.create_user(
            email='organizer@example.com',
            username='organizer',
            role='ORGANIZER'
        )
        self.event = Event.objects.create(
            name='Test Event',
            sport='Football',
            description='Test event',
            start_datetime=timezone.now() + timedelta(days=7),
            end_datetime=timezone.now() + timedelta(days=8),
            location='Test Stadium',
            capacity=100,
            fee_cents=5000,
            created_by=self.organizer,
            lifecycle_status='published',
            registration_open_at=timezone.now() - timedelta(days=1),
            registration_close_at=timezone.now() + timedelta(days=6)
        )
        self.division = Division.objects.create(
            event=self.event,
            name='Senior Division',
            sort_order=1
        )
    
    def test_create_registration_authenticated(self):
        """Test creating registration when authenticated"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'event': self.event.id,
            'division': self.division.id,
            'type': 'individual'
        }
        
        response = self.client.post('/api/registrations/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        registration = Registration.objects.get(user=self.user, event=self.event)
        self.assertEqual(registration.type, 'individual')
        self.assertEqual(registration.fee_cents, 5000)
    
    def test_create_registration_unauthenticated(self):
        """Test creating registration when not authenticated"""
        data = {
            'event': self.event.id,
            'division': self.division.id,
            'type': 'individual'
        }
        
        response = self.client.post('/api/registrations/', data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_my_registrations(self):
        """Test listing user's own registrations"""
        registration = Registration.objects.create(
            user=self.user,
            event=self.event,
            division=self.division,
            type='individual',
            fee_cents=5000
        )
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/registrations/mine/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], registration.id)
    
    def test_withdraw_registration(self):
        """Test withdrawing a registration"""
        registration = Registration.objects.create(
            user=self.user,
            event=self.event,
            division=self.division,
            type='individual',
            fee_cents=5000,
            status='pending'
        )
        
        self.client.force_authenticate(user=self.user)
        data = {'reason': 'Changed my mind'}
        
        response = self.client.patch(f'/api/registrations/{registration.id}/withdraw/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        registration.refresh_from_db()
        self.assertEqual(registration.status, 'withdrawn')
        self.assertEqual(registration.reason, 'Changed my mind')
    
    def test_organizer_approve_registration(self):
        """Test organizer approving a registration"""
        registration = Registration.objects.create(
            user=self.user,
            event=self.event,
            division=self.division,
            type='individual',
            fee_cents=5000,
            status='pending',
            payment_status='paid'
        )
        
        # Create required documents
        RegistrationDocument.objects.create(
            registration=registration,
            doc_type='id_card',
            file='test_id.pdf'
        )
        RegistrationDocument.objects.create(
            registration=registration,
            doc_type='medical_clearance',
            file='test_medical.pdf'
        )
        
        self.client.force_authenticate(user=self.organizer)
        data = {'reason': 'All documents verified'}
        
        response = self.client.patch(f'/api/registrations/{registration.id}/approve/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        registration.refresh_from_db()
        self.assertEqual(registration.status, 'confirmed')
        self.assertEqual(registration.decided_by, self.organizer)
    
    def test_organizer_reject_registration(self):
        """Test organizer rejecting a registration"""
        registration = Registration.objects.create(
            user=self.user,
            event=self.event,
            division=self.division,
            type='individual',
            fee_cents=5000,
            status='pending'
        )
        
        self.client.force_authenticate(user=self.organizer)
        data = {'reason': 'Missing required documents'}
        
        response = self.client.patch(f'/api/registrations/{registration.id}/reject/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        registration.refresh_from_db()
        self.assertEqual(registration.status, 'rejected')
        self.assertEqual(registration.reason, 'Missing required documents')
    
    def test_upload_document(self):
        """Test uploading a document for registration"""
        registration = Registration.objects.create(
            user=self.user,
            event=self.event,
            division=self.division,
            type='individual',
            fee_cents=5000
        )
        
        self.client.force_authenticate(user=self.user)
        
        # Create a test file
        from django.core.files.uploadedfile import SimpleUploadedFile
        test_file = SimpleUploadedFile(
            "test_id.pdf",
            b"file_content",
            content_type="application/pdf"
        )
        
        data = {
            'doc_type': 'id_card',
            'file': test_file,
            'note': 'Test ID document'
        }
        
        response = self.client.post(f'/api/registrations/{registration.id}/documents/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        document = RegistrationDocument.objects.get(registration=registration)
        self.assertEqual(document.doc_type, 'id_card')
        self.assertEqual(document.note, 'Test ID document')
    
    def test_create_payment_intent(self):
        """Test creating payment intent"""
        registration = Registration.objects.create(
            user=self.user,
            event=self.event,
            division=self.division,
            type='individual',
            fee_cents=5000
        )
        
        self.client.force_authenticate(user=self.user)
        response = self.client.post(f'/api/registrations/{registration.id}/pay/intent/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('client_secret', response.data)
        self.assertEqual(response.data['amount'], 5000)
    
    def test_confirm_payment(self):
        """Test confirming payment"""
        registration = Registration.objects.create(
            user=self.user,
            event=self.event,
            division=self.division,
            type='individual',
            fee_cents=5000
        )
        
        self.client.force_authenticate(user=self.user)
        data = {'client_secret': 'test_client_secret'}
        
        response = self.client.post(f'/api/registrations/{registration.id}/pay/confirm/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        registration.refresh_from_db()
        self.assertEqual(registration.payment_status, 'paid')
    
    def test_permissions_owner_only_mutation(self):
        """Test that only registration owner can mutate their registration"""
        other_user = User.objects.create_user(
            email='other@example.com',
            username='otheruser',
            role='ATHLETE'
        )
        
        registration = Registration.objects.create(
            user=self.user,
            event=self.event,
            division=self.division,
            type='individual',
            fee_cents=5000
        )
        
        # Try to withdraw someone else's registration
        self.client.force_authenticate(user=other_user)
        response = self.client.patch(f'/api/registrations/{registration.id}/withdraw/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)