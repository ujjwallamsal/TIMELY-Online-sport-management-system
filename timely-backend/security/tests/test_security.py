# security/tests/test_security.py
from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from unittest.mock import patch, MagicMock
from rest_framework.test import APITestCase
from rest_framework import status
from accounts.models import User
from common.security import rate_limit, verify_stripe_webhook_signature, log_security_event
import json


class RateLimitTest(TestCase):
    """Test rate limiting functionality."""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="testpass123"
        )
    
    def test_rate_limit_login_429_ok(self):
        """Test that login rate limiting returns 429 after max attempts."""
        # Create a simple view with rate limiting for testing
        from django.http import JsonResponse
        from django.views.decorators.csrf import csrf_exempt
        
        @csrf_exempt
        @rate_limit(max_attempts=3, window_minutes=5)
        def test_login_view(request):
            return JsonResponse({'message': 'success'})
        
        # Make requests up to the limit
        for i in range(3):
            response = self.client.post('/test-login/', {
                'email': 'test@example.com',
                'password': 'wrongpassword'
            })
            self.assertEqual(response.status_code, 200)
        
        # Next request should be rate limited
        response = self.client.post('/test-login/', {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, 429)
        self.assertIn('Too many attempts', response.json()['error'])
    
    def test_rate_limit_resets_after_window(self):
        """Test that rate limit resets after time window."""
        from django.http import JsonResponse
        from django.views.decorators.csrf import csrf_exempt
        import time
        
        @csrf_exempt
        @rate_limit(max_attempts=2, window_minutes=1/60)  # 1 second window for testing
        def test_view(request):
            return JsonResponse({'message': 'success'})
        
        # Make requests up to the limit
        for i in range(2):
            response = self.client.post('/test-view/', {'data': 'test'})
            self.assertEqual(response.status_code, 200)
        
        # Next request should be rate limited
        response = self.client.post('/test-view/', {'data': 'test'})
        self.assertEqual(response.status_code, 429)
        
        # Wait for window to reset
        time.sleep(1.1)
        
        # Should work again
        response = self.client.post('/test-view/', {'data': 'test'})
        self.assertEqual(response.status_code, 200)


class WebhookSecurityTest(TestCase):
    """Test webhook signature verification."""
    
    def setUp(self):
        self.client = Client()
    
    def test_webhook_signature_check_ok(self):
        """Test that webhook signature verification works correctly."""
        # Test with valid signature
        with patch('django.conf.settings.STRIPE_WEBHOOK_SECRET', 'test_secret'):
            # Mock request with valid signature
            request = MagicMock()
            request.META = {'HTTP_STRIPE_SIGNATURE': 't=1234567890,v1=valid_signature'}
            request.body = b'{"test": "data"}'
            
            # Mock hmac comparison to return True
            with patch('hmac.compare_digest', return_value=True):
                with patch('time.time', return_value=1234567890):
                    is_valid, error = verify_stripe_webhook_signature(request)
                    self.assertTrue(is_valid)
                    self.assertIsNone(error)
    
    def test_webhook_signature_check_invalid(self):
        """Test that invalid webhook signatures are rejected."""
        with patch('django.conf.settings.STRIPE_WEBHOOK_SECRET', 'test_secret'):
            # Mock request with invalid signature
            request = MagicMock()
            request.META = {'HTTP_STRIPE_SIGNATURE': 't=1234567890,v1=invalid_signature'}
            request.body = b'{"test": "data"}'
            
            # Mock hmac comparison to return False
            with patch('hmac.compare_digest', return_value=False):
                with patch('time.time', return_value=1234567890):
                    is_valid, error = verify_stripe_webhook_signature(request)
                    self.assertFalse(is_valid)
                    self.assertIn('Invalid signature', error)
    
    def test_webhook_signature_missing(self):
        """Test that missing webhook signatures are rejected."""
        with patch('django.conf.settings.STRIPE_WEBHOOK_SECRET', 'test_secret'):
            request = MagicMock()
            request.META = {}  # No signature header
            request.body = b'{"test": "data"}'
            
            is_valid, error = verify_stripe_webhook_signature(request)
            self.assertFalse(is_valid)
            self.assertIn('Missing Stripe signature', error)
    
    def test_webhook_signature_old_timestamp(self):
        """Test that old webhook signatures are rejected."""
        with patch('django.conf.settings.STRIPE_WEBHOOK_SECRET', 'test_secret'):
            request = MagicMock()
            request.META = {'HTTP_STRIPE_SIGNATURE': 't=1234567890,v1=valid_signature'}
            request.body = b'{"test": "data"}'
            
            # Mock current time to be much later than timestamp
            with patch('time.time', return_value=1234567890 + 400):  # 400 seconds later
                is_valid, error = verify_stripe_webhook_signature(request)
                self.assertFalse(is_valid)
                self.assertIn('Timestamp too old', error)


class LegalPagesTest(APITestCase):
    """Test legal pages endpoints."""
    
    def setUp(self):
        from content.models import Page
        
        # Create test legal pages
        self.terms_page = Page.objects.create(
            title="Terms of Service",
            slug="terms",
            body="These are the terms of service...",
            published=True
        )
        
        self.privacy_page = Page.objects.create(
            title="Privacy Policy",
            slug="privacy",
            body="This is our privacy policy...",
            published=True
        )
    
    def test_legal_pages_ok(self):
        """Test that legal pages endpoints work correctly."""
        # Test terms endpoint
        response = self.client.get('/api/content/public/legal/terms/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], "Terms of Service")
        self.assertEqual(response.data['slug'], "terms")
        
        # Test privacy endpoint
        response = self.client.get('/api/content/public/legal/privacy/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], "Privacy Policy")
        self.assertEqual(response.data['slug'], "privacy")
    
    def test_legal_pages_not_found(self):
        """Test that non-existent legal pages return 404."""
        # Test non-existent page
        response = self.client.get('/api/content/public/legal/nonexistent/')
        self.assertEqual(response.status_code, 404)
    
    def test_legal_pages_unpublished(self):
        """Test that unpublished legal pages return 404."""
        from content.models import Page
        
        # Create unpublished page
        unpublished_page = Page.objects.create(
            title="Unpublished Terms",
            slug="unpublished-terms",
            body="This page is not published...",
            published=False
        )
        
        # Should not be accessible
        response = self.client.get('/api/content/public/legal/unpublished-terms/')
        self.assertEqual(response.status_code, 404)


class SecurityLoggingTest(TestCase):
    """Test security event logging."""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="testpass123"
        )
    
    @patch('common.security.logger')
    def test_log_security_event(self, mock_logger):
        """Test that security events are logged correctly."""
        request = MagicMock()
        request.META = {
            'REMOTE_ADDR': '127.0.0.1',
            'HTTP_USER_AGENT': 'Test Browser'
        }
        
        # Test logging
        log_security_event('test_event', request, {'test': 'data'}, self.user)
        
        # Verify logger was called
        mock_logger.info.assert_called_once()
        call_args = mock_logger.info.call_args
        self.assertEqual(call_args[0][0], "Security event: test_event")
        self.assertIn('test_event', call_args[1]['extra']['event_type'])
        self.assertIn('127.0.0.1', call_args[1]['extra']['ip_address'])
    
    @patch('common.security.logger')
    def test_log_auth_attempt(self, mock_logger):
        """Test that authentication attempts are logged."""
        from common.security import log_auth_attempt
        
        request = MagicMock()
        request.META = {
            'REMOTE_ADDR': '127.0.0.1',
            'HTTP_USER_AGENT': 'Test Browser'
        }
        
        # Test successful login
        log_auth_attempt(request, True, self.user, {'email': 'test@example.com'})
        
        # Verify logger was called
        mock_logger.info.assert_called_once()
        call_args = mock_logger.info.call_args
        self.assertEqual(call_args[0][0], "Security event: login_success")
    
    @patch('common.security.logger')
    def test_log_role_change(self, mock_logger):
        """Test that role changes are logged."""
        from common.security import log_role_change
        
        request = MagicMock()
        request.META = {
            'REMOTE_ADDR': '127.0.0.1',
            'HTTP_USER_AGENT': 'Test Browser'
        }
        
        # Test role change
        log_role_change(request, self.user, ['USER'], ['ADMIN'], {'reason': 'promotion'})
        
        # Verify logger was called
        mock_logger.info.assert_called_once()
        call_args = mock_logger.info.call_args
        self.assertEqual(call_args[0][0], "Security event: role_change")


class SecurityHeadersTest(TestCase):
    """Test security headers middleware."""
    
    def setUp(self):
        self.client = Client()
    
    def test_security_headers_present(self):
        """Test that security headers are present in responses."""
        # Make a simple request
        response = self.client.get('/')
        
        # Check security headers
        self.assertEqual(response['X-Content-Type-Options'], 'nosniff')
        self.assertEqual(response['X-Frame-Options'], 'DENY')
        self.assertEqual(response['X-XSS-Protection'], '1; mode=block')
        self.assertEqual(response['Referrer-Policy'], 'strict-origin-when-cross-origin')
    
    def test_hsts_header_in_production(self):
        """Test that HSTS header is present in production with HTTPS."""
        with patch('django.conf.settings.DEBUG', False):
            with patch('django.test.RequestFactory') as mock_factory:
                # Mock HTTPS request
                request = MagicMock()
                request.is_secure.return_value = True
                
                # Test middleware
                from common.security import SecurityHeadersMiddleware
                middleware = SecurityHeadersMiddleware(lambda req: MagicMock())
                
                response = middleware(request)
                
                # Check HSTS header
                self.assertIn('Strict-Transport-Security', response)


class CookieSecurityTest(TestCase):
    """Test cookie security settings."""
    
    def test_session_cookie_security(self):
        """Test that session cookies have proper security settings."""
        from django.conf import settings
        
        # Check session cookie settings
        self.assertTrue(settings.SESSION_COOKIE_HTTPONLY)
        self.assertEqual(settings.SESSION_COOKIE_SAMESITE, 'Lax')
        self.assertFalse(settings.SESSION_COOKIE_SECURE)  # False in development
    
    def test_csrf_cookie_security(self):
        """Test that CSRF cookies have proper security settings."""
        from django.conf import settings
        
        # Check CSRF cookie settings
        self.assertTrue(settings.CSRF_COOKIE_HTTPONLY)
        self.assertEqual(settings.CSRF_COOKIE_SAMESITE, 'Lax')
        self.assertFalse(settings.CSRF_COOKIE_SECURE)  # False in development


class PasswordSecurityTest(TestCase):
    """Test password security settings."""
    
    def test_password_validators_present(self):
        """Test that password validators are configured."""
        from django.conf import settings
        
        # Check that password validators are present
        self.assertTrue(len(settings.AUTH_PASSWORD_VALIDATORS) > 0)
        
        # Check specific validators
        validator_names = [v['NAME'] for v in settings.AUTH_PASSWORD_VALIDATORS]
        self.assertIn('django.contrib.auth.password_validation.MinimumLengthValidator', validator_names)
        self.assertIn('django.contrib.auth.password_validation.CommonPasswordValidator', validator_names)
    
    def test_password_hashing_default(self):
        """Test that default password hashing is used."""
        from django.conf import settings
        
        # Check that default hashers are used (PBKDF2)
        self.assertIn('django.contrib.auth.hashers.PBKDF2PasswordHasher', settings.PASSWORD_HASHERS[0])
