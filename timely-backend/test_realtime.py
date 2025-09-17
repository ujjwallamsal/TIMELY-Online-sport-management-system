#!/usr/bin/env python
"""
Test script for real-time functionality
Run this to test WebSocket connections and SSE endpoints
"""
import asyncio
import websockets
import json
import requests
import time


async def test_websocket_connection():
    """Test WebSocket connection to event stream"""
    uri = "ws://localhost:8000/ws/events/test-event-id/stream/"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully")
            
            # Send ping
            await websocket.send(json.dumps({
                'type': 'ping',
                'timestamp': time.time()
            }))
            
            # Wait for response
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(response)
            print(f"✅ Received response: {data}")
            
            # Test topic subscription
            await websocket.send(json.dumps({
                'type': 'subscribe_topic',
                'topic': 'results'
            }))
            
            print("✅ WebSocket test completed successfully")
            
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")


def test_sse_endpoint():
    """Test SSE endpoint"""
    url = "http://localhost:8000/api/realtime/events/test-event-id/stream/"
    
    try:
        response = requests.get(url, stream=True, timeout=10)
        print(f"✅ SSE endpoint responded with status: {response.status_code}")
        
        # Read first few lines
        for i, line in enumerate(response.iter_lines(decode_unicode=True)):
            if i >= 3:  # Read first 3 lines
                break
            print(f"✅ SSE data: {line}")
            
    except Exception as e:
        print(f"❌ SSE test failed: {e}")


def test_api_endpoints():
    """Test API endpoints"""
    base_url = "http://localhost:8000/api"
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health/")
        print(f"✅ Health endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ Health endpoint failed: {e}")
    
    # Test realtime endpoints
    try:
        response = requests.get(f"{base_url}/realtime/events/test-event-id/stream/")
        print(f"✅ Realtime SSE endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ Realtime SSE endpoint failed: {e}")


if __name__ == "__main__":
    print("🧪 Testing Real-time Functionality")
    print("=" * 50)
    
    print("\n1. Testing API endpoints...")
    test_api_endpoints()
    
    print("\n2. Testing SSE endpoint...")
    test_sse_endpoint()
    
    print("\n3. Testing WebSocket connection...")
    asyncio.run(test_websocket_connection())
    
    print("\n✅ All tests completed!")
