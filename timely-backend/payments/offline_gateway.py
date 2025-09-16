# payments/offline_gateway.py
from typing import Dict, Any
from django.conf import settings
from django.http import HttpRequest
from django.utils import timezone
import uuid

from .provider import PaymentProvider


class OfflineProvider(PaymentProvider):
    """Offline payment provider for bank transfers and cash payments"""
    
    def create_session(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create offline payment session"""
        # Generate reference number for bank transfer
        reference_number = self._generate_reference_number()
        
        # Get bank details from settings
        bank_details = getattr(settings, 'OFFLINE_BANK_DETAILS', {
            'bank_name': 'Example Bank',
            'account_name': 'Timely Events Pty Ltd',
            'bsb': '123-456',
            'account_number': '12345678',
            'reference': reference_number
        })
        
        # Calculate total amount
        amount_cents = order_data.get('amount_cents', 0)
        amount_dollars = amount_cents / 100
        
        # Create payment instructions
        instructions = {
            'payment_method': 'bank_transfer',
            'reference_number': reference_number,
            'amount': f"${amount_dollars:.2f}",
            'currency': order_data.get('currency', 'AUD'),
            'bank_details': bank_details,
            'instructions': [
                f"Transfer ${amount_dollars:.2f} to the account below",
                f"Use reference: {reference_number}",
                f"Payment must be made within 7 days",
                "Send proof of payment to: payments@timelyevents.com",
                "Your order will be confirmed once payment is received"
            ],
            'deadline': (timezone.now() + timezone.timedelta(days=7)).isoformat(),
            'contact_email': getattr(settings, 'SUPPORT_EMAIL', 'support@timelyevents.com'),
            'contact_phone': getattr(settings, 'SUPPORT_PHONE', ''),
        }
        
        return {
            'session_id': reference_number,
            'checkout_url': None,  # No URL for offline payments
            'status': 'pending',
            'provider': 'offline',
            'provider_data': instructions,
            'instructions': instructions
        }
    
    def refund(self, order_data: Dict[str, Any], amount_cents: int) -> Dict[str, Any]:
        """Process offline refund"""
        # For offline payments, refunds are manual
        refund_reference = f"REF-{uuid.uuid4().hex[:8].upper()}"
        
        refund_instructions = {
            'refund_method': 'bank_transfer',
            'refund_reference': refund_reference,
            'amount': f"{amount_cents / 100:.2f}",
            'currency': order_data.get('currency', 'AUD'),
            'status': 'pending_manual_processing',
            'instructions': [
                f"Refund of ${amount_cents / 100:.2f} will be processed within 5-7 business days",
                f"Refund reference: {refund_reference}",
                "You will receive an email confirmation once processed",
                "If you have any questions, contact: support@timelyevents.com"
            ],
            'estimated_processing_time': '5-7 business days'
        }
        
        return {
            'refund_id': refund_reference,
            'status': 'pending_manual_processing',
            'amount_cents': amount_cents,
            'provider': 'offline',
            'provider_data': refund_instructions,
            'instructions': refund_instructions
        }
    
    def verify_webhook(self, request: HttpRequest) -> bool:
        """Offline payments don't have webhooks"""
        return False
    
    def process_webhook(self, request: HttpRequest) -> Dict[str, Any]:
        """Offline payments don't have webhooks"""
        return {
            'event_type': 'not_supported',
            'error': 'Offline payments do not support webhooks'
        }
    
    def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """Get offline payment status"""
        # For offline payments, status is typically managed manually
        return {
            'payment_id': payment_id,
            'status': 'pending_manual_verification',
            'provider': 'offline',
            'provider_data': {
                'message': 'Payment status will be updated once bank transfer is verified',
                'verification_required': True
            }
        }
    
    def _generate_reference_number(self) -> str:
        """Generate unique reference number for bank transfer"""
        timestamp = int(timezone.now().timestamp())
        random_part = uuid.uuid4().hex[:6].upper()
        return f"TME-{timestamp}-{random_part}"
    
    def confirm_payment(self, order_data: Dict[str, Any], confirmation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Confirm offline payment (admin function)"""
        reference_number = order_data.get('reference_number')
        if not reference_number:
            raise ValueError("Reference number is required for offline payment confirmation")
        
        # Validate confirmation data
        required_fields = ['amount', 'bank_reference', 'confirmed_by']
        for field in required_fields:
            if field not in confirmation_data:
                raise ValueError(f"Missing required field: {field}")
        
        return {
            'payment_id': reference_number,
            'status': 'confirmed',
            'provider': 'offline',
            'provider_data': {
                'confirmed_at': timezone.now().isoformat(),
                'confirmed_by': confirmation_data['confirmed_by'],
                'bank_reference': confirmation_data['bank_reference'],
                'amount': confirmation_data['amount'],
                'notes': confirmation_data.get('notes', '')
            }
        }
