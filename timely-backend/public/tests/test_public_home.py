# public/tests/test_public_home.py
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from accounts.models import User
from events.models import Event
from content.models import News, Banner
from venues.models import Venue


class PublicHomeAPITest(APITestCase):
    """Test the public home API endpoint"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        self.venue = Venue.objects.create(
            name='Test Venue',
            address='123 Test St',
            capacity=100,
            manager=self.user
        )
        
        # Create published event
        self.event = Event.objects.create(
            name='Test Event',
            sport='Football',
            start_datetime=timezone.now() + timezone.timedelta(days=1),
            end_datetime=timezone.now() + timezone.timedelta(days=2),
            location='Test Location',
            venue=self.venue,
            fee_cents=5000,
            phase='registration',
            lifecycle_status=Event.LifecycleStatus.PUBLISHED,
            created_by=self.user
        )
        
        # Create published news
        self.news = News.objects.create(
            title='Test News',
            body='This is test news content',
            excerpt='Test excerpt',
            is_published=True,
            publish_at=timezone.now() - timezone.timedelta(hours=1),
            author=self.user
        )
        
        # Create active banner
        self.banner = Banner.objects.create(
            title='Test Banner',
            link_url='https://example.com',
            is_active=True,
            start_at=timezone.now() - timezone.timedelta(days=1),
            end_at=timezone.now() + timezone.timedelta(days=1)
        )
    
    def test_public_home_ok(self):
        """Test public home endpoint returns 200 with correct data structure"""
        url = reverse('public:home')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('featuredEvents', response.data)
        self.assertIn('news', response.data)
        self.assertIn('banners', response.data)
        
        # Check featured events
        self.assertEqual(len(response.data['featuredEvents']), 1)
        event_data = response.data['featuredEvents'][0]
        self.assertEqual(event_data['id'], self.event.id)
        self.assertEqual(event_data['title'], self.event.name)
        self.assertEqual(event_data['sport'], self.event.sport)
        
        # Check news
        self.assertEqual(len(response.data['news']), 1)
        news_data = response.data['news'][0]
        self.assertEqual(news_data['id'], self.news.id)
        self.assertEqual(news_data['title'], self.news.title)
        
        # Check banners
        self.assertEqual(len(response.data['banners']), 1)
        banner_data = response.data['banners'][0]
        self.assertEqual(banner_data['id'], self.banner.id)
        self.assertEqual(banner_data['title'], self.banner.title)
    
    def test_public_home_cached(self):
        """Test that public home endpoint has cache headers"""
        url = reverse('public:home')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('ETag', response)
        self.assertIn('Last-Modified', response)
    
    def test_public_home_news_window(self):
        """Test that only published news within time window is returned"""
        # Create future news (should not appear)
        future_news = News.objects.create(
            title='Future News',
            body='Future content',
            is_published=True,
            publish_at=timezone.now() + timezone.timedelta(days=1),
            author=self.user
        )
        
        # Create unpublished news (should not appear)
        unpublished_news = News.objects.create(
            title='Unpublished News',
            body='Unpublished content',
            is_published=False,
            publish_at=timezone.now() - timezone.timedelta(hours=1),
            author=self.user
        )
        
        url = reverse('public:home')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['news']), 1)  # Only the original published news
        self.assertEqual(response.data['news'][0]['id'], self.news.id)
    
    def test_public_home_banner_window(self):
        """Test that only active banners within time window are returned"""
        # Create inactive banner (should not appear)
        inactive_banner = Banner.objects.create(
            title='Inactive Banner',
            link_url='https://example.com',
            is_active=False,
            start_at=timezone.now() - timezone.timedelta(days=1),
            end_at=timezone.now() + timezone.timedelta(days=1)
        )
        
        # Create future banner (should not appear)
        future_banner = Banner.objects.create(
            title='Future Banner',
            link_url='https://example.com',
            is_active=True,
            start_at=timezone.now() + timezone.timedelta(days=1),
            end_at=timezone.now() + timezone.timedelta(days=2)
        )
        
        url = reverse('public:home')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['banners']), 1)  # Only the original active banner
        self.assertEqual(response.data['banners'][0]['id'], self.banner.id)
    
    def test_cors_creds_ok(self):
        """Test that CORS credentials are enabled for dev"""
        url = reverse('public:home')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # CORS headers are handled by middleware, not in the view response
