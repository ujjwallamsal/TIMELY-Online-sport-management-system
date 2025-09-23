#!/usr/bin/env python3
"""
Test script for real-time announcements functionality.
Tests the POST /api/events/:eventId/announce endpoint and real-time broadcasting.
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://127.0.0.1:8000"
API_BASE = f"{BASE_URL}/api"

def test_announcement_endpoint():
    """Test the announcement endpoint"""
    print("🧪 Testing Announcement Endpoint")
    print("=" * 50)
    
    # First, let's get a list of events to find an event ID
    try:
        print("📋 Fetching events...")
        events_response = requests.get(f"{API_BASE}/events/")
        
        if events_response.status_code != 200:
            print(f"❌ Failed to fetch events: {events_response.status_code}")
            print(f"Response: {events_response.text}")
            return False
            
        events = events_response.json()
        if not events or len(events) == 0:
            print("❌ No events found. Please create an event first.")
            return False
            
        event_id = events[0]['id']
        event_name = events[0]['name']
        print(f"✅ Found event: {event_name} (ID: {event_id})")
        
    except Exception as e:
        print(f"❌ Error fetching events: {e}")
        return False
    
    # Test announcement creation
    try:
        print(f"\n📢 Testing announcement creation for event {event_id}...")
        
        announcement_data = {
            "title": f"Test Announcement - {datetime.now().strftime('%H:%M:%S')}",
            "message": "This is a test announcement to verify real-time functionality. If you see this, the system is working correctly!",
            "audience": "ALL"
        }
        
        response = requests.post(
            f"{API_BASE}/events/{event_id}/announce/",
            json=announcement_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer test-token"  # You'll need to replace this with a real token
            }
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("✅ Announcement created successfully!")
            result = response.json()
            print(f"   Announcement ID: {result.get('announcement_id')}")
            print(f"   Audience: {result.get('audience')}")
            return True
        else:
            print(f"❌ Failed to create announcement: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating announcement: {e}")
        return False

def test_announcements_api():
    """Test the announcements API endpoints"""
    print("\n🧪 Testing Announcements API")
    print("=" * 50)
    
    try:
        # Test fetching announcements
        print("📋 Fetching announcements...")
        response = requests.get(f"{API_BASE}/announcements/")
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            announcements = response.json()
            print(f"✅ Found {len(announcements)} announcements")
            for ann in announcements[:3]:  # Show first 3
                print(f"   - {ann.get('title', 'No title')} ({ann.get('created_at', 'No date')})")
        else:
            print(f"❌ Failed to fetch announcements: {response.text}")
            
    except Exception as e:
        print(f"❌ Error fetching announcements: {e}")

def test_websocket_connection():
    """Test WebSocket connection for real-time updates"""
    print("\n🧪 Testing WebSocket Connection")
    print("=" * 50)
    
    try:
        import websocket
        import threading
        
        def on_message(ws, message):
            print(f"📨 Received WebSocket message: {message}")
            
        def on_error(ws, error):
            print(f"❌ WebSocket error: {error}")
            
        def on_close(ws, close_status_code, close_msg):
            print("🔌 WebSocket connection closed")
            
        def on_open(ws):
            print("✅ WebSocket connection opened")
            # Subscribe to announcements
            ws.send(json.dumps({"type": "subscribe_announcements"}))
            
        # Connect to WebSocket
        ws_url = f"ws://127.0.0.1:8000/ws/events/1/"  # Replace 1 with actual event ID
        print(f"🔌 Connecting to WebSocket: {ws_url}")
        
        ws = websocket.WebSocketApp(
            ws_url,
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )
        
        # Run WebSocket in a separate thread
        ws_thread = threading.Thread(target=ws.run_forever)
        ws_thread.daemon = True
        ws_thread.start()
        
        # Wait for a few seconds to see if we get any messages
        print("⏳ Waiting for WebSocket messages (5 seconds)...")
        time.sleep(5)
        
        ws.close()
        print("✅ WebSocket test completed")
        
    except ImportError:
        print("⚠️  websocket-client not installed. Install with: pip install websocket-client")
    except Exception as e:
        print(f"❌ WebSocket test error: {e}")

def main():
    """Run all tests"""
    print("🚀 Starting Announcement System Tests")
    print("=" * 60)
    
    # Test 1: Announcement endpoint
    success1 = test_announcement_endpoint()
    
    # Test 2: Announcements API
    test_announcements_api()
    
    # Test 3: WebSocket connection
    test_websocket_connection()
    
    print("\n" + "=" * 60)
    if success1:
        print("✅ Basic announcement functionality is working!")
        print("\n📝 Next steps:")
        print("   1. Start the Django server: python manage.py runserver")
        print("   2. Start the frontend: npm run dev")
        print("   3. Open the admin dashboard and send an announcement")
        print("   4. Check if it appears in real-time on other dashboards")
    else:
        print("❌ Some tests failed. Check the output above for details.")
    
    print("\n🔗 Useful endpoints:")
    print(f"   - Events: {API_BASE}/events/")
    print(f"   - Announcements: {API_BASE}/announcements/")
    print(f"   - WebSocket: ws://127.0.0.1:8000/ws/events/{{event_id}}/")

if __name__ == "__main__":
    main()
