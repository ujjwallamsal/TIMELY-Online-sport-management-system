# api/tests/test_schema.py
import json
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status


class SchemaTest(TestCase):
    """Test schema generation and enforce strict route budget"""
    
    def setUp(self):
        self.client = APIClient()
        self.schema_url = reverse('schema')
    
    def test_schema_generation(self):
        """Test that schema can be generated without errors"""
        response = self.client.get(self.schema_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        schema_data = response.json()
        self.assertIn('openapi', schema_data)
        self.assertIn('paths', schema_data)
    
    def test_strict_route_budget(self):
        """Test that we don't exceed the expected route budget"""
        response = self.client.get(self.schema_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        schema_data = response.json()
        paths = schema_data.get('paths', {})
        
        # Define expected route budget - these are the only routes we should have
        expected_routes = {
            # Core API routes
            '/api/users/',
            '/api/users/{id}/',
            '/api/events/',
            '/api/events/{id}/',
            '/api/venues/',
            '/api/venues/{id}/',
            '/api/registrations/',
            '/api/registrations/{id}/',
            '/api/fixtures/',
            '/api/fixtures/{id}/',
            '/api/results/',
            '/api/results/{id}/',
            '/api/announcements/',
            '/api/announcements/{id}/',
            '/api/reports/',
            
            # Event-specific routes
            '/api/events/{event_id}/registrations/',
            '/api/events/{event_id}/fixtures/',
            '/api/events/{event_id}/fixtures/generate/',
            '/api/events/{event_id}/leaderboard/',
            '/api/events/{event_id}/announce/',
            '/api/events/{event_id}/announcements/',
            '/api/events/{event_id}/cancel/',
            
            # Fixture-specific routes
            '/api/fixtures/{fixture_id}/result/',
            
            # Result-specific routes
            '/api/results/{result_id}/lock/',
            
            # Registration-specific routes
            '/api/registrations/{registration_id}/approve/',
            '/api/registrations/{registration_id}/reject/',
            
            # Auth routes (from accounts app)
            '/api/accounts/login/',
            '/api/accounts/logout/',
            '/api/accounts/register/',
            '/api/accounts/verify-email/',
            '/api/accounts/reset-password/',
            '/api/accounts/change-password/',
            '/api/accounts/profile/',
            
            # Public routes
            '/api/public/events/',
            '/api/public/venues/',
            '/api/public/announcements/',
            
            # Health and docs
            '/health/',
            '/admin/',
            '/api/schema/',
            '/api/docs/',
        }
        
        # Get all actual routes
        actual_routes = set(paths.keys())
        
        # Check for unexpected routes
        unexpected_routes = actual_routes - expected_routes
        if unexpected_routes:
            self.fail(
                f"Unexpected routes found: {unexpected_routes}. "
                f"Total routes: {len(actual_routes)}, Expected: {len(expected_routes)}. "
                f"This violates the strict route budget. Remove these routes or update the test."
            )
        
        # Check for missing expected routes (optional - some might be conditionally included)
        missing_routes = expected_routes - actual_routes
        if missing_routes:
            print(f"Warning: Expected routes not found: {missing_routes}")
    
    def test_no_duplicate_routes(self):
        """Test that there are no duplicate routes"""
        response = self.client.get(self.schema_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        schema_data = response.json()
        paths = schema_data.get('paths', {})
        
        # Check for duplicate routes (case-insensitive)
        route_counts = {}
        for route in paths.keys():
            route_lower = route.lower()
            route_counts[route_lower] = route_counts.get(route_lower, 0) + 1
        
        duplicates = {route: count for route, count in route_counts.items() if count > 1}
        if duplicates:
            self.fail(f"Duplicate routes found: {duplicates}")
    
    def test_route_consistency(self):
        """Test that routes follow consistent patterns"""
        response = self.client.get(self.schema_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        schema_data = response.json()
        paths = schema_data.get('paths', {})
        
        # Check that all API routes start with /api/
        api_routes = [route for route in paths.keys() if route.startswith('/api/')]
        non_api_routes = [route for route in paths.keys() if not route.startswith('/api/')]
        
        # Non-API routes should only be health, admin, and docs
        allowed_non_api = {'/health/', '/admin/', '/api/schema/', '/api/docs/'}
        unexpected_non_api = set(non_api_routes) - allowed_non_api
        
        if unexpected_non_api:
            self.fail(f"Unexpected non-API routes: {unexpected_non_api}")
    
    def test_schema_validation(self):
        """Test that the generated schema is valid OpenAPI 3.0"""
        response = self.client.get(self.schema_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        schema_data = response.json()
        
        # Basic OpenAPI 3.0 structure validation
        required_fields = ['openapi', 'info', 'paths']
        for field in required_fields:
            self.assertIn(field, schema_data, f"Missing required field: {field}")
        
        # Check OpenAPI version
        self.assertTrue(schema_data['openapi'].startswith('3.0'))
        
        # Check info structure
        info = schema_data.get('info', {})
        self.assertIn('title', info)
        self.assertIn('version', info)
        
        # Check paths structure
        paths = schema_data.get('paths', {})
        self.assertIsInstance(paths, dict)
        
        # Check that each path has at least one HTTP method
        for path, methods in paths.items():
            self.assertIsInstance(methods, dict)
            self.assertTrue(len(methods) > 0, f"Path {path} has no HTTP methods")
            
            # Check that methods are valid HTTP methods
            valid_methods = {'get', 'post', 'put', 'patch', 'delete', 'head', 'options'}
            for method in methods.keys():
                self.assertIn(method.lower(), valid_methods, 
                            f"Invalid HTTP method {method} in path {path}")
