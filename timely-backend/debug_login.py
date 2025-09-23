#!/usr/bin/env python
"""
Debug script for login issue
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

from django.test import Client
from accounts.models import User
import json

def debug_login():
    """Debug the login issue"""
    client = Client()
    
    # Get a user
    user = User.objects.filter(email='test3@example.com').first()
    if user:
        print(f"User found: {user.email}, username: {user.username}")
        
        # Test login with username
        print("\nTesting login with username...")
        login_data = {
            'username': user.username,
            'password': 'testpass123'
        }
        response = client.post('/api/auth/login/',
                              data=json.dumps(login_data),
                              content_type='application/json')
        print(f"Status: {response.status_code}")
        print(f"Response: {response.content}")
        
        # Test login with email
        print("\nTesting login with email...")
        login_data = {
            'email': user.email,
            'password': 'testpass123'
        }
        response = client.post('/api/auth/login/',
                              data=json.dumps(login_data),
                              content_type='application/json')
        print(f"Status: {response.status_code}")
        print(f"Response: {response.content}")
    else:
        print("No user found")

if __name__ == '__main__':
    debug_login()
