#!/usr/bin/env python3
"""
Test script for fixtures, results, and leaderboard endpoints
"""
import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://127.0.0.1:8000/api"
USERNAME = "admin"  # Change to your admin username
PASSWORD = "admin123"  # Change to your admin password

def login():
    """Login and get JWT token"""
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": USERNAME,
        "password": PASSWORD
    })
    
    if response.status_code == 200:
        data = response.json()
        return data.get('access')
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        return None

def test_fixture_generation(token, event_id):
    """Test fixture generation endpoint"""
    print(f"\n=== Testing Fixture Generation for Event {event_id} ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test round-robin generation
    response = requests.post(
        f"{BASE_URL}/events/{event_id}/fixtures/generate/",
        params={"mode": "rr"},
        headers=headers,
        json={
            "start_date": (datetime.now() + timedelta(days=1)).isoformat(),
            "venues": [10, 11]  # Using actual venue IDs from database
        }
    )
    
    print(f"POST /api/events/{event_id}/fixtures/generate?mode=rr")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 201:
        data = response.json()
        print(f"✅ Success: Generated {data.get('fixtures_count', 0)} fixtures")
        print(f"Mode: {data.get('mode')}")
        print(f"Teams: {data.get('teams_count')}")
        return data.get('fixtures', [])
    else:
        print(f"❌ Error: {response.text}")
        return []

def test_fixtures_list(token, event_id):
    """Test fixtures list endpoint"""
    print(f"\n=== Testing Fixtures List for Event {event_id} ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/events/{event_id}/fixtures/", headers=headers)
    
    print(f"GET /api/events/{event_id}/fixtures/")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success: Found {data.get('fixtures_count', 0)} fixtures")
        print(f"Event: {data.get('event_name')}")
        return data.get('fixtures', [])
    else:
        print(f"❌ Error: {response.text}")
        return []

def test_fixture_reschedule(token, fixture_id):
    """Test fixture reschedule endpoint"""
    print(f"\n=== Testing Fixture Reschedule for Fixture {fixture_id} ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Reschedule to 2 hours later
    new_time = (datetime.now() + timedelta(days=1, hours=2)).isoformat()
    
    response = requests.patch(
        f"{BASE_URL}/fixtures/{fixture_id}/",
        headers=headers,
        json={
            "start_at": new_time,
            "venue_id": 2  # Change venue
        }
    )
    
    print(f"PATCH /api/fixtures/{fixture_id}/")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success: {data.get('message')}")
        return True
    else:
        print(f"❌ Error: {response.text}")
        return False

def test_result_entry(token, fixture_id):
    """Test result entry endpoint"""
    print(f"\n=== Testing Result Entry for Fixture {fixture_id} ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BASE_URL}/fixtures/{fixture_id}/result/",
        headers=headers,
        json={
            "home_score": 2,
            "away_score": 1
        }
    )
    
    print(f"POST /api/fixtures/{fixture_id}/result/")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 201:
        data = response.json()
        print(f"✅ Success: {data.get('message')}")
        return True
    else:
        print(f"❌ Error: {response.text}")
        return False

def test_leaderboard(token, event_id):
    """Test leaderboard endpoint"""
    print(f"\n=== Testing Leaderboard for Event {event_id} ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/events/{event_id}/leaderboard/", headers=headers)
    
    print(f"GET /api/events/{event_id}/leaderboard/")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success: Found leaderboard for {data.get('event_name')}")
        print(f"Teams: {len(data.get('leaderboard', []))}")
        
        # Print leaderboard
        for entry in data.get('leaderboard', [])[:5]:  # Top 5
            print(f"  {entry.get('position')}. {entry.get('team_name')} - {entry.get('points')} pts")
        
        return True
    else:
        print(f"❌ Error: {response.text}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting Fixtures, Results, and Leaderboard Tests")
    
    # Login
    token = login()
    if not token:
        print("❌ Failed to login. Exiting.")
        return
    
    print(f"✅ Logged in successfully")
    
    # You'll need to replace this with an actual event ID from your database
    event_id = 3  # Change this to a real event ID
    
    # Test fixture generation
    fixtures = test_fixture_generation(token, event_id)
    
    if not fixtures:
        print("❌ No fixtures generated. Cannot continue with other tests.")
        return
    
    # Test fixtures list
    fixtures_list = test_fixtures_list(token, event_id)
    
    if fixtures_list:
        # Test reschedule first fixture
        first_fixture = fixtures_list[0]
        fixture_id = first_fixture.get('id')
        
        if fixture_id:
            test_fixture_reschedule(token, fixture_id)
            
            # Test result entry
            test_result_entry(token, fixture_id)
    
    # Test leaderboard
    test_leaderboard(token, event_id)
    
    print("\n🎉 Tests completed!")

if __name__ == "__main__":
    main()
