"""
Media Hub tests for happy path scenarios.
Tests upload, moderation, public gallery, and RBAC.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse

from mediahub.models import MediaItem
from events.models import Event
from fixtures.models import Fixture

User = get_user_model()


class MediaUploadTest(APITestCase):
    """Test media upload functionality"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            role='ATHLETE'
        )
        self.organizer = User.objects.create_user(
            email='organizer@example.com',
            password='testpass123',
            first_name='Organizer',
            last_name='User',
            role='ORGANIZER'
        )
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='testpass123',
            first_name='Admin',
            last_name='User'
        )
        
        # Create test event
        self.event = Event.objects.create(
            name='Test Event',
            sport='Football',
            start_datetime='2025-12-01 10:00:00+00:00',
            end_datetime='2025-12-01 18:00:00+00:00',
            created_by=self.organizer,
            lifecycle_status='published'
        )
        
        # Create test fixture
        self.fixture = Fixture.objects.create(
            event=self.event,
            round_no=1,
            starts_at='2025-12-01 14:00:00+00:00',
            ends_at='2025-12-01 16:00:00+00:00',
            status='PUBLISHED'
        )
    
    def test_upload_image_pending_ok(self):
        """Test uploading an image and getting pending status"""
        self.client.force_authenticate(user=self.user)
        
        # Create test image file
        image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        image_file = SimpleUploadedFile(
            'test.png',
            image_content,
            content_type='image/png'
        )
        
        data = {
            'file': image_file,
            'event': self.event.id,
            'title': 'Test Image',
            'description': 'A test image'
        }
        
        response = self.client.post('/api/media/', data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')
        self.assertEqual(response.data['title'], 'Test Image')
        self.assertEqual(response.data['kind'], 'photo')
        
        # Verify media item was created
        media_item = MediaItem.objects.get(id=response.data['id'])
        self.assertEqual(media_item.uploader, self.user)
        self.assertEqual(media_item.event, self.event)
        self.assertEqual(media_item.status, MediaItem.Status.PENDING)
    
    def test_upload_video_pending_ok(self):
        """Test uploading a video and getting pending status"""
        self.client.force_authenticate(user=self.user)
        
        # Create test video file (minimal MP4 header)
        video_content = b'\x00\x00\x00\x18ftypmp41\x00\x00\x00\x00mp41isom'
        video_file = SimpleUploadedFile(
            'test.mp4',
            video_content,
            content_type='video/mp4'
        )
        
        data = {
            'file': video_file,
            'fixture': self.fixture.id,
            'title': 'Test Video'
        }
        
        response = self.client.post('/api/media/', data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')
        self.assertEqual(response.data['kind'], 'video')
    
    def test_moderator_approve_ok(self):
        """Test moderator approving media and it becoming visible in public gallery"""
        # Upload media as regular user
        self.client.force_authenticate(user=self.user)
        
        image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        image_file = SimpleUploadedFile('test.png', image_content, content_type='image/png')
        
        data = {'file': image_file, 'event': self.event.id, 'title': 'Test Image'}
        response = self.client.post('/api/media/', data, format='multipart')
        media_id = response.data['id']
        
        # Approve as organizer
        self.client.force_authenticate(user=self.organizer)
        response = self.client.post(f'/api/media/{media_id}/approve/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'approved')
        
        # Check it's visible in public gallery
        response = self.client.get('/api/media/public/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], media_id)
    
    def test_moderator_reject_ok(self):
        """Test moderator rejecting media"""
        # Upload media as regular user
        self.client.force_authenticate(user=self.user)
        
        image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        image_file = SimpleUploadedFile('test.png', image_content, content_type='image/png')
        
        data = {'file': image_file, 'event': self.event.id, 'title': 'Test Image'}
        response = self.client.post('/api/media/', data, format='multipart')
        media_id = response.data['id']
        
        # Reject as organizer
        self.client.force_authenticate(user=self.organizer)
        data = {'reason': 'Inappropriate content'}
        response = self.client.post(f'/api/media/{media_id}/reject/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'rejected')
        
        # Check it's not visible in public gallery
        response = self.client.get('/api/media/public/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)
    
    def test_public_gallery_filters_ok(self):
        """Test public gallery filters work correctly"""
        # Create approved media items
        media1 = MediaItem.objects.create(
            uploader=self.user,
            event=self.event,
            kind='photo',
            file='test1.png',
            status=MediaItem.Status.APPROVED,
            title='Photo 1'
        )
        
        media2 = MediaItem.objects.create(
            uploader=self.user,
            fixture=self.fixture,
            kind='video',
            file='test2.mp4',
            status=MediaItem.Status.APPROVED,
            title='Video 1'
        )
        
        # Test kind filter
        response = self.client.get('/api/media/public/?kind=photo')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['kind'], 'photo')
        
        # Test event filter
        response = self.client.get(f'/api/media/public/?event={self.event.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['event'], self.event.id)
        
        # Test fixture filter
        response = self.client.get(f'/api/media/public/?fixture={self.fixture.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['fixture'], self.fixture.id)
    
    def test_moderation_rbac_ok(self):
        """Test moderation RBAC - organizer only for own events, admin for all"""
        # Create media for organizer's event
        media_item = MediaItem.objects.create(
            uploader=self.user,
            event=self.event,
            kind='photo',
            file='test.png',
            status=MediaItem.Status.PENDING
        )
        
        # Create another organizer and event
        other_organizer = User.objects.create_user(
            email='other@example.com',
            password='testpass123',
            role='ORGANIZER'
        )
        other_event = Event.objects.create(
            name='Other Event',
            sport='Basketball',
            start_datetime='2025-12-02 10:00:00+00:00',
            end_datetime='2025-12-02 18:00:00+00:00',
            created_by=other_organizer,
            lifecycle_status='published'
        )
        
        # Other organizer cannot moderate media from different event
        self.client.force_authenticate(user=other_organizer)
        response = self.client.post(f'/api/media/{media_item.id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Original organizer can moderate their event's media
        self.client.force_authenticate(user=self.organizer)
        response = self.client.post(f'/api/media/{media_item.id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Admin can moderate any media
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/media/{media_item.id}/feature/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_share_info_ok(self):
        """Test share information endpoint returns canonical URL and share text"""
        # Create approved media
        media_item = MediaItem.objects.create(
            uploader=self.user,
            event=self.event,
            kind='photo',
            file='test.png',
            status=MediaItem.Status.APPROVED,
            title='Shareable Photo'
        )
        
        response = self.client.get(f'/api/media/share/{media_item.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('share_url', response.data)
        self.assertIn('share_text', response.data)
        self.assertIn('Shareable Photo', response.data['share_text'])
    
    def test_file_validation_errors(self):
        """Test file validation catches invalid files"""
        self.client.force_authenticate(user=self.user)
        
        # Test unsupported file type
        invalid_file = SimpleUploadedFile(
            'test.txt',
            b'This is not an image',
            content_type='text/plain'
        )
        
        data = {'file': invalid_file, 'event': self.event.id}
        response = self.client.post('/api/media/', data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('file', response.data)
    
    def test_uploader_can_edit_pending(self):
        """Test uploader can edit their own pending media"""
        # Upload media
        self.client.force_authenticate(user=self.user)
        
        image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        image_file = SimpleUploadedFile('test.png', image_content, content_type='image/png')
        
        data = {'file': image_file, 'event': self.event.id, 'title': 'Original Title'}
        response = self.client.post('/api/media/', data, format='multipart')
        media_id = response.data['id']
        
        # Edit title and description
        data = {'title': 'Updated Title', 'description': 'Updated description'}
        response = self.client.patch(f'/api/media/{media_id}/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Title')
        self.assertEqual(response.data['description'], 'Updated description')
    
    def test_uploader_cannot_edit_approved(self):
        """Test uploader cannot edit approved media"""
        # Create approved media
        media_item = MediaItem.objects.create(
            uploader=self.user,
            event=self.event,
            kind='photo',
            file='test.png',
            status=MediaItem.Status.APPROVED,
            title='Original Title'
        )
        
        self.client.force_authenticate(user=self.user)
        
        # Try to edit approved media
        data = {'title': 'Updated Title'}
        response = self.client.patch(f'/api/media/{media_item.id}/', data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
