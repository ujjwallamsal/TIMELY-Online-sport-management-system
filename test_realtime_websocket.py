#!/usr/bin/env python3
"""
Test script for WebSocket realtime functionality
"""
import asyncio
import websockets
import json
import requests
import time

# Configuration
WS_URL = "ws://127.0.0.1:8000/ws/events/{event_id}/"
API_BASE_URL = "http://127.0.0.1:8000/api"
USERNAME = "admin"
PASSWORD = "admin123"

def login():
    """Login and get JWT token"""
    response = requests.post(f"{API_BASE_URL}/auth/login", json={
        "username": USERNAME,
        "password": PASSWORD
    })
    
    if response.status_code == 200:
        data = response.json()
        return data.get('access')
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        return None

async def test_websocket_connection(event_id):
    """Test WebSocket connection and realtime updates"""
    print(f"🔌 Connecting to WebSocket for event {event_id}")
    
    uri = WS_URL.format(event_id=event_id)
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket")
            
            # Wait for connection confirmation
            message = await websocket.recv()
            data = json.loads(message)
            print(f"📨 Received: {data}")
            
            # Subscribe to results updates
            subscribe_message = {
                "type": "subscribe_results"
            }
            await websocket.send(json.dumps(subscribe_message))
            print("📤 Sent subscribe_results message")
            
            # Wait for subscription confirmation
            message = await websocket.recv()
            data = json.loads(message)
            print(f"📨 Subscription response: {data}")
            
            # Keep connection open for a while to receive updates
            print("⏳ Waiting for realtime updates... (30 seconds)")
            
            try:
                while True:
                    message = await asyncio.wait_for(websocket.recv(), timeout=30.0)
                    data = json.loads(message)
                    print(f"📨 Received update: {data}")
                    
                    if data.get('type') == 'leaderboard_update':
                        print("🏆 Leaderboard updated!")
                        leaderboard = data.get('data', {}).get('leaderboard', [])
                        for entry in leaderboard[:3]:  # Top 3
                            print(f"  {entry.get('team_name')}: {entry.get('points')} pts")
                    
                    elif data.get('type') == 'result_update':
                        print("⚽ Result updated!")
                        result = data.get('data', {}).get('result', {})
                        print(f"  Score: {result.get('home_score')} - {result.get('away_score')}")
                    
            except asyncio.TimeoutError:
                print("⏰ Timeout waiting for updates")
            
    except Exception as e:
        print(f"❌ WebSocket error: {e}")

def trigger_result_update(token, event_id):
    """Trigger a result update by entering a result"""
    print(f"\n🎯 Triggering result update for event {event_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get fixtures for the event
    response = requests.get(f"{API_BASE_URL}/events/{event_id}/fixtures/", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        fixtures = data.get('fixtures', [])
        
        if fixtures:
            # Use the first fixture
            fixture = fixtures[0]
            fixture_id = fixture.get('id')
            
            print(f"📝 Entering result for fixture {fixture_id}")
            
            # Enter a result
            result_response = requests.post(
                f"{API_BASE_URL}/fixtures/{fixture_id}/result/",
                headers=headers,
                json={
                    "home_score": 3,
                    "away_score": 2
                }
            )
            
            if result_response.status_code == 201:
                print("✅ Result entered successfully")
                return True
            else:
                print(f"❌ Failed to enter result: {result_response.text}")
        else:
            print("❌ No fixtures found for event")
    else:
        print(f"❌ Failed to get fixtures: {response.text}")
    
    return False

async def main():
    """Main test function"""
    print("🚀 Starting WebSocket Realtime Tests")
    
    # Login
    token = login()
    if not token:
        print("❌ Failed to login. Exiting.")
        return
    
    print(f"✅ Logged in successfully")
    
    # You'll need to replace this with an actual event ID from your database
    event_id = 1  # Change this to a real event ID
    
    # Start WebSocket connection
    websocket_task = asyncio.create_task(test_websocket_connection(event_id))
    
    # Wait a bit for connection to establish
    await asyncio.sleep(2)
    
    # Trigger a result update
    trigger_result_update(token, event_id)
    
    # Wait for WebSocket task to complete
    await websocket_task
    
    print("\n🎉 WebSocket tests completed!")

if __name__ == "__main__":
    asyncio.run(main())
