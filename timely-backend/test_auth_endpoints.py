#!/usr/bin/env python
"""
Test script for the new authentication endpoints
"""
import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.append('/Users/ujjwallamsal/Desktop/CAPSTONE/timely-backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timely.settings')
django.setup()

from django.test import TestCase, Client
from django.urls import reverse
from rest_framework import status
from accounts.models import User
import json

def test_auth_endpoints():
    """Test the new authentication endpoints"""
    client = Client()
    
    print("Testing authentication endpoints...")
    
    # Test health endpoint
    print("\n1. Testing health endpoint...")
    response = client.get('/api/health/')
    print(f"Health endpoint status: {response.status_code}")
    if response.status_code == 200:
        print("✓ Health endpoint working")
    else:
        print("✗ Health endpoint failed")
    
    # Test register endpoint
    print("\n2. Testing register endpoint...")
    register_data = {
        'email': 'test3@example.com',
        'password': 'testpass123',
        'password_confirm': 'testpass123',
        'first_name': 'Test',
        'last_name': 'User'
    }
    response = client.post('/api/auth/register/', 
                          data=json.dumps(register_data),
                          content_type='application/json')
    print(f"Register endpoint status: {response.status_code}")
    if response.status_code == 201:
        print("✓ Register endpoint working")
        response_data = response.json()
        print(f"Response keys: {list(response_data.keys())}")
    else:
        print("✗ Register endpoint failed")
        print(f"Response: {response.content}")
    
    # Test login endpoint with email
    print("\n3. Testing login endpoint with email...")
    login_data = {
        'email': 'test3@example.com',
        'password': 'testpass123'
    }
    response = client.post('/api/auth/login/',
                          data=json.dumps(login_data),
                          content_type='application/json')
    print(f"Login endpoint status: {response.status_code}")
    if response.status_code == 200:
        print("✓ Login endpoint working")
        response_data = response.json()
        print(f"Response keys: {list(response_data.keys())}")
        access_token = response_data.get('access')
    else:
        print("✗ Login endpoint failed")
        print(f"Response: {response.content}")
        access_token = None
    
    # Test login endpoint with username
    print("\n4. Testing login endpoint with username...")
    # First get the actual username from the user
    try:
        user = User.objects.get(email='test3@example.com')
        username = user.username
        print(f"User username: {username}")
    except User.DoesNotExist:
        username = 'test3'
    
    login_data = {
        'username': username,
        'password': 'testpass123'
    }
    response = client.post('/api/auth/login/',
                          data=json.dumps(login_data),
                          content_type='application/json')
    print(f"Login with username status: {response.status_code}")
    if response.status_code == 200:
        print("✓ Login with username working")
    else:
        print("✗ Login with username failed")
        print(f"Response: {response.content}")
    
    # Test me endpoint
    print("\n5. Testing me endpoint...")
    if access_token:
        headers = {'Authorization': f'Bearer {access_token}'}
        response = client.get('/api/me/', headers=headers)
        print(f"Me endpoint status: {response.status_code}")
        if response.status_code == 200:
            print("✓ Me endpoint working")
            response_data = response.json()
            print(f"User email: {response_data.get('email')}")
        else:
            print("✗ Me endpoint failed")
            print(f"Response: {response.content}")
    else:
        print("Skipping me endpoint test - no access token")
    
    # Test me endpoint without token
    print("\n6. Testing me endpoint without token...")
    response = client.get('/api/me/')
    print(f"Me endpoint without token status: {response.status_code}")
    if response.status_code == 401:
        print("✓ Me endpoint properly returns 401 without token")
    else:
        print("✗ Me endpoint should return 401 without token")
    
    # Test refresh endpoint
    print("\n7. Testing refresh endpoint...")
    if access_token:
        refresh_data = {'refresh': access_token}  # This should be the refresh token
        response = client.post('/api/auth/refresh/',
                              data=json.dumps(refresh_data),
                              content_type='application/json')
        print(f"Refresh endpoint status: {response.status_code}")
        if response.status_code == 200:
            print("✓ Refresh endpoint working")
        else:
            print("✗ Refresh endpoint failed")
            print(f"Response: {response.content}")
    
    print("\n" + "="*50)
    print("Authentication endpoints test completed!")

if __name__ == '__main__':
    test_auth_endpoints()
