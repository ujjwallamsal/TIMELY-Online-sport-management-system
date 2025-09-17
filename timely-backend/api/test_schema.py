# api/test_schema.py - Schema Snapshot Test for Strict Route Budget
import json
import os
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status


class SchemaSnapshotTest(TestCase):
    """Test that API schema matches expected route budget"""
    
    def setUp(self):
        self.client = APIClient()
        self.schema_url = reverse('schema')
        self.expected_routes_file = os.path.join(
            os.path.dirname(__file__), 
            '..', 
            '..', 
            'audit', 
            'expected_routes.json'
        )
    
    def test_schema_route_budget(self):
        """Test that API schema contains only expected routes"""
        response = self.client.get(self.schema_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        schema_data = response.json()
        actual_routes = self._extract_routes_from_schema(schema_data)
        
        # Load expected routes
        if os.path.exists(self.expected_routes_file):
            with open(self.expected_routes_file, 'r') as f:
                expected_routes = json.load(f)
        else:
            # Create expected routes file if it doesn't exist
            expected_routes = self._create_expected_routes()
            os.makedirs(os.path.dirname(self.expected_routes_file), exist_ok=True)
            with open(self.expected_routes_file, 'w') as f:
                json.dump(expected_routes, f, indent=2)
        
        # Compare routes
        self._assert_routes_match(actual_routes, expected_routes)
    
    def _extract_routes_from_schema(self, schema_data):
        """Extract routes from OpenAPI schema"""
        routes = set()
        
        if 'paths' in schema_data:
            for path, methods in schema_data['paths'].items():
                for method in methods.keys():
                    if method.upper() in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']:
                        routes.add(f"{method.upper()} {path}")
        
        return sorted(routes)
    
    def _create_expected_routes(self):
        """Create expected routes based on current API structure"""
        return {
            "description": "Expected API routes for strict budget control",
            "max_routes": 50,  # Maximum allowed routes
            "routes": [
                # Authentication
                "POST /api/auth/login/",
                "POST /api/auth/register/",
                "POST /api/auth/refresh/",
                "POST /api/auth/logout/",
                
                # Users
                "GET /api/users/",
                "POST /api/users/",
                "GET /api/users/{id}/",
                "PATCH /api/users/{id}/",
                "DELETE /api/users/{id}/",
                "GET /api/users/me/",
                "PATCH /api/users/me/",
                
                # Events
                "GET /api/events/",
                "POST /api/events/",
                "GET /api/events/{id}/",
                "PATCH /api/events/{id}/",
                "DELETE /api/events/{id}/",
                "POST /api/events/{id}/publish/",
                "POST /api/events/{id}/unpublish/",
                "POST /api/events/{id}/cancel/",
                "GET /api/events/{id}/registrations/",
                "GET /api/events/{id}/fixtures/",
                "POST /api/events/{id}/fixtures/generate/",
                "GET /api/events/{id}/leaderboard/",
                "POST /api/events/{id}/announce/",
                "GET /api/events/{id}/announcements/",
                
                # Venues
                "GET /api/venues/",
                "POST /api/venues/",
                "GET /api/venues/{id}/",
                "PATCH /api/venues/{id}/",
                "DELETE /api/venues/{id}/",
                
                # Sports
                "GET /api/sports/",
                "POST /api/sports/",
                "GET /api/sports/{id}/",
                "PATCH /api/sports/{id}/",
                "DELETE /api/sports/{id}/",
                
                # Teams
                "GET /api/teams/",
                "POST /api/teams/",
                "GET /api/teams/{id}/",
                "PATCH /api/teams/{id}/",
                "DELETE /api/teams/{id}/",
                
                # Registrations
                "GET /api/registrations/",
                "POST /api/registrations/",
                "GET /api/registrations/{id}/",
                "PATCH /api/registrations/{id}/",
                "DELETE /api/registrations/{id}/",
                "POST /api/registrations/{id}/approve/",
                "POST /api/registrations/{id}/reject/",
                
                # Fixtures
                "GET /api/fixtures/",
                "POST /api/fixtures/",
                "GET /api/fixtures/{id}/",
                "PATCH /api/fixtures/{id}/",
                "DELETE /api/fixtures/{id}/",
                "POST /api/fixtures/{id}/result/",
                
                # Results
                "GET /api/results/",
                "POST /api/results/",
                "GET /api/results/{id}/",
                "PATCH /api/results/{id}/",
                "DELETE /api/results/{id}/",
                "POST /api/results/{id}/lock/",
                
                # Notifications
                "GET /api/notifications/",
                "PATCH /api/notifications/{id}/",
                
                # Announcements
                "GET /api/announcements/",
                "POST /api/announcements/",
                "GET /api/announcements/{id}/",
                "PATCH /api/announcements/{id}/",
                "DELETE /api/announcements/{id}/",
                
                # Reports
                "GET /api/reports/",
                "POST /api/reports/",
                "GET /api/reports/{id}/",
                "PATCH /api/reports/{id}/",
                "DELETE /api/reports/{id}/",
                
                # Public endpoints
                "GET /api/public/events/",
                "GET /api/public/events/{id}/",
                "GET /api/public/events/{id}/fixtures/",
                "GET /api/public/events/{id}/results/",
                "GET /api/public/events/{id}/leaderboard/",
                
                # Health
                "GET /api/health/",
            ]
        }
    
    def _assert_routes_match(self, actual_routes, expected_data):
        """Assert that actual routes match expected routes"""
        expected_routes = set(expected_data.get('routes', []))
        max_routes = expected_data.get('max_routes', 50)
        
        # Check route count
        self.assertLessEqual(
            len(actual_routes), 
            max_routes, 
            f"Route count {len(actual_routes)} exceeds maximum {max_routes}"
        )
        
        # Check for unexpected routes
        unexpected_routes = set(actual_routes) - expected_routes
        if unexpected_routes:
            self.fail(f"Unexpected routes found: {sorted(unexpected_routes)}")
        
        # Check for missing expected routes
        missing_routes = expected_routes - set(actual_routes)
        if missing_routes:
            self.fail(f"Missing expected routes: {sorted(missing_routes)}")
    
    def test_route_count_budget(self):
        """Test that route count stays within budget"""
        response = self.client.get(self.schema_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        schema_data = response.json()
        actual_routes = self._extract_routes_from_schema(schema_data)
        
        # Strict budget: maximum 50 routes
        self.assertLessEqual(len(actual_routes), 50, 
                           f"API has {len(actual_routes)} routes, maximum allowed is 50")
        
        # Log current route count for monitoring
        print(f"Current API route count: {len(actual_routes)}")
        for route in sorted(actual_routes):
            print(f"  {route}")
