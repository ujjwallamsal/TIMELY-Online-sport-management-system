#!/usr/bin/env python
"""
Test script for Stripe ticket integration
Run this to test the Stripe payment flow and ticket management
"""
import requests
import json
import time
import base64
from io import BytesIO


class StripeTicketTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        
    def login(self, username="test@example.com", password="testpass123"):
        """Login and get auth token"""
        try:
            response = self.session.post(f"{self.base_url}/api/auth/login/", {
                'username': username,
                'password': password
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('access')
                self.session.headers.update({
                    'Authorization': f'Bearer {self.auth_token}'
                })
                print("✅ Login successful")
                return True
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False
    
    def test_health(self):
        """Test API health"""
        try:
            response = self.session.get(f"{self.base_url}/api/health/")
            print(f"✅ Health check: {response.status_code}")
            return response.status_code == 200
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            return False
    
    def test_ticket_types(self, event_id=1):
        """Test getting ticket types for an event"""
        try:
            response = self.session.get(f"{self.base_url}/api/tickets/events/{event_id}/types/")
            print(f"✅ Ticket types: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   Found {len(data.get('results', []))} ticket types")
                return data.get('results', [])
            return []
        except Exception as e:
            print(f"❌ Ticket types failed: {e}")
            return []
    
    def test_create_checkout(self, event_id=1, ticket_types=None):
        """Test creating Stripe checkout session"""
        if not ticket_types:
            ticket_types = [{'ticket_type_id': 1, 'qty': 1}]
        
        try:
            checkout_data = {
                'event_id': event_id,
                'items': ticket_types
            }
            
            response = self.session.post(f"{self.base_url}/api/tickets/stripe/checkout/", json=checkout_data)
            print(f"✅ Stripe checkout: {response.status_code}")
            
            if response.status_code == 201:
                data = response.json()
                print(f"   Order ID: {data.get('order_id')}")
                print(f"   Client Secret: {data.get('client_secret', '')[:20]}...")
                print(f"   Payment Intent: {data.get('payment_intent_id')}")
                return data
            else:
                print(f"   Error: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Stripe checkout failed: {e}")
            return None
    
    def test_my_tickets(self):
        """Test getting user's tickets"""
        try:
            response = self.session.get(f"{self.base_url}/api/me/tickets/")
            print(f"✅ My tickets: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Found {data.get('count', 0)} tickets")
                return data.get('tickets', [])
            return []
        except Exception as e:
            print(f"❌ My tickets failed: {e}")
            return []
    
    def test_ticket_qr(self, ticket_id=1):
        """Test getting ticket QR code"""
        try:
            # Test QR data
            response = self.session.get(f"{self.base_url}/api/tickets/{ticket_id}/qr/data/")
            print(f"✅ Ticket QR data: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Serial: {data.get('serial')}")
                print(f"   QR Payload: {data.get('qr_payload', '')[:50]}...")
                return data
            
            return None
        except Exception as e:
            print(f"❌ Ticket QR data failed: {e}")
            return None
    
    def test_ticket_qr_image(self, ticket_id=1, format_type="png"):
        """Test getting ticket QR code image"""
        try:
            response = self.session.get(f"{self.base_url}/api/tickets/{ticket_id}/qr/image/?format={format_type}")
            print(f"✅ Ticket QR image ({format_type}): {response.status_code}")
            
            if response.status_code == 200:
                print(f"   Image size: {len(response.content)} bytes")
                return response.content
            return None
        except Exception as e:
            print(f"❌ Ticket QR image failed: {e}")
            return None
    
    def test_verify_ticket(self, qr_code="TKT:1:1:TEST123"):
        """Test ticket verification"""
        try:
            response = self.session.get(f"{self.base_url}/api/tickets/verify/?code={qr_code}")
            print(f"✅ Ticket verification: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Ticket ID: {data.get('ticket_id')}")
                print(f"   Serial: {data.get('serial')}")
                print(f"   Status: {data.get('status')}")
                return data
            else:
                print(f"   Error: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Ticket verification failed: {e}")
            return None
    
    def test_webhook_endpoint(self):
        """Test webhook endpoint (should return 400 for invalid signature)"""
        try:
            response = self.session.post(f"{self.base_url}/api/tickets/webhook/", 
                                       json={"test": "data"})
            print(f"✅ Webhook endpoint: {response.status_code}")
            # Should return 400 for missing signature
            return response.status_code == 400
        except Exception as e:
            print(f"❌ Webhook test failed: {e}")
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print("🧪 Testing Stripe Ticket Integration")
        print("=" * 50)
        
        # Test 1: Health check
        print("\n1. Testing API health...")
        if not self.test_health():
            print("❌ API not available, stopping tests")
            return
        
        # Test 2: Login
        print("\n2. Testing authentication...")
        if not self.login():
            print("❌ Authentication failed, stopping tests")
            return
        
        # Test 3: Ticket types
        print("\n3. Testing ticket types...")
        ticket_types = self.test_ticket_types()
        
        # Test 4: Stripe checkout (will fail in test mode without real payment)
        print("\n4. Testing Stripe checkout...")
        checkout_data = self.test_create_checkout()
        
        # Test 5: My tickets
        print("\n5. Testing my tickets...")
        tickets = self.test_my_tickets()
        
        # Test 6: QR code data
        if tickets:
            print("\n6. Testing QR code data...")
            ticket_id = tickets[0]['id']
            qr_data = self.test_ticket_qr(ticket_id)
            
            # Test 7: QR code image
            print("\n7. Testing QR code image...")
            qr_image = self.test_ticket_qr_image(ticket_id, "png")
            qr_svg = self.test_ticket_qr_image(ticket_id, "svg")
            
            # Test 8: Ticket verification
            print("\n8. Testing ticket verification...")
            if qr_data:
                self.test_verify_ticket(qr_data['qr_payload'])
        
        # Test 9: Webhook endpoint
        print("\n9. Testing webhook endpoint...")
        self.test_webhook_endpoint()
        
        print("\n✅ All tests completed!")
        print("\nNote: Stripe checkout will fail in test mode without valid payment methods")
        print("To test full payment flow, use Stripe test cards in a real environment")


if __name__ == "__main__":
    tester = StripeTicketTester()
    tester.run_all_tests()
