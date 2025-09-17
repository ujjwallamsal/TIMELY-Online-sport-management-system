#!/usr/bin/env python3
import requests
import json

def test_api():
    base_url = "http://127.0.0.1:8000"
    
    print("Testing API endpoints...")
    
    # Test public events
    try:
        response = requests.get(f"{base_url}/api/public/events/")
        print(f"Public events status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Public events count: {data.get('count', 0)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error testing public events: {e}")
    
    # Test login
    try:
        response = requests.post(f"{base_url}/api/accounts/auth/login/", 
                               json={"email": "admin@gmail.com", "password": "admin@@123"})
        print(f"Login status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Login successful for: {data.get('user', {}).get('email', 'Unknown')}")
        else:
            print(f"Login error: {response.text}")
    except Exception as e:
        print(f"Error testing login: {e}")

if __name__ == "__main__":
    test_api()
