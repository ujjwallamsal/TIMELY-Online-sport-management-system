# content/tests/test_cms.py
from django.test import TestCase
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from accounts.models import User
from content.models import Page, News, Banner
import json


class PageModelTest(TestCase):
    """Test Page model functionality."""
    
    def setUp(self):
        self.page = Page.objects.create(
            title="Test Page",
            slug="test-page",
            body="This is a test page content.",
            published=True
        )
    
    def test_page_creation(self):
        """Test page creation with basic fields."""
        self.assertEqual(self.page.title, "Test Page")
        self.assertEqual(self.page.slug, "test-page")
        self.assertTrue(self.page.published)
        self.assertFalse(self.page.is_published_now())
    
    def test_page_slug_auto_generation(self):
        """Test automatic slug generation from title."""
        page = Page.objects.create(
            title="Another Test Page",
            body="Content here"
        )
        self.assertEqual(page.slug, "another-test-page")
    
    def test_page_published_now(self):
        """Test is_published_now method."""
        # Not published
        self.page.published = False
        self.page.save()
        self.assertFalse(self.page.is_published_now())
        
        # Published but future date
        self.page.published = True
        self.page.publish_at = timezone.now() + timezone.timedelta(hours=1)
        self.page.save()
        self.assertFalse(self.page.is_published_now())
        
        # Published and current time
        self.page.publish_at = timezone.now() - timezone.timedelta(hours=1)
        self.page.save()
        self.assertTrue(self.page.is_published_now())
    
    def test_seo_methods(self):
        """Test SEO title and description methods."""
        # Test with custom SEO fields
        self.page.seo_title = "Custom SEO Title"
        self.page.seo_description = "Custom SEO description"
        self.page.save()
        
        self.assertEqual(self.page.get_seo_title(), "Custom SEO Title")
        self.assertEqual(self.page.get_seo_description(), "Custom SEO description")
        
        # Test fallback to title/body
        self.page.seo_title = ""
        self.page.seo_description = ""
        self.page.save()
        
        self.assertEqual(self.page.get_seo_title(), "Test Page")
        self.assertTrue("test page content" in self.page.get_seo_description().lower())


class NewsModelTest(TestCase):
    """Test News model functionality."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="testpass123"
        )
        self.news = News.objects.create(
            title="Test News",
            body="This is test news content.",
            published=True,
            author=self.user
        )
    
    def test_news_creation(self):
        """Test news article creation."""
        self.assertEqual(self.news.title, "Test News")
        self.assertEqual(self.news.author, self.user)
        self.assertTrue(self.news.published)
    
    def test_news_published_now(self):
        """Test is_published_now method for news."""
        # Not published
        self.news.published = False
        self.news.save()
        self.assertFalse(self.news.is_published_now())
        
        # Published and current time
        self.news.published = True
        self.news.publish_at = None
        self.news.save()
        self.assertTrue(self.news.is_published_now())


class BannerModelTest(TestCase):
    """Test Banner model functionality."""
    
    def setUp(self):
        self.banner = Banner.objects.create(
            title="Test Banner",
            active=True
        )
    
    def test_banner_creation(self):
        """Test banner creation."""
        self.assertEqual(self.banner.title, "Test Banner")
        self.assertTrue(self.banner.active)
    
    def test_banner_active_now(self):
        """Test is_active_now method."""
        # Not active
        self.banner.active = False
        self.banner.save()
        self.assertFalse(self.banner.is_active_now())
        
        # Active and within time window
        self.banner.active = True
        self.banner.starts_at = timezone.now() - timezone.timedelta(hours=1)
        self.banner.ends_at = timezone.now() + timezone.timedelta(hours=1)
        self.banner.save()
        self.assertTrue(self.banner.is_active_now())
        
        # Active but outside time window
        self.banner.ends_at = timezone.now() - timezone.timedelta(minutes=1)
        self.banner.save()
        self.assertFalse(self.banner.is_active_now())


class ContentAPITest(APITestCase):
    """Test content API endpoints."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email="admin@example.com",
            username="admin",
            password="adminpass123",
            is_staff=True
        )
        self.client.force_authenticate(user=self.user)
        
        # Create test data
        self.page = Page.objects.create(
            title="Test Page",
            slug="test-page",
            body="Test page content",
            published=True
        )
        
        self.news = News.objects.create(
            title="Test News",
            body="Test news content",
            published=True,
            author=self.user
        )
        
        self.banner = Banner.objects.create(
            title="Test Banner",
            active=True
        )
    
    def test_page_crud(self):
        """Test page CRUD operations."""
        # Create
        data = {
            "title": "New Page",
            "body": "New page content",
            "published": True
        }
        response = self.client.post('/api/content/pages/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Read
        response = self.client.get(f'/api/content/pages/{self.page.slug}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], "Test Page")
        
        # Update
        data = {"title": "Updated Page"}
        response = self.client.patch(f'/api/content/pages/{self.page.slug}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Delete
        response = self.client.delete(f'/api/content/pages/{self.page.slug}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    def test_news_crud(self):
        """Test news CRUD operations."""
        # Create
        data = {
            "title": "New News",
            "body": "New news content",
            "published": True
        }
        response = self.client.post('/api/content/news/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Read
        response = self.client.get(f'/api/content/news/{self.news.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], "Test News")
    
    def test_banner_crud(self):
        """Test banner CRUD operations."""
        # Create
        data = {
            "title": "New Banner",
            "active": True
        }
        response = self.client.post('/api/content/banners/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Read
        response = self.client.get(f'/api/content/banners/{self.banner.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], "Test Banner")
    
    def test_public_pages_endpoint(self):
        """Test public pages endpoint."""
        self.client.logout()  # Test as anonymous user
        
        response = self.client.get('/api/content/public/pages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "Test Page")
    
    def test_public_news_endpoint(self):
        """Test public news endpoint."""
        self.client.logout()  # Test as anonymous user
        
        response = self.client.get('/api/content/public/news/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "Test News")
    
    def test_public_banners_endpoint(self):
        """Test public banners endpoint."""
        self.client.logout()  # Test as anonymous user
        
        response = self.client.get('/api/content/public/banners/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "Test Banner")
    
    def test_scheduled_publishing(self):
        """Test scheduled publishing functionality."""
        # Create page with future publish date
        future_time = timezone.now() + timezone.timedelta(hours=1)
        page = Page.objects.create(
            title="Future Page",
            slug="future-page",
            body="Future content",
            published=True,
            publish_at=future_time
        )
        
        # Should not appear in public endpoint
        self.client.logout()
        response = self.client.get('/api/content/public/pages/')
        self.assertEqual(len(response.data), 1)  # Only the original page
        
        # Update to past time
        page.publish_at = timezone.now() - timezone.timedelta(hours=1)
        page.save()
        
        # Should now appear in public endpoint
        response = self.client.get('/api/content/public/pages/')
        self.assertEqual(len(response.data), 2)
