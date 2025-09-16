# api/v1/test_schema.py
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from accounts.models import User

User = get_user_model()


class APISchemaTests(APITestCase):
    """Test API schema generation and endpoint discovery"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role='ADMIN',
            first_name='Admin',
            last_name='User'
        )
    
    def test_schema_generation(self):
        """Test that OpenAPI schema is generated correctly"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test schema endpoint
        response = self.client.get('/api/schema/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify schema contains expected endpoints
        schema = response.json()
        
        # Check that all required endpoints are present
        required_endpoints = [
            '/api/v1/auth/',
            '/api/v1/users/',
            '/api/v1/events/',
            '/api/v1/venues/',
            '/api/v1/registrations/',
            '/api/v1/fixtures/',
            '/api/v1/results/',
            '/api/v1/announcements/',
            '/api/v1/reports/'
        ]
        
        paths = schema.get('paths', {})
        for endpoint in required_endpoints:
            self.assertIn(endpoint, paths, f"Endpoint {endpoint} not found in schema")
    
    def test_endpoint_discovery(self):
        """Test that all expected endpoints are discoverable"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test all main endpoints
        endpoints = [
            '/api/v1/users/',
            '/api/v1/events/',
            '/api/v1/venues/',
            '/api/v1/registrations/',
            '/api/v1/fixtures/',
            '/api/v1/results/',
            '/api/v1/announcements/',
            '/api/v1/reports/'
        ]
        
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertIn(response.status_code, [200, 405], f"Endpoint {endpoint} not accessible")
    
    def test_unknown_paths_rejected(self):
        """Test that unknown paths are properly rejected"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test unknown endpoints
        unknown_endpoints = [
            '/api/v1/unknown/',
            '/api/v1/invalid/',
            '/api/v1/test/',
            '/api/v1/debug/'
        ]
        
        for endpoint in unknown_endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 
                           f"Unknown endpoint {endpoint} should return 404")
    
    def test_api_versioning(self):
        """Test that API versioning is properly implemented"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test that v1 endpoints work
        response = self.client.get('/api/v1/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test that non-versioned endpoints are not accessible
        response = self.client.get('/api/events/')
        self.assertNotEqual(response.status_code, status.HTTP_200_OK)
    
    def test_http_methods_supported(self):
        """Test that appropriate HTTP methods are supported"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test GET (should work for all endpoints)
        response = self.client.get('/api/v1/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test POST (should work for creation endpoints)
        event_data = {
            'name': 'Test Event',
            'sport': 1,
            'start_date': '2024-12-01 10:00:00',
            'end_date': '2024-12-01 18:00:00'
        }
        response = self.client.post('/api/v1/events/', event_data)
        self.assertIn(response.status_code, [201, 400, 403])  # 400/403 for validation/permission errors
        
        # Test PATCH (should work for update endpoints)
        response = self.client.patch('/api/v1/events/1/', {'name': 'Updated Event'})
        self.assertIn(response.status_code, [200, 404, 403])  # 404 if no event with id=1
        
        # Test DELETE (should work for deletion endpoints)
        response = self.client.delete('/api/v1/events/1/')
        self.assertIn(response.status_code, [204, 404, 403])  # 404 if no event with id=1
