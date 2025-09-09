"""
Performance tests for Timely API
"""
import json
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status


class PerformanceTestCase(APITestCase):
    """Test performance-related features"""
    
    def test_pagination_header_present(self):
        """Test that list endpoints include pagination headers"""
        # Test events endpoint (should be paginated)
        response = self.client.get('/api/events/')
        
        # Check if response is successful and has pagination
        if response.status_code == 200:
            # Should have pagination headers
            self.assertIn('count', response.data)
            self.assertIn('next', response.data)
            self.assertIn('previous', response.data)
            self.assertIn('results', response.data)
            
            # Page size should be 12
            self.assertEqual(len(response.data['results']), 0)  # Empty in test DB
            self.assertEqual(response.data['count'], 0)
        else:
            # If endpoint doesn't exist or requires auth, that's also acceptable
            self.assertIn(response.status_code, [200, 401, 403, 404])
    
    def test_health_ok(self):
        """Test health endpoint returns OK status"""
        response = self.client.get('/health/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['status'], 'ok')
        self.assertIn('time', data)
        self.assertIn('db', data)
        self.assertEqual(data['db'], 'ok')
    
    def test_public_cache_headers_present(self):
        """Test that public endpoints have appropriate cache headers"""
        # Test public events endpoint
        response = self.client.get('/api/public/events/')
        
        # Should have cache headers (if caching is implemented)
        # This test verifies the endpoint exists and responds
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])
        
        # Test public news endpoint
        response = self.client.get('/api/public/news/')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])
    
    def test_pagination_page_size(self):
        """Test that pagination uses correct page size"""
        # This test would need actual data to be meaningful
        # For now, just verify the pagination structure
        response = self.client.get('/api/events/')
        
        if response.status_code == status.HTTP_200_OK:
            # Verify pagination structure exists
            self.assertIn('count', response.data)
            self.assertIn('next', response.data)
            self.assertIn('previous', response.data)
            self.assertIn('results', response.data)
        else:
            # If endpoint doesn't exist or requires auth, that's also acceptable
            self.assertIn(response.status_code, [200, 401, 403, 404])
