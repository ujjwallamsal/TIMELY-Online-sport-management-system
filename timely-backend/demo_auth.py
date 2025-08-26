#!/usr/bin/env python3
"""
Demo script for Timely Authentication System
Run this script to test the authentication endpoints
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

def print_separator(title):
    print(f"\n{'='*50}")
    print(f" {title}")
    print(f"{'='*50}")

def test_endpoint(method, endpoint, data=None, cookies=None):
    """Test an API endpoint and return response"""
    url = f"{API_BASE}{endpoint}"
    headers = {'Content-Type': 'application/json'}
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers, cookies=cookies)
        elif method.upper() == 'POST':
            response = requests.post(url, headers=headers, json=data, cookies=cookies)
        elif method.upper() == 'PATCH':
            response = requests.patch(url, headers=headers, json=data, cookies=cookies)
        
        print(f"{method} {endpoint}")
        print(f"Status: {response.status_code}")
        
        if response.cookies:
            print("Cookies set:")
            for cookie in response.cookies:
                print(f"  {cookie.name}: {cookie.value[:20]}...")
        
        if response.status_code == 200:
            try:
                result = response.json()
                print(f"Response: {json.dumps(result, indent=2)}")
            except:
                print(f"Response: {response.text}")
        else:
            try:
                error = response.json()
                print(f"Error: {json.dumps(error, indent=2)}")
            except:
                print(f"Error: {response.text}")
        
        return response
        
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def main():
    print_separator("Timely Authentication System Demo")
    print(f"Testing endpoints at: {BASE_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Health Check
    print_separator("1. Health Check")
    test_endpoint('GET', '/')
    
    # Test 2: User Registration
    print_separator("2. User Registration")
    signup_data = {
        "email": "demo@timely.com",
        "password": "demopass123",
        "first_name": "Demo",
        "last_name": "User",
        "role": "ORGANIZER"
    }
    signup_response = test_endpoint('POST', '/users/signup/', signup_data)
    
    # Test 3: User Login
    print_separator("3. User Login")
    login_data = {
        "email": "demo@timely.com",
        "password": "demopass123"
    }
    login_response = test_endpoint('POST', '/accounts/login/', login_data)
    
    if login_response and login_response.status_code == 200:
        cookies = login_response.cookies
        
        # Test 4: Get User Profile
        print_separator("4. Get User Profile")
        test_endpoint('GET', '/users/me/', cookies=cookies)
        
        # Test 5: Update User Profile
        print_separator("5. Update User Profile")
        update_data = {
            "first_name": "Updated Demo",
            "last_name": "Updated User"
        }
        test_endpoint('PATCH', '/users/me/', update_data, cookies)
        
        # Test 6: Get Updated Profile
        print_separator("6. Get Updated Profile")
        test_endpoint('GET', '/users/me/', cookies=cookies)
        
        # Test 7: Refresh Token
        print_separator("7. Refresh Token")
        test_endpoint('POST', '/accounts/refresh/', cookies=cookies)
        
        # Test 8: Logout
        print_separator("8. Logout")
        test_endpoint('POST', '/accounts/logout/', cookies=cookies)
        
        # Test 9: Try to access profile after logout
        print_separator("9. Access Profile After Logout (Should Fail)")
        test_endpoint('GET', '/users/me/', cookies=cookies)
    
    # Test 10: Email Verification Request
    print_separator("10. Email Verification Request")
    verify_data = {"email": "demo@timely.com"}
    test_endpoint('POST', '/accounts/email/verify/request/', verify_data)
    
    # Test 11: Password Reset Request
    print_separator("11. Password Reset Request")
    reset_data = {"email": "demo@timely.com"}
    test_endpoint('POST', '/accounts/password/reset/request/', reset_data)
    
    print_separator("Demo Complete")
    print("Check the console output above for results.")
    print("Note: Email verification and password reset tokens are printed in the console for development.")

if __name__ == "__main__":
    main()
