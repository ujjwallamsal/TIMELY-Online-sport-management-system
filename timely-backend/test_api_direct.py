#!/usr/bin/env python3
"""
Direct API test for Reports Streaming and RBAC permissions.
Tests the API endpoints directly using curl/requests.
"""

import requests
import json
import time
from datetime import datetime

# Test configuration
BASE_URL = "http://127.0.0.1:8000"
API_BASE = f"{BASE_URL}/api"

class DirectAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        
    def get_auth_token(self, email, password='testpass123'):
        """Get authentication token for a user"""
        try:
            response = self.session.post(f"{API_BASE}/auth/login/", {
                'email': email,
                'password': password
            })
            
            if response.status_code == 200:
                token = response.json().get('access')
                self.tokens[email] = token
                return token
            else:
                print(f"  ❌ Login failed for {email}: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"  ❌ Login error for {email}: {e}")
            return None
    
    def test_endpoint(self, endpoint, user_email, expected_status, description):
        """Test a single endpoint with a specific user"""
        token = self.tokens.get(user_email)
        if not token:
            token = self.get_auth_token(user_email)
        
        if not token:
            print(f"  ❌ {description}: No token available")
            return False
        
        headers = {'Authorization': f'Bearer {token}'}
        
        try:
            response = self.session.get(f"{API_BASE}{endpoint}", headers=headers)
            
            if response.status_code == expected_status:
                print(f"  ✅ {description}: {response.status_code}")
                return True
            else:
                print(f"  ❌ {description}: Expected {expected_status}, got {response.status_code}")
                if response.status_code != 404:  # Don't print 404 responses
                    print(f"      Response: {response.text[:200]}")
                return False
        except Exception as e:
            print(f"  ❌ {description}: Error - {e}")
            return False
    
    def test_reports_streaming(self):
        """Test all four streaming CSV endpoints"""
        print("\n📊 Testing Reports Streaming Endpoints...")
        
        # Test users (assuming they exist in the database)
        test_users = [
            ('admin@timely.com', 'Admin'),
            ('organizer@timely.com', 'Organizer'),
            ('coach@timely.com', 'Coach'),
            ('athlete@timely.com', 'Athlete'),
            ('spectator@timely.com', 'Spectator'),
        ]
        
        streaming_endpoints = [
            '/reports/registrations.csv',
            '/reports/fixtures.csv', 
            '/reports/results.csv',
            '/reports/ticket_sales.csv'
        ]
        
        for endpoint in streaming_endpoints:
            print(f"\n🔍 Testing {endpoint}...")
            
            for user_email, user_role in test_users:
                if user_role in ['Admin', 'Organizer']:
                    expected_status = 200
                else:
                    expected_status = 403
                
                self.test_endpoint(
                    endpoint, 
                    user_email, 
                    expected_status,
                    f"{user_role} access to {endpoint.split('/')[-1]}"
                )
            
            # Test with filters
            print(f"  🔍 Testing filters for {endpoint}...")
            self.test_endpoint(
                f"{endpoint}?date_from=2024-01-01&date_to=2024-12-31",
                'admin@timely.com',
                200,
                "Admin filtered query"
            )
    
    def test_rbac_permissions(self):
        """Test RBAC permissions for different user roles"""
        print("\n🔐 Testing RBAC Permissions...")
        
        # Test endpoints for different roles
        test_cases = [
            # (endpoint, user_email, expected_status, description)
            ('/events/', 'organizer@timely.com', 200, 'Organizer can access events'),
            ('/events/', 'coach@timely.com', 200, 'Coach can access events'),
            ('/events/', 'athlete@timely.com', 200, 'Athlete can access events'),
            ('/events/', 'spectator@timely.com', 200, 'Spectator can access events'),
            
            ('/fixtures/', 'coach@timely.com', 200, 'Coach can access fixtures'),
            ('/fixtures/', 'athlete@timely.com', 200, 'Athlete can access fixtures'),
            ('/fixtures/', 'spectator@timely.com', 200, 'Spectator can access fixtures'),
            
            ('/results/', 'coach@timely.com', 200, 'Coach can access results'),
            ('/results/', 'athlete@timely.com', 200, 'Athlete can access results'),
            ('/results/', 'spectator@timely.com', 200, 'Spectator can access results'),
            
            ('/accounts/users/me/', 'athlete@timely.com', 200, 'Athlete can access own profile'),
            ('/accounts/users/me/', 'spectator@timely.com', 200, 'Spectator can access own profile'),
            
            ('/tickets/orders/', 'spectator@timely.com', 200, 'Spectator can access ticket orders'),
        ]
        
        for endpoint, user_email, expected_status, description in test_cases:
            self.test_endpoint(endpoint, user_email, expected_status, description)
    
    def test_permission_overreach(self):
        """Test for permission overreach issues"""
        print("\n🚨 Testing for Permission Overreach...")
        
        # Test cases that should be denied
        overreach_tests = [
            ('/reports/registrations.csv', 'coach@timely.com', 403, 'Coach should not access reports'),
            ('/reports/fixtures.csv', 'athlete@timely.com', 403, 'Athlete should not access reports'),
            ('/reports/results.csv', 'spectator@timely.com', 403, 'Spectator should not access reports'),
            ('/reports/ticket_sales.csv', 'coach@timely.com', 403, 'Coach should not access ticket sales reports'),
        ]
        
        for endpoint, user_email, expected_status, description in overreach_tests:
            self.test_endpoint(endpoint, user_email, expected_status, description)
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Direct API Tests for Reports & RBAC")
        print("=" * 60)
        
        try:
            self.test_reports_streaming()
            self.test_rbac_permissions()
            self.test_permission_overreach()
            
            print("\n" + "=" * 60)
            print("✅ All tests completed!")
            
        except Exception as e:
            print(f"\n❌ Test failed with error: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    tester = DirectAPITester()
    tester.run_all_tests()
