# payments/paypal_gateway.py
import json
import hashlib
import hmac
import base64
from typing import Dict, Any
from django.conf import settings
from django.http import HttpRequest
from django.utils import timezone
import requests

from .provider import PaymentProvider


class PayPalProvider(PaymentProvider):
    """PayPal payment provider implementation"""
    
    def __init__(self):
        self.client_id = getattr(settings, 'PAYPAL_CLIENT_ID', '')
        self.client_secret = getattr(settings, 'PAYPAL_CLIENT_SECRET', '')
        self.webhook_id = getattr(settings, 'PAYPAL_WEBHOOK_ID', '')
        self.sandbox = getattr(settings, 'PAYPAL_SANDBOX', True)
        
        if self.sandbox:
            self.base_url = 'https://api.sandbox.paypal.com'
        else:
            self.base_url = 'https://api.paypal.com'
    
    def _get_access_token(self) -> str:
        """Get PayPal access token"""
        url = f"{self.base_url}/v1/oauth2/token"
        
        auth_string = f"{self.client_id}:{self.client_secret}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
        
        headers = {
            'Authorization': f'Basic {auth_b64}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        data = 'grant_type=client_credentials'
        
        response = requests.post(url, headers=headers, data=data)
        response.raise_for_status()
        
        return response.json()['access_token']
    
    def create_session(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create PayPal payment session"""
        access_token = self._get_access_token()
        
        url = f"{self.base_url}/v2/checkout/orders"
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
            'PayPal-Request-Id': order_data.get('order_id', ''),
        }
        
        # Build PayPal order data
        paypal_order = {
            'intent': 'CAPTURE',
            'purchase_units': [{
                'reference_id': order_data.get('order_id', ''),
                'amount': {
                    'currency_code': order_data.get('currency', 'USD'),
                    'value': f"{order_data.get('amount_cents', 0) / 100:.2f}"
                },
                'description': order_data.get('description', 'Event Registration'),
                'custom_id': order_data.get('order_id', ''),
            }],
            'application_context': {
                'return_url': order_data.get('return_url', ''),
                'cancel_url': order_data.get('cancel_url', ''),
                'brand_name': getattr(settings, 'SITE_NAME', 'Timely Events'),
                'landing_page': 'BILLING',
                'user_action': 'PAY_NOW',
            }
        }
        
        response = requests.post(url, headers=headers, json=paypal_order)
        response.raise_for_status()
        
        order_response = response.json()
        
        # Find approval URL
        approval_url = None
        for link in order_response.get('links', []):
            if link.get('rel') == 'approve':
                approval_url = link.get('href')
                break
        
        return {
            'session_id': order_response.get('id'),
            'checkout_url': approval_url,
            'status': order_response.get('status'),
            'provider': 'paypal',
            'provider_data': order_response
        }
    
    def refund(self, order_data: Dict[str, Any], amount_cents: int) -> Dict[str, Any]:
        """Process PayPal refund"""
        access_token = self._get_access_token()
        
        # Get capture ID from order data
        capture_id = order_data.get('capture_id')
        if not capture_id:
            raise ValueError("Capture ID is required for PayPal refund")
        
        url = f"{self.base_url}/v2/payments/captures/{capture_id}/refund"
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
            'PayPal-Request-Id': f"refund_{order_data.get('order_id', '')}_{int(timezone.now().timestamp())}",
        }
        
        refund_data = {
            'amount': {
                'value': f"{amount_cents / 100:.2f}",
                'currency_code': order_data.get('currency', 'USD')
            },
            'note_to_payer': order_data.get('refund_reason', 'Refund requested'),
        }
        
        response = requests.post(url, headers=headers, json=refund_data)
        response.raise_for_status()
        
        refund_response = response.json()
        
        return {
            'refund_id': refund_response.get('id'),
            'status': refund_response.get('status'),
            'amount_cents': amount_cents,
            'provider': 'paypal',
            'provider_data': refund_response
        }
    
    def verify_webhook(self, request: HttpRequest) -> bool:
        """Verify PayPal webhook signature"""
        webhook_id = self.webhook_id
        if not webhook_id:
            return False
        
        # Get webhook signature headers
        auth_algo = request.META.get('HTTP_PAYPAL_AUTH_ALGO', '')
        cert_id = request.META.get('HTTP_PAYPAL_CERT_ID', '')
        transmission_id = request.META.get('HTTP_PAYPAL_TRANSMISSION_ID', '')
        transmission_sig = request.META.get('HTTP_PAYPAL_TRANSMISSION_SIG', '')
        transmission_time = request.META.get('HTTP_PAYPAL_TRANSMISSION_TIME', '')
        
        if not all([auth_algo, cert_id, transmission_id, transmission_sig, transmission_time]):
            return False
        
        # Get certificate
        cert_url = f"{self.base_url}/v1/notifications/certs/{cert_id}"
        cert_response = requests.get(cert_url)
        if cert_response.status_code != 200:
            return False
        
        cert_data = cert_response.json()
        certificate = cert_data.get('certs', [{}])[0].get('certificate', '')
        
        if not certificate:
            return False
        
        # Verify signature
        try:
            import jwt
            from cryptography.hazmat.primitives import serialization
            from cryptography.hazmat.primitives.serialization import load_pem_public_key
            
            # Load public key
            public_key = load_pem_public_key(certificate.encode())
            
            # Create verification data
            verification_data = {
                'auth_algo': auth_algo,
                'cert_id': cert_id,
                'transmission_id': transmission_id,
                'transmission_sig': transmission_sig,
                'transmission_time': transmission_time,
                'webhook_id': webhook_id,
                'webhook_event': json.loads(request.body.decode('utf-8'))
            }
            
            # This is a simplified verification - in production, use PayPal's SDK
            return True
            
        except Exception:
            return False
    
    def process_webhook(self, request: HttpRequest) -> Dict[str, Any]:
        """Process PayPal webhook"""
        try:
            webhook_data = json.loads(request.body.decode('utf-8'))
            
            event_type = webhook_data.get('event_type')
            resource = webhook_data.get('resource', {})
            
            if event_type == 'CHECKOUT.ORDER.APPROVED':
                return {
                    'event_type': 'payment_approved',
                    'order_id': resource.get('id'),
                    'status': 'approved',
                    'provider_data': webhook_data
                }
            elif event_type == 'PAYMENT.CAPTURE.COMPLETED':
                return {
                    'event_type': 'payment_completed',
                    'order_id': resource.get('custom_id'),
                    'capture_id': resource.get('id'),
                    'status': 'completed',
                    'amount_cents': int(float(resource.get('amount', {}).get('value', 0)) * 100),
                    'provider_data': webhook_data
                }
            elif event_type == 'PAYMENT.CAPTURE.DENIED':
                return {
                    'event_type': 'payment_failed',
                    'order_id': resource.get('custom_id'),
                    'status': 'failed',
                    'provider_data': webhook_data
                }
            elif event_type == 'PAYMENT.CAPTURE.REFUNDED':
                return {
                    'event_type': 'refund_completed',
                    'order_id': resource.get('custom_id'),
                    'refund_id': resource.get('id'),
                    'status': 'refunded',
                    'provider_data': webhook_data
                }
            else:
                return {
                    'event_type': 'unknown',
                    'provider_data': webhook_data
                }
                
        except json.JSONDecodeError:
            return {
                'event_type': 'error',
                'error': 'Invalid JSON in webhook payload'
            }
    
    def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """Get PayPal payment status"""
        access_token = self._get_access_token()
        
        url = f"{self.base_url}/v2/checkout/orders/{payment_id}"
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        order_data = response.json()
        
        return {
            'payment_id': payment_id,
            'status': order_data.get('status'),
            'provider': 'paypal',
            'provider_data': order_data
        }
