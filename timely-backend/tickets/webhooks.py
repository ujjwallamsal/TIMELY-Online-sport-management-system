# tickets/webhooks.py
import json
import logging
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from .models import TicketOrder, Ticket
from .services.stripe_service import stripe_service
from .services.email_service import email_service

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook(request):
    """
    Handle Stripe webhooks for ticket payments
    POST /api/tickets/webhook
    """
    try:
        # Get the raw request body
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        
        if not sig_header:
            logger.error("Missing Stripe signature header")
            return HttpResponse("Missing signature", status=400)
        
        # Verify webhook signature
        event = stripe_service.parse_webhook_event(payload, sig_header)
        if not event:
            logger.error("Invalid Stripe webhook signature")
            return HttpResponse("Invalid signature", status=400)
        
        # Handle the event
        event_type = event['type']
        logger.info(f"Received Stripe webhook: {event_type}")
        
        if event_type == 'payment_intent.succeeded':
            return handle_payment_succeeded(event)
        elif event_type == 'payment_intent.payment_failed':
            return handle_payment_failed(event)
        elif event_type == 'payment_intent.canceled':
            return handle_payment_canceled(event)
        elif event_type == 'charge.dispute.created':
            return handle_charge_dispute(event)
        else:
            logger.info(f"Unhandled event type: {event_type}")
            return HttpResponse("Event received", status=200)
            
    except Exception as e:
        logger.error(f"Webhook processing failed: {str(e)}")
        return HttpResponse(f"Webhook error: {str(e)}", status=500)


def handle_payment_succeeded(event):
    """Handle successful payment"""
    try:
        payment_intent = event['data']['object']
        payment_intent_id = payment_intent['id']
        metadata = payment_intent.get('metadata', {})
        order_id = metadata.get('order_id')
        
        if not order_id:
            logger.error(f"No order_id in payment intent metadata: {payment_intent_id}")
            return HttpResponse("No order_id found", status=400)
        
        with transaction.atomic():
            # Get the order
            order = get_object_or_404(TicketOrder, id=order_id)
            
            # Check if already processed
            if order.status == TicketOrder.Status.PAID:
                logger.info(f"Order {order_id} already processed")
                return HttpResponse("Order already processed", status=200)
            
            # Mark order as paid
            order.mark_paid(
                session_id=payment_intent_id,
                payment_intent=payment_intent_id
            )
            
            # Update inventory
            for ticket in order.tickets.all():
                ticket_type = ticket.ticket_type
                ticket_type.quantity_sold += 1
                ticket_type.save()
            
            # Send confirmation email
            try:
                order_data = {
                    'order_id': order.id,
                    'user_email': order.user.email,
                    'user_name': order.user.get_full_name() or order.user.username,
                    'event_name': order.event.name,
                    'total_amount': order.total_dollars,
                    'currency': order.currency,
                }
                
                tickets_data = []
                for ticket in order.tickets.all():
                    tickets_data.append({
                        'id': ticket.id,
                        'serial': ticket.serial,
                        'ticket_type_name': ticket.ticket_type.name,
                        'price_cents': ticket.ticket_type.price_cents,
                        'qr_payload': ticket.qr_payload,
                    })
                
                email_service.send_purchase_confirmation(order_data, tickets_data)
                
            except Exception as e:
                logger.error(f"Failed to send confirmation email for order {order_id}: {str(e)}")
                # Don't fail the webhook for email errors
            
            logger.info(f"Successfully processed payment for order {order_id}")
            return HttpResponse("Payment processed successfully", status=200)
            
    except Exception as e:
        logger.error(f"Failed to handle payment success: {str(e)}")
        return HttpResponse(f"Payment processing failed: {str(e)}", status=500)


def handle_payment_failed(event):
    """Handle failed payment"""
    try:
        payment_intent = event['data']['object']
        payment_intent_id = payment_intent['id']
        metadata = payment_intent.get('metadata', {})
        order_id = metadata.get('order_id')
        
        if not order_id:
            logger.error(f"No order_id in payment intent metadata: {payment_intent_id}")
            return HttpResponse("No order_id found", status=400)
        
        with transaction.atomic():
            # Get the order
            order = get_object_or_404(TicketOrder, id=order_id)
            
            # Mark order as failed
            order.status = TicketOrder.Status.FAILED
            order.save()
            
            # Void all tickets
            for ticket in order.tickets.all():
                ticket.void_ticket()
            
            logger.info(f"Marked order {order_id} as failed")
            return HttpResponse("Payment failure processed", status=200)
            
    except Exception as e:
        logger.error(f"Failed to handle payment failure: {str(e)}")
        return HttpResponse(f"Payment failure processing failed: {str(e)}", status=500)


def handle_payment_canceled(event):
    """Handle canceled payment"""
    try:
        payment_intent = event['data']['object']
        payment_intent_id = payment_intent['id']
        metadata = payment_intent.get('metadata', {})
        order_id = metadata.get('order_id')
        
        if not order_id:
            logger.error(f"No order_id in payment intent metadata: {payment_intent_id}")
            return HttpResponse("No order_id found", status=400)
        
        with transaction.atomic():
            # Get the order
            order = get_object_or_404(TicketOrder, id=order_id)
            
            # Mark order as cancelled
            order.status = TicketOrder.Status.CANCELLED
            order.save()
            
            # Void all tickets
            for ticket in order.tickets.all():
                ticket.void_ticket()
            
            logger.info(f"Marked order {order_id} as cancelled")
            return HttpResponse("Payment cancellation processed", status=200)
            
    except Exception as e:
        logger.error(f"Failed to handle payment cancellation: {str(e)}")
        return HttpResponse(f"Payment cancellation processing failed: {str(e)}", status=500)


def handle_charge_dispute(event):
    """Handle charge dispute"""
    try:
        dispute = event['data']['object']
        charge_id = dispute['charge']
        
        # Get payment intent from charge
        from tickets.services.stripe_service import stripe_service
        charge = stripe_service.stripe.Charge.retrieve(charge_id)
        payment_intent_id = charge.payment_intent
        
        # Get order
        order = TicketOrder.objects.filter(
            provider_payment_intent_id=payment_intent_id
        ).first()
        
        if order:
            # Log the dispute
            logger.warning(f"Dispute created for order {order.id}: {dispute['reason']}")
            
            # You might want to create a dispute record or notify admins
            # For now, just log it
            
        return HttpResponse("Dispute processed", status=200)
        
    except Exception as e:
        logger.error(f"Failed to handle charge dispute: {str(e)}")
        return HttpResponse(f"Dispute processing failed: {str(e)}", status=500)
