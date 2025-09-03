# payments/stripe_gateway.py
"""
Stripe payment gateway integration for ticket orders
"""
import stripe
import logging
from typing import Dict, Any, Optional
from django.conf import settings
from django.http import HttpRequest

from tickets.models import TicketOrder

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeGateway:
    """Stripe payment gateway for ticket orders"""
    
    def __init__(self):
        self.secret_key = settings.STRIPE_SECRET_KEY
        self.webhook_secret = settings.STRIPE_WEBHOOK_SECRET
    
    def create_checkout_session(self, order: TicketOrder, request: HttpRequest) -> Dict[str, Any]:
        """
        Create Stripe checkout session for ticket order
        
        Args:
            order: TicketOrder instance
            request: HTTP request object
            
        Returns:
            Dict with checkout session data
        """
        try:
            # Build line items from order tickets
            line_items = []
            for ticket in order.tickets.all():
                line_items.append({
                    'price_data': {
                        'currency': order.currency.lower(),
                        'product_data': {
                            'name': f"{ticket.ticket_type.name} - {order.event.name}",
                            'description': ticket.ticket_type.description or f"Ticket for {order.event.name}",
                        },
                        'unit_amount': ticket.ticket_type.price_cents,
                    },
                    'quantity': 1,
                })
            
            # Create checkout session
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=f"{settings.FRONTEND_URL}/tickets/success?order_id={order.id}",
                cancel_url=f"{settings.FRONTEND_URL}/tickets/cancel?order_id={order.id}",
                customer_email=order.user.email,
                metadata={
                    'order_id': str(order.id),
                    'user_id': str(order.user.id),
                    'event_id': str(order.event.id),
                },
                # Test mode settings
                payment_intent_data={
                    'metadata': {
                        'order_id': str(order.id),
                        'user_id': str(order.user.id),
                        'event_id': str(order.event.id),
                    }
                }
            )
            
            # Update order with session ID
            order.provider_session_id = session.id
            order.save()
            
            logger.info(f"Created Stripe checkout session {session.id} for order {order.id}")
            
            return {
                'checkout_url': session.url,
                'session_id': session.id,
                'order_id': order.id
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating checkout session for order {order.id}: {str(e)}")
            raise Exception(f"Payment gateway error: {str(e)}")
        except Exception as e:
            logger.error(f"Error creating checkout session for order {order.id}: {str(e)}")
            raise Exception(f"Failed to create checkout session: {str(e)}")
    
    def verify_webhook(self, payload: bytes, signature: str) -> Optional[stripe.Event]:
        """
        Verify Stripe webhook signature and return event
        
        Args:
            payload: Raw webhook payload
            signature: Stripe signature header
            
        Returns:
            Stripe event object or None if invalid
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, self.webhook_secret
            )
            return event
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {str(e)}")
            return None
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {str(e)}")
            return None
    
    def handle_webhook_event(self, event: stripe.Event) -> Dict[str, Any]:
        """
        Handle Stripe webhook event
        
        Args:
            event: Stripe event object
            
        Returns:
            Dict with processing result
        """
        try:
            if event.type == 'checkout.session.completed':
                return self._handle_checkout_completed(event)
            elif event.type == 'payment_intent.succeeded':
                return self._handle_payment_succeeded(event)
            elif event.type == 'payment_intent.payment_failed':
                return self._handle_payment_failed(event)
            else:
                logger.info(f"Unhandled webhook event type: {event.type}")
                return {'status': 'ignored', 'message': f'Event type {event.type} not handled'}
                
        except Exception as e:
            logger.error(f"Error handling webhook event {event.id}: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _handle_checkout_completed(self, event: stripe.Event) -> Dict[str, Any]:
        """Handle checkout.session.completed event"""
        session = event.data.object
        
        try:
            order_id = session.metadata.get('order_id')
            if not order_id:
                logger.error(f"No order_id in session metadata: {session.id}")
                return {'status': 'error', 'message': 'No order_id in session metadata'}
            
            order = TicketOrder.objects.get(id=order_id)
            
            # Mark order as paid
            order.mark_paid(
                session_id=session.id,
                payment_intent=session.payment_intent
            )
            
            logger.info(f"Order {order.id} marked as paid via checkout session {session.id}")
            
            return {
                'status': 'success',
                'message': f'Order {order.id} marked as paid',
                'order_id': order.id
            }
            
        except TicketOrder.DoesNotExist:
            logger.error(f"Order not found: {order_id}")
            return {'status': 'error', 'message': f'Order {order_id} not found'}
        except Exception as e:
            logger.error(f"Error processing checkout completion: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _handle_payment_succeeded(self, event: stripe.Event) -> Dict[str, Any]:
        """Handle payment_intent.succeeded event"""
        payment_intent = event.data.object
        
        try:
            order_id = payment_intent.metadata.get('order_id')
            if not order_id:
                logger.error(f"No order_id in payment intent metadata: {payment_intent.id}")
                return {'status': 'error', 'message': 'No order_id in payment intent metadata'}
            
            order = TicketOrder.objects.get(id=order_id)
            
            # Mark order as paid if not already
            if order.status != TicketOrder.Status.PAID:
                order.mark_paid(
                    session_id=order.provider_session_id,
                    payment_intent=payment_intent.id
                )
                
                logger.info(f"Order {order.id} marked as paid via payment intent {payment_intent.id}")
            
            return {
                'status': 'success',
                'message': f'Order {order.id} payment confirmed',
                'order_id': order.id
            }
            
        except TicketOrder.DoesNotExist:
            logger.error(f"Order not found: {order_id}")
            return {'status': 'error', 'message': f'Order {order_id} not found'}
        except Exception as e:
            logger.error(f"Error processing payment success: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _handle_payment_failed(self, event: stripe.Event) -> Dict[str, Any]:
        """Handle payment_intent.payment_failed event"""
        payment_intent = event.data.object
        
        try:
            order_id = payment_intent.metadata.get('order_id')
            if not order_id:
                logger.error(f"No order_id in payment intent metadata: {payment_intent.id}")
                return {'status': 'error', 'message': 'No order_id in payment intent metadata'}
            
            order = TicketOrder.objects.get(id=order_id)
            
            # Mark order as failed
            order.status = TicketOrder.Status.FAILED
            order.save()
            
            logger.info(f"Order {order.id} marked as failed via payment intent {payment_intent.id}")
            
            return {
                'status': 'success',
                'message': f'Order {order.id} marked as failed',
                'order_id': order.id
            }
            
        except TicketOrder.DoesNotExist:
            logger.error(f"Order not found: {order_id}")
            return {'status': 'error', 'message': f'Order {order_id} not found'}
        except Exception as e:
            logger.error(f"Error processing payment failure: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def create_refund(self, order: TicketOrder, amount_cents: Optional[int] = None) -> Dict[str, Any]:
        """
        Create refund for order (stub for test mode)
        
        Args:
            order: TicketOrder instance
            amount_cents: Amount to refund (None for full refund)
            
        Returns:
            Dict with refund result
        """
        # In test mode, just mark as refunded
        # TODO: Implement real Stripe refund for production
        
        if order.status != TicketOrder.Status.PAID:
            return {'status': 'error', 'message': 'Order is not paid'}
        
        order.status = TicketOrder.Status.REFUNDED
        order.save()
        
        logger.info(f"Order {order.id} marked as refunded (test mode)")
        
        return {
            'status': 'success',
            'message': f'Order {order.id} refunded (test mode)',
            'order_id': order.id,
            'refund_amount_cents': amount_cents or order.total_cents
        }


# Global gateway instance
stripe_gateway = StripeGateway()
