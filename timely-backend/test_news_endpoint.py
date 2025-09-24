#!/usr/bin/env python
import os
import sys
import django

# Setup Django first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timely.settings')
django.setup()

from django.test import Client

def test_news_endpoint():
    client = Client()
    
    print('Testing news endpoint...')
    response = client.get('/api/news/')
    print(f'Status code: {response.status_code}')
    print(f'Content type: {response.get("Content-Type", "Not set")}')
    
    if response.status_code == 200:
        print('Response data:', response.json())
    else:
        print('Response content:', response.content.decode()[:500])

if __name__ == '__main__':
    test_news_endpoint()
