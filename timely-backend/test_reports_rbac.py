#!/usr/bin/env python3
"""
Comprehensive test script for Reports Streaming and RBAC permissions.
Tests all four streaming endpoints and verifies proper role-based access control.
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
from events.models import Event
from teams.models import Team, TeamMember
from fixtures.models import Fixture
from results.models import Result
from tickets.models import TicketOrder, Ticket
from registrations.models import Registration

User = get_user_model()

# Test configuration
BASE_URL = "http://127.0.0.1:8000"
API_BASE = f"{BASE_URL}/api"

class TestReportsRBAC:
    def __init__(self):
        self.session = requests.Session()
        self.test_users = {}
        self.test_events = {}
        self.test_teams = {}
        self.test_fixtures = {}
        self.test_results = {}
        self.test_orders = {}
        
    def setup_test_data(self):
        """Create test data for comprehensive testing"""
        print("🔧 Setting up test data...")
        
        # Create test users with different roles
        self.test_users = {
            'admin': self.create_user('admin@test.com', 'Admin User', 'admin', is_staff=True, is_superuser=True),
            'organizer1': self.create_user('organizer1@test.com', 'Organizer 1', 'organizer'),
            'organizer2': self.create_user('organizer2@test.com', 'Organizer 2', 'organizer'),
            'coach1': self.create_user('coach1@test.com', 'Coach 1', 'coach'),
            'coach2': self.create_user('coach2@test.com', 'Coach 2', 'coach'),
            'athlete1': self.create_user('athlete1@test.com', 'Athlete 1', 'athlete'),
            'athlete2': self.create_user('athlete2@test.com', 'Athlete 2', 'athlete'),
            'spectator1': self.create_user('spectator1@test.com', 'Spectator 1', 'spectator'),
            'spectator2': self.create_user('spectator2@test.com', 'Spectator 2', 'spectator'),
        }
        
        # Create test events
        self.test_events = {
            'event1': self.create_event('Test Event 1', self.test_users['organizer1']),
            'event2': self.create_event('Test Event 2', self.test_users['organizer2']),
        }
        
        # Create test teams
        self.test_teams = {
            'team1': self.create_team('Team 1', self.test_events['event1'], self.test_users['coach1']),
            'team2': self.create_team('Team 2', self.test_events['event1'], self.test_users['coach2']),
        }
        
        # Add athletes to teams
        self.add_team_member(self.test_teams['team1'], self.test_users['athlete1'])
        self.add_team_member(self.test_teams['team2'], self.test_users['athlete2'])
        
        # Create test fixtures
        self.test_fixtures = {
            'fixture1': self.create_fixture(self.test_events['event1'], self.test_teams['team1'], self.test_teams['team2']),
        }
        
        # Create test results
        self.test_results = {
            'result1': self.create_result(self.test_fixtures['fixture1'], 2, 1, self.test_teams['team1']),
        }
        
        # Create test registrations
        self.create_registration(self.test_events['event1'], self.test_users['athlete1'], self.test_teams['team1'])
        self.create_registration(self.test_events['event1'], self.test_users['athlete2'], self.test_teams['team2'])
        
        # Create test ticket orders
        self.test_orders = {
            'order1': self.create_ticket_order(self.test_users['spectator1'], self.test_events['event1']),
            'order2': self.create_ticket_order(self.test_users['spectator2'], self.test_events['event2']),
        }
        
        print("✅ Test data setup complete")
    
    def create_user(self, email, name, role, is_staff=False, is_superuser=False):
        """Create a test user with specified role"""
        first_name, last_name = name.split(' ', 1) if ' ' in name else (name, '')
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'is_staff': is_staff,
                'is_superuser': is_superuser,
                'is_active': True,
                'role': role.upper(),
            }
        )
        
        if created and role != 'admin':
            # Create RBAC role
            UserRole.objects.get_or_create(
                user=user,
                role_type=role.upper(),
                defaults={'is_active': True}
            )
        
        return user
    
    def create_event(self, name, organizer):
        """Create a test event"""
        from django.utils import timezone
        now = timezone.now()
        event, created = Event.objects.get_or_create(
            name=name,
            defaults={
                'sport': 'Basketball',
                'description': f'Test event: {name}',
                'start_datetime': now,
                'end_datetime': now + timedelta(days=7),
                'capacity': 100,
                'created_by': organizer,
                'status': Event.Status.UPCOMING,
                'visibility': 'PUBLIC',
            }
        )
        return event
    
    def create_team(self, name, event, coach):
        """Create a test team"""
        team, created = Team.objects.get_or_create(
            name=name,
            event=event,
            defaults={
                'manager': coach,  # Use coach as manager for simplicity
                'coach': coach,
                'description': f'Test team: {name}',
            }
        )
        return team
    
    def add_team_member(self, team, athlete):
        """Add athlete to team"""
        TeamMember.objects.get_or_create(
            team=team,
            athlete=athlete,
            defaults={'is_active': True}
        )
    
    def create_fixture(self, event, home_team, away_team):
        """Create a test fixture"""
        fixture, created = Fixture.objects.get_or_create(
            event=event,
            home=home_team,
            away=away_team,
            defaults={
                'start_at': datetime.now() + timedelta(hours=1),
                'end_at': datetime.now() + timedelta(hours=3),
                'round': 1,
                'phase': 'GROUP',
                'status': 'SCHEDULED',
            }
        )
        return fixture
    
    def create_result(self, fixture, home_score, away_score, winner):
        """Create a test result"""
        result, created = Result.objects.get_or_create(
            fixture=fixture,
            defaults={
                'home_score': home_score,
                'away_score': away_score,
                'winner': winner,
                'status': 'FINALIZED',
                'finalized_at': datetime.now(),
            }
        )
        return result
    
    def create_registration(self, event, applicant, team):
        """Create a test registration"""
        registration, created = Registration.objects.get_or_create(
            event=event,
            applicant=applicant,
            team=team,
            defaults={
                'type': 'TEAM',
                'status': 'APPROVED',
                'submitted_at': datetime.now(),
            }
        )
        return registration
    
    def create_ticket_order(self, user, event):
        """Create a test ticket order"""
        order, created = TicketOrder.objects.get_or_create(
            user=user,
            event=event,
            defaults={
                'total_cents': 5000,  # $50.00
                'currency': 'USD',
                'status': 'PAID',
                'payment_provider': 'stripe',
            }
        )
        return order
    
    def authenticate_user(self, user):
        """Authenticate a user and return session"""
        # Get auth token
        auth_response = self.session.post(f"{API_BASE}/auth/login/", {
            'email': user.email,
            'password': 'testpass123'  # Assuming default password
        })
        
        if auth_response.status_code == 200:
            token = auth_response.json().get('access')
            self.session.headers.update({'Authorization': f'Bearer {token}'})
            return True
        else:
            # Try to get token directly if login fails
            from accounts.tokens import create_access_token
            token = create_access_token(user)
            self.session.headers.update({'Authorization': f'Bearer {token}'})
            return True
    
    def test_reports_streaming(self):
        """Test all four streaming CSV endpoints"""
        print("\n📊 Testing Reports Streaming Endpoints...")
        
        streaming_endpoints = [
            'registrations.csv',
            'fixtures.csv', 
            'results.csv',
            'ticket_sales.csv'
        ]
        
        for endpoint in streaming_endpoints:
            print(f"\n🔍 Testing {endpoint}...")
            
            # Test with admin user (should work)
            self.authenticate_user(self.test_users['admin'])
            response = self.session.get(f"{API_BASE}/reports/{endpoint}?event={self.test_events['event1'].id}")
            
            if response.status_code == 200:
                print(f"  ✅ Admin access to {endpoint}: SUCCESS")
                print(f"  📄 Content-Type: {response.headers.get('Content-Type', 'Unknown')}")
                print(f"  📊 Content-Length: {len(response.content)} bytes")
            else:
                print(f"  ❌ Admin access to {endpoint}: FAILED ({response.status_code})")
                print(f"  📝 Response: {response.text[:200]}")
            
            # Test with organizer1 (should work for their event)
            self.authenticate_user(self.test_users['organizer1'])
            response = self.session.get(f"{API_BASE}/reports/{endpoint}?event={self.test_events['event1'].id}")
            
            if response.status_code == 200:
                print(f"  ✅ Organizer1 access to {endpoint}: SUCCESS")
            else:
                print(f"  ❌ Organizer1 access to {endpoint}: FAILED ({response.status_code})")
            
            # Test with organizer2 (should work for their event)
            self.authenticate_user(self.test_users['organizer2'])
            response = self.session.get(f"{API_BASE}/reports/{endpoint}?event={self.test_events['event2'].id}")
            
            if response.status_code == 200:
                print(f"  ✅ Organizer2 access to {endpoint}: SUCCESS")
            else:
                print(f"  ❌ Organizer2 access to {endpoint}: FAILED ({response.status_code})")
            
            # Test with coach (should fail - 403)
            self.authenticate_user(self.test_users['coach1'])
            response = self.session.get(f"{API_BASE}/reports/{endpoint}?event={self.test_events['event1'].id}")
            
            if response.status_code == 403:
                print(f"  ✅ Coach access to {endpoint}: CORRECTLY DENIED (403)")
            else:
                print(f"  ❌ Coach access to {endpoint}: SHOULD BE DENIED ({response.status_code})")
            
            # Test with athlete (should fail - 403)
            self.authenticate_user(self.test_users['athlete1'])
            response = self.session.get(f"{API_BASE}/reports/{endpoint}?event={self.test_events['event1'].id}")
            
            if response.status_code == 403:
                print(f"  ✅ Athlete access to {endpoint}: CORRECTLY DENIED (403)")
            else:
                print(f"  ❌ Athlete access to {endpoint}: SHOULD BE DENIED ({response.status_code})")
            
            # Test with spectator (should fail - 403)
            self.authenticate_user(self.test_users['spectator1'])
            response = self.session.get(f"{API_BASE}/reports/{endpoint}?event={self.test_events['event1'].id}")
            
            if response.status_code == 403:
                print(f"  ✅ Spectator access to {endpoint}: CORRECTLY DENIED (403)")
            else:
                print(f"  ❌ Spectator access to {endpoint}: SHOULD BE DENIED ({response.status_code})")
            
            # Test filters
            self.authenticate_user(self.test_users['admin'])
            response = self.session.get(f"{API_BASE}/reports/{endpoint}?event={self.test_events['event1'].id}&date_from=2024-01-01&date_to=2024-12-31")
            
            if response.status_code == 200:
                print(f"  ✅ Filtered query for {endpoint}: SUCCESS")
            else:
                print(f"  ❌ Filtered query for {endpoint}: FAILED ({response.status_code})")
    
    def test_rbac_permissions(self):
        """Test RBAC permissions for different user roles"""
        print("\n🔐 Testing RBAC Permissions...")
        
        # Test Organizer permissions
        print("\n👤 Testing Organizer Permissions...")
        self.authenticate_user(self.test_users['organizer1'])
        
        # Organizer should see their own events
        response = self.session.get(f"{API_BASE}/events/")
        if response.status_code == 200:
            events = response.json()
            organizer_events = [e for e in events if e.get('created_by') == self.test_users['organizer1'].id]
            print(f"  ✅ Organizer1 can see {len(organizer_events)} of their own events")
        else:
            print(f"  ❌ Organizer1 cannot access events list: {response.status_code}")
        
        # Test Coach permissions
        print("\n👨‍🏫 Testing Coach Permissions...")
        self.authenticate_user(self.test_users['coach1'])
        
        # Coach should see fixtures for their team's events
        response = self.session.get(f"{API_BASE}/fixtures/")
        if response.status_code == 200:
            fixtures = response.json()
            print(f"  ✅ Coach1 can see {len(fixtures)} fixtures")
        else:
            print(f"  ❌ Coach1 cannot access fixtures: {response.status_code}")
        
        # Coach should see results for their team's events
        response = self.session.get(f"{API_BASE}/results/")
        if response.status_code == 200:
            results = response.json()
            print(f"  ✅ Coach1 can see {len(results)} results")
        else:
            print(f"  ❌ Coach1 cannot access results: {response.status_code}")
        
        # Test Athlete permissions
        print("\n🏃‍♂️ Testing Athlete Permissions...")
        self.authenticate_user(self.test_users['athlete1'])
        
        # Athlete should see their own profile
        response = self.session.get(f"{API_BASE}/accounts/users/me/")
        if response.status_code == 200:
            profile = response.json()
            print(f"  ✅ Athlete1 can see their profile: {profile.get('email', 'Unknown')}")
        else:
            print(f"  ❌ Athlete1 cannot access their profile: {response.status_code}")
        
        # Athlete should see fixtures where they're on a team
        response = self.session.get(f"{API_BASE}/fixtures/")
        if response.status_code == 200:
            fixtures = response.json()
            print(f"  ✅ Athlete1 can see {len(fixtures)} fixtures")
        else:
            print(f"  ❌ Athlete1 cannot access fixtures: {response.status_code}")
        
        # Test Spectator permissions
        print("\n👀 Testing Spectator Permissions...")
        self.authenticate_user(self.test_users['spectator1'])
        
        # Spectator should see public events
        response = self.session.get(f"{API_BASE}/events/")
        if response.status_code == 200:
            events = response.json()
            public_events = [e for e in events if e.get('visibility') == 'PUBLIC']
            print(f"  ✅ Spectator1 can see {len(public_events)} public events")
        else:
            print(f"  ❌ Spectator1 cannot access events: {response.status_code}")
        
        # Spectator should see their own ticket orders
        response = self.session.get(f"{API_BASE}/tickets/orders/")
        if response.status_code == 200:
            orders = response.json()
            print(f"  ✅ Spectator1 can see {len(orders)} of their own orders")
        else:
            print(f"  ❌ Spectator1 cannot access their orders: {response.status_code}")
    
    def test_permission_overreach(self):
        """Test for permission overreach issues"""
        print("\n🚨 Testing for Permission Overreach...")
        
        # Test if organizer1 can access organizer2's events
        self.authenticate_user(self.test_users['organizer1'])
        response = self.session.get(f"{API_BASE}/events/{self.test_events['event2'].id}/")
        
        if response.status_code == 403:
            print("  ✅ Organizer1 correctly denied access to Organizer2's event")
        elif response.status_code == 404:
            print("  ✅ Organizer1 cannot see Organizer2's event (filtered out)")
        else:
            print(f"  ❌ PERMISSION OVERREACH: Organizer1 can access Organizer2's event ({response.status_code})")
        
        # Test if coach1 can access coach2's team
        self.authenticate_user(self.test_users['coach1'])
        response = self.session.get(f"{API_BASE}/teams/{self.test_teams['team2'].id}/")
        
        if response.status_code == 403:
            print("  ✅ Coach1 correctly denied access to Coach2's team")
        elif response.status_code == 404:
            print("  ✅ Coach1 cannot see Coach2's team (filtered out)")
        else:
            print(f"  ❌ PERMISSION OVERREACH: Coach1 can access Coach2's team ({response.status_code})")
        
        # Test if athlete1 can access athlete2's profile
        self.authenticate_user(self.test_users['athlete1'])
        response = self.session.get(f"{API_BASE}/accounts/users/{self.test_users['athlete2'].id}/")
        
        if response.status_code == 403:
            print("  ✅ Athlete1 correctly denied access to Athlete2's profile")
        elif response.status_code == 404:
            print("  ✅ Athlete1 cannot see Athlete2's profile (filtered out)")
        else:
            print(f"  ❌ PERMISSION OVERREACH: Athlete1 can access Athlete2's profile ({response.status_code})")
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Comprehensive Reports & RBAC Tests")
        print("=" * 60)
        
        try:
            self.setup_test_data()
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
    tester = TestReportsRBAC()
    tester.run_all_tests()
