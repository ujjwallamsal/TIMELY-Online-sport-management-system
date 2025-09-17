# tickets/services/stripe_service.py
import stripe
import logging
from django.conf import settings
from django.utils import timezone
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeTicketService:
    """Service for handling Stripe payments for tickets"""
    
    def __init__(self):
        self.stripe = stripe
    
    def create_payment_intent(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Stripe PaymentIntent for ticket purchase"""
        try:
            # Prepare metadata
            metadata = {
                'order_id': str(order_data['order_id']),
                'event_id': str(order_data['event_id']),
                'user_id': str(order_data['user_id']),
                'event_name': order_data.get('event_name', ''),
                'user_email': order_data.get('user_email', ''),
            }
            
            # Add fixture info if applicable
            if order_data.get('fixture_id'):
                metadata['fixture_id'] = str(order_data['fixture_id'])
            
            # Create PaymentIntent
            intent = self.stripe.PaymentIntent.create(
                amount=order_data['amount_cents'],
                currency=order_data.get('currency', 'usd'),
                metadata=metadata,
                automatic_payment_methods={
                    'enabled': True,
                },
                customer_email=order_data.get('user_email'),
                description=f"Tickets for {order_data.get('event_name', 'Event')}",
                receipt_email=order_data.get('user_email'),
            )
            
            logger.info(f"Created Stripe PaymentIntent {intent.id} for order {order_data['order_id']}")
            
            return {
                'payment_intent_id': intent.id,
                'client_secret': intent.client_secret,
                'status': intent.status,
                'amount_cents': intent.amount,
                'currency': intent.currency,
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating PaymentIntent: {str(e)}")
            raise Exception(f"Payment processing error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error creating PaymentIntent: {str(e)}")
            raise Exception(f"Payment processing error: {str(e)}")
    
    def retrieve_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """Retrieve a PaymentIntent from Stripe"""
        try:
            intent = self.stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                'payment_intent_id': intent.id,
                'status': intent.status,
                'amount_cents': intent.amount,
                'currency': intent.currency,
                'metadata': intent.metadata,
                'client_secret': intent.client_secret,
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error retrieving PaymentIntent {payment_intent_id}: {str(e)}")
            raise Exception(f"Payment retrieval error: {str(e)}")
    
    def confirm_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """Confirm a PaymentIntent"""
        try:
            intent = self.stripe.PaymentIntent.confirm(payment_intent_id)
            return {
                'payment_intent_id': intent.id,
                'status': intent.status,
                'amount_cents': intent.amount,
                'currency': intent.currency,
                'metadata': intent.metadata,
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error confirming PaymentIntent {payment_intent_id}: {str(e)}")
            raise Exception(f"Payment confirmation error: {str(e)}")
    
    def cancel_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """Cancel a PaymentIntent"""
        try:
            intent = self.stripe.PaymentIntent.cancel(payment_intent_id)
            return {
                'payment_intent_id': intent.id,
                'status': intent.status,
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error canceling PaymentIntent {payment_intent_id}: {str(e)}")
            raise Exception(f"Payment cancellation error: {str(e)}")
    
    def create_refund(self, payment_intent_id: str, amount_cents: Optional[int] = None, reason: str = "requested_by_customer") -> Dict[str, Any]:
        """Create a refund for a PaymentIntent"""
        try:
            # First, get the payment intent to find the charge
            intent = self.stripe.PaymentIntent.retrieve(payment_intent_id)
            
            if intent.status != 'succeeded':
                raise Exception("Payment must be succeeded to create refund")
            
            # Get the latest charge
            charges = self.stripe.Charge.list(payment_intent=payment_intent_id)
            if not charges.data:
                raise Exception("No charges found for payment intent")
            
            charge = charges.data[0]
            
            # Create refund
            refund = self.stripe.Refund.create(
                charge=charge.id,
                amount=amount_cents,
                reason=reason,
                metadata={
                    'payment_intent_id': payment_intent_id,
                    'refund_reason': reason,
                }
            )
            
            logger.info(f"Created Stripe refund {refund.id} for PaymentIntent {payment_intent_id}")
            
            return {
                'refund_id': refund.id,
                'amount_cents': refund.amount,
                'status': refund.status,
                'reason': refund.reason,
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating refund: {str(e)}")
            raise Exception(f"Refund processing error: {str(e)}")
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify Stripe webhook signature"""
        try:
            self.stripe.Webhook.construct_event(
                payload, signature, settings.STRIPE_WEBHOOK_SECRET
            )
            return True
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Stripe webhook signature verification failed: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Stripe webhook verification error: {str(e)}")
            return False
    
    def parse_webhook_event(self, payload: bytes, signature: str) -> Optional[Dict[str, Any]]:
        """Parse and verify Stripe webhook event"""
        try:
            event = self.stripe.Webhook.construct_event(
                payload, signature, settings.STRIPE_WEBHOOK_SECRET
            )
            return {
                'id': event.id,
                'type': event.type,
                'data': event.data,
                'created': event.created,
            }
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Stripe webhook signature verification failed: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Stripe webhook parsing error: {str(e)}")
            return None


# Global service instance
stripe_service = StripeTicketService()
