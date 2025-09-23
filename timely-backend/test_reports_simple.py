#!/usr/bin/env python3
"""
Simple test script for Reports Streaming and RBAC permissions.
Tests the API endpoints directly without complex data setup.
"""

import os
import sys
import django
import requests
import json
from datetime import datetime, timedelta

# Setup Django
sys.path.append('/Users/ujjwallamsal/Desktop/CAPSTONE/timely-backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timely.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import UserRole

User = get_user_model()

# Test configuration
BASE_URL = "http://127.0.0.1:8000"
API_BASE = f"{BASE_URL}/api"

class SimpleReportsRBACTester:
    def __init__(self):
        self.session = requests.Session()
        
    def create_test_user(self, email, role, is_staff=False, is_superuser=False):
        """Create a simple test user"""
        try:
            user = User.objects.get(email=email)
            return user
        except User.DoesNotExist:
            first_name, last_name = email.split('@')[0].split('.', 1) if '.' in email.split('@')[0] else (email.split('@')[0], '')
            user = User.objects.create_user(
                email=email,
                username=email.split('@')[0],
                first_name=first_name,
                last_name=last_name,
                password='testpass123',
                is_staff=is_staff,
                is_superuser=is_superuser,
                role=role.upper(),
            )
            
            # Create RBAC role if not admin
            if role != 'admin':
                UserRole.objects.get_or_create(
                    user=user,
                    role_type=role.upper(),
                    defaults={'is_active': True}
                )
            
            return user
    
    def authenticate_user(self, user):
        """Authenticate a user"""
        try:
            from accounts.tokens import create_access_token
            token = create_access_token(user)
            self.session.headers.update({'Authorization': f'Bearer {token}'})
            return True
        except Exception as e:
            print(f"  ❌ Authentication failed: {e}")
            return False
    
    def test_reports_streaming(self):
        """Test all four streaming CSV endpoints"""
        print("\n📊 Testing Reports Streaming Endpoints...")
        
        # Create test users
        admin = self.create_test_user('admin@test.com', 'admin', is_staff=True, is_superuser=True)
        organizer = self.create_test_user('organizer@test.com', 'organizer')
        coach = self.create_test_user('coach@test.com', 'coach')
        athlete = self.create_test_user('athlete@test.com', 'athlete')
        spectator = self.create_test_user('spectator@test.com', 'spectator')
        
        streaming_endpoints = [
            'registrations.csv',
            'fixtures.csv', 
            'results.csv',
            'ticket_sales.csv'
        ]
        
        for endpoint in streaming_endpoints:
            print(f"\n🔍 Testing {endpoint}...")
            
            # Test with admin user (should work)
            if self.authenticate_user(admin):
                response = self.session.get(f"{API_BASE}/reports/{endpoint}")
                
                if response.status_code == 200:
                    print(f"  ✅ Admin access to {endpoint}: SUCCESS")
                    print(f"  📄 Content-Type: {response.headers.get('Content-Type', 'Unknown')}")
                    print(f"  📊 Content-Length: {len(response.content)} bytes")
                else:
                    print(f"  ❌ Admin access to {endpoint}: FAILED ({response.status_code})")
                    print(f"  📝 Response: {response.text[:200]}")
            
            # Test with organizer (should work)
            if self.authenticate_user(organizer):
                response = self.session.get(f"{API_BASE}/reports/{endpoint}")
                
                if response.status_code == 200:
                    print(f"  ✅ Organizer access to {endpoint}: SUCCESS")
                else:
                    print(f"  ❌ Organizer access to {endpoint}: FAILED ({response.status_code})")
            
            # Test with coach (should fail - 403)
            if self.authenticate_user(coach):
                response = self.session.get(f"{API_BASE}/reports/{endpoint}")
                
                if response.status_code == 403:
                    print(f"  ✅ Coach access to {endpoint}: CORRECTLY DENIED (403)")
                else:
                    print(f"  ❌ Coach access to {endpoint}: SHOULD BE DENIED ({response.status_code})")
            
            # Test with athlete (should fail - 403)
            if self.authenticate_user(athlete):
                response = self.session.get(f"{API_BASE}/reports/{endpoint}")
                
                if response.status_code == 403:
                    print(f"  ✅ Athlete access to {endpoint}: CORRECTLY DENIED (403)")
                else:
                    print(f"  ❌ Athlete access to {endpoint}: SHOULD BE DENIED ({response.status_code})")
            
            # Test with spectator (should fail - 403)
            if self.authenticate_user(spectator):
                response = self.session.get(f"{API_BASE}/reports/{endpoint}")
                
                if response.status_code == 403:
                    print(f"  ✅ Spectator access to {endpoint}: CORRECTLY DENIED (403)")
                else:
                    print(f"  ❌ Spectator access to {endpoint}: SHOULD BE DENIED ({response.status_code})")
            
            # Test filters
            if self.authenticate_user(admin):
                response = self.session.get(f"{API_BASE}/reports/{endpoint}?date_from=2024-01-01&date_to=2024-12-31")
                
                if response.status_code == 200:
                    print(f"  ✅ Filtered query for {endpoint}: SUCCESS")
                else:
                    print(f"  ❌ Filtered query for {endpoint}: FAILED ({response.status_code})")
    
    def test_rbac_permissions(self):
        """Test RBAC permissions for different user roles"""
        print("\n🔐 Testing RBAC Permissions...")
        
        # Create test users
        admin = self.create_test_user('admin@test.com', 'admin', is_staff=True, is_superuser=True)
        organizer = self.create_test_user('organizer@test.com', 'organizer')
        coach = self.create_test_user('coach@test.com', 'coach')
        athlete = self.create_test_user('athlete@test.com', 'athlete')
        spectator = self.create_test_user('spectator@test.com', 'spectator')
        
        # Test Organizer permissions
        print("\n👤 Testing Organizer Permissions...")
        if self.authenticate_user(organizer):
            response = self.session.get(f"{API_BASE}/events/")
            if response.status_code == 200:
                events = response.json()
                print(f"  ✅ Organizer can see {len(events)} events")
            else:
                print(f"  ❌ Organizer cannot access events list: {response.status_code}")
        
        # Test Coach permissions
        print("\n👨‍🏫 Testing Coach Permissions...")
        if self.authenticate_user(coach):
            response = self.session.get(f"{API_BASE}/fixtures/")
            if response.status_code == 200:
                fixtures = response.json()
                print(f"  ✅ Coach can see {len(fixtures)} fixtures")
            else:
                print(f"  ❌ Coach cannot access fixtures: {response.status_code}")
        
        # Test Athlete permissions
        print("\n🏃‍♂️ Testing Athlete Permissions...")
        if self.authenticate_user(athlete):
            response = self.session.get(f"{API_BASE}/accounts/users/me/")
            if response.status_code == 200:
                profile = response.json()
                print(f"  ✅ Athlete can see their profile: {profile.get('email', 'Unknown')}")
            else:
                print(f"  ❌ Athlete cannot access their profile: {response.status_code}")
        
        # Test Spectator permissions
        print("\n👀 Testing Spectator Permissions...")
        if self.authenticate_user(spectator):
            response = self.session.get(f"{API_BASE}/events/")
            if response.status_code == 200:
                events = response.json()
                print(f"  ✅ Spectator can see {len(events)} events")
            else:
                print(f"  ❌ Spectator cannot access events: {response.status_code}")
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Simple Reports & RBAC Tests")
        print("=" * 60)
        
        try:
            self.test_reports_streaming()
            self.test_rbac_permissions()
            
            print("\n" + "=" * 60)
            print("✅ All tests completed!")
            
        except Exception as e:
            print(f"\n❌ Test failed with error: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    tester = SimpleReportsRBACTester()
    tester.run_all_tests()
