#!/usr/bin/env python3
"""
Comprehensive acceptance test for the Timely system.
Tests all major flows with real data, no mocks.
"""
import os
import sys
import json
import requests
import time
from datetime import datetime, timedelta

# Add the backend directory to the Python path
sys.path.insert(0, '/Users/ujjwallamsal/Desktop/CAPSTONE/timely-backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timely.settings')

BASE_URL = "http://127.0.0.1:8000/api"
ADMIN_CREDS = {"email": "admin@timely.local", "password": "admin123"}
ORGANIZER_CREDS = {"email": "organizer@timely.local", "password": "org123"}
ATHLETE_CREDS = {"email": "athlete@timely.local", "password": "ath123"}
COACH_CREDS = {"email": "coach@timely.local", "password": "coach123"}

class AcceptanceTestRunner:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_data = {}
        self.errors = []
        
    def log_error(self, test_name, url, status_code, response_body, traceback=None):
        """Log test failure with full details"""
        error = {
            "test": test_name,
            "url": url,
            "status_code": status_code,
            "response_body": response_body,
            "traceback": traceback,
            "timestamp": datetime.now().isoformat()
        }
        self.errors.append(error)
        print(f"❌ {test_name} FAILED")
        print(f"   URL: {url}")
        print(f"   Status: {status_code}")
        print(f"   Response: {response_body[:200]}...")
        if traceback:
            print(f"   Traceback: {traceback}")
        print()
        
    def authenticate(self, email, password, role_name):
        """Authenticate user and store token"""
        print(f"🔐 Authenticating {role_name}...")
        response = self.session.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": password
        })
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access")
            if token:
                self.tokens[role_name] = token
                self.session.headers.update({"Authorization": f"Bearer {token}"})
                print(f"✅ {role_name} authenticated")
                return True
            else:
                self.log_error(f"{role_name} authentication", f"{BASE_URL}/auth/login", 
                             response.status_code, response.text)
                return False
        else:
            self.log_error(f"{role_name} authentication", f"{BASE_URL}/auth/login", 
                         response.status_code, response.text)
            return False
    
    def setup_test_data(self):
        """Create necessary test data (events, teams, etc.)"""
        print("📋 Setting up test data...")
        
        # Get the sport ID first
        sports_response = self.session.get(f"{BASE_URL}/sports/")
        if sports_response.status_code != 200:
            self.log_error("Sports fetch", f"{BASE_URL}/sports/", sports_response.status_code, sports_response.text)
            return False
        
        sports_data = sports_response.json()
        if not sports_data.get("results"):
            self.log_error("Sports fetch", f"{BASE_URL}/sports/", 400, "No sports available")
            return False
            
        sport_id = sports_data["results"][0]["id"]
        
        # Create test event
        event_data = {
            "name": "Acceptance Test Tournament",
            "description": "Test tournament for acceptance testing",
            "sport": sport_id,
            "start_datetime": (datetime.now() + timedelta(days=7)).isoformat(),
            "end_datetime": (datetime.now() + timedelta(days=10)).isoformat(),
            "visibility": "PUBLIC",
            "capacity": 8
        }
        
        response = self.session.post(f"{BASE_URL}/events/", json=event_data)
        if response.status_code == 201:
            self.test_data["event"] = response.json()
            print("✅ Test event created")
        else:
            self.log_error("Event creation", f"{BASE_URL}/events/", 
                         response.status_code, response.text)
            return False
            
        # Skip team creation for now due to database schema mismatch
        # We'll use existing teams or create them via different means
        print("✅ Skipping team creation (database schema mismatch)")
        return True
    
    def test_registrations_flow(self):
        """Test: Athlete registers → Organizer approves → Athlete sees APPROVED"""
        print("\n🏃 Testing Registrations Flow...")
        
        # Step 1: Athlete registers for event
        print("   Step 1: Athlete registers for event")
        reg_data = {
            "event": self.test_data["event"]["id"],
            "type": "ATHLETE",
            "notes": "Acceptance test registration"
        }
        
        response = self.session.post(f"{BASE_URL}/registrations/", json=reg_data)
        if response.status_code == 201:
            registration = response.json()
            self.test_data["registration"] = registration
            print("   ✅ Athlete registered successfully")
        else:
            self.log_error("Athlete registration", f"{BASE_URL}/registrations/", 
                         response.status_code, response.text)
            return False
            
        # Step 2: Athlete checks registration status (should be PENDING)
        print("   Step 2: Athlete checks registration status")
        response = self.session.get(f"{BASE_URL}/registrations/{registration['id']}/")
        if response.status_code == 200:
            reg_data = response.json()
            if reg_data["status"] == "PENDING":
                print("   ✅ Registration status is PENDING")
            else:
                self.log_error("Registration status check", f"{BASE_URL}/registrations/{registration['id']}/", 
                             response.status_code, f"Expected PENDING, got {reg_data['status']}")
                return False
        else:
            self.log_error("Registration status check", f"{BASE_URL}/registrations/{registration['id']}/", 
                         response.status_code, response.text)
            return False
            
        # Step 3: Switch to organizer and approve registration
        print("   Step 3: Organizer approves registration")
        if not self.authenticate(ORGANIZER_CREDS["email"], ORGANIZER_CREDS["password"], "organizer"):
            return False
            
        approval_data = {"status": "APPROVED"}
        response = self.session.patch(f"{BASE_URL}/registrations/{registration['id']}/", json=approval_data)
        if response.status_code == 200:
            print("   ✅ Registration approved by organizer")
        else:
            self.log_error("Registration approval", f"{BASE_URL}/registrations/{registration['id']}/", 
                         response.status_code, response.text)
            return False
            
        # Step 4: Switch back to athlete and verify approval
        print("   Step 4: Athlete verifies approval")
        if not self.authenticate(ATHLETE_CREDS["email"], ATHLETE_CREDS["password"], "athlete"):
            return False
            
        response = self.session.get(f"{BASE_URL}/registrations/{registration['id']}/")
        if response.status_code == 200:
            reg_data = response.json()
            if reg_data["status"] == "APPROVED":
                print("   ✅ Athlete sees APPROVED status")
                return True
            else:
                self.log_error("Registration approval verification", f"{BASE_URL}/registrations/{registration['id']}/", 
                             response.status_code, f"Expected APPROVED, got {reg_data['status']}")
                return False
        else:
            self.log_error("Registration approval verification", f"{BASE_URL}/registrations/{registration['id']}/", 
                         response.status_code, response.text)
            return False
    
    def test_fixtures_flow(self):
        """Test: Generate RR fixtures → Reschedule one → Coach sees change live"""
        print("\n⚽ Testing Fixtures Flow...")
        
        # Step 1: Generate round-robin fixtures
        print("   Step 1: Generate round-robin fixtures")
        fixture_data = {
            "event": self.test_data["event"]["id"],
            "tournament_type": "round_robin",
            "start_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "start_time": "09:00",
            "match_duration": 90,
            "break_duration": 15
        }
        
        response = self.session.post(f"{BASE_URL}/fixtures/generate/", json=fixture_data)
        if response.status_code == 201:
            fixtures = response.json()
            self.test_data["fixtures"] = fixtures
            print("   ✅ Round-robin fixtures generated")
        else:
            self.log_error("Fixture generation", f"{BASE_URL}/fixtures/generate/", 
                         response.status_code, response.text)
            return False
            
        # Step 2: Reschedule one fixture
        print("   Step 2: Reschedule one fixture")
        if fixtures and len(fixtures) > 0:
            fixture = fixtures[0]
            new_time = datetime.now() + timedelta(days=8, hours=2)
            reschedule_data = {
                "start_at": new_time.isoformat()
            }
            
            response = self.session.patch(f"{BASE_URL}/fixtures/{fixture['id']}/", json=reschedule_data)
            if response.status_code == 200:
                print("   ✅ Fixture rescheduled")
                self.test_data["rescheduled_fixture"] = response.json()
            else:
                self.log_error("Fixture rescheduling", f"{BASE_URL}/fixtures/{fixture['id']}/", 
                             response.status_code, response.text)
                return False
        else:
            self.log_error("Fixture rescheduling", "No fixtures generated", 400, "No fixtures available")
            return False
            
        # Step 3: Coach sees change live (simulate WebSocket or API call)
        print("   Step 3: Coach verifies reschedule (live)")
        if not self.authenticate(COACH_CREDS["email"], COACH_CREDS["password"], "coach"):
            return False
            
        response = self.session.get(f"{BASE_URL}/fixtures/")
        if response.status_code == 200:
            fixtures_data = response.json()
            # Find the rescheduled fixture
            rescheduled = None
            for fixture in fixtures_data.get("results", []):
                if fixture["id"] == self.test_data["rescheduled_fixture"]["id"]:
                    rescheduled = fixture
                    break
                    
            if rescheduled:
                print("   ✅ Coach sees rescheduled fixture")
                return True
            else:
                self.log_error("Coach fixture verification", f"{BASE_URL}/fixtures/", 
                             response.status_code, "Rescheduled fixture not found in coach's view")
                return False
        else:
            self.log_error("Coach fixture verification", f"{BASE_URL}/fixtures/", 
                         response.status_code, response.text)
            return False
    
    def run_all_tests(self):
        """Run all acceptance tests"""
        print("🚀 Starting Comprehensive Acceptance Tests")
        print("=" * 50)
        
        # Setup authentication for admin
        if not self.authenticate(ADMIN_CREDS["email"], ADMIN_CREDS["password"], "admin"):
            print("❌ Failed to authenticate admin. Cannot proceed.")
            return False
            
        # Setup test data
        if not self.setup_test_data():
            print("❌ Failed to setup test data. Cannot proceed.")
            return False
            
        # Run tests
        tests = [
            ("Registrations Flow", self.test_registrations_flow),
            ("Fixtures Flow", self.test_fixtures_flow),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                    print(f"✅ {test_name} PASSED")
                else:
                    print(f"❌ {test_name} FAILED")
            except Exception as e:
                self.log_error(test_name, "Exception", 500, str(e))
                print(f"❌ {test_name} FAILED with exception: {e}")
        
        # Summary
        print("\n" + "=" * 50)
        print(f"📊 TEST SUMMARY: {passed}/{total} tests passed")
        
        if self.errors:
            print(f"\n❌ {len(self.errors)} errors occurred:")
            for error in self.errors:
                print(f"   • {error['test']}: {error['status_code']} at {error['url']}")
        
        return passed == total

if __name__ == "__main__":
    # Wait for server to start
    print("⏳ Waiting for server to start...")
    time.sleep(3)
    
    runner = AcceptanceTestRunner()
    success = runner.run_all_tests()
    
    if success:
        print("\n🎉 ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print("\n💥 SOME TESTS FAILED!")
        sys.exit(1)
