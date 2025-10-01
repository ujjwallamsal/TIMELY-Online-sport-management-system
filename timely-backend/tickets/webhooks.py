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


def handle_registration_payment(session, metadata):
    """Handle successful registration payment"""
    try:
        from registrations.models import Registration, RegistrationPaymentLog
        from notifications.models import Notification
        
        registration_id = metadata.get('registration_id')
        
        if not registration_id:
            logger.error(f"No registration_id in checkout session metadata")
            return HttpResponse("No registration_id found", status=400)
        
        with transaction.atomic():
            # Get the registration
            registration = get_object_or_404(Registration, id=registration_id)
            
            # Check if already processed
            if registration.payment_status == 'PAID':
                logger.info(f"Registration {registration_id} already processed")
                return HttpResponse("Registration already processed", status=200)
            
            # Mark registration as paid
            registration.payment_status = 'PAID'
            registration.docs = registration.docs or {}
            registration.docs['stripe_payment_intent'] = session.get('payment_intent', session['id'])
            registration.docs['stripe_session_id'] = session['id']
            registration.save()
            
            # Log the payment
            RegistrationPaymentLog.objects.create(
                registration=registration,
                provider='stripe',
                provider_ref=session.get('payment_intent', session['id']),
                kind='confirm',
                amount_cents=registration.fee_cents,
                status='succeeded'
            )
            
            # Create notification for athlete
            try:
                user = registration.applicant_user or registration.applicant
                Notification.objects.create(
                    user=user,
                    title='Payment Successful',
                    message=f'Your payment for {registration.event.name} was successful. Awaiting organizer approval.',
                    type='success',
                    link=f'/registrations/my'
                )
            except Exception as e:
                logger.warning(f"Failed to create notification: {e}")
            
            # Send realtime notification
            try:
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync
                
                channel_layer = get_channel_layer()
                if channel_layer:
                    user = registration.applicant_user or registration.applicant
                    async_to_sync(channel_layer.group_send)(
                        f"user_{user.id}",
                        {
                            "type": "registration_payment_success",
                            "registration_id": registration.id,
                            "event_name": registration.event.name,
                            "status": "pending_approval"
                        }
                    )
            except Exception as e:
                logger.warning(f"Failed to send realtime notification: {e}")
            
            # Notify organizer
            try:
                organizer = registration.event.created_by
                Notification.objects.create(
                    user=organizer,
                    title='New Registration',
                    message=f'{user.get_full_name()} registered for {registration.event.name} and payment received.',
                    type='info',
                    link=f'/registrations'
                )
            except Exception as e:
                logger.warning(f"Failed to notify organizer: {e}")
            
            logger.info(f"Registration {registration_id} payment processed successfully")
            return HttpResponse("Registration payment processed", status=200)
            
    except Exception as e:
        logger.error(f"Error handling registration payment: {str(e)}", exc_info=True)
        return HttpResponse(f"Error: {str(e)}", status=500)


def handle_checkout_session_completed(event):
    """Handle successful checkout session completion"""
    try:
        import uuid
        from .models import TicketType
        
        session = event['data']['object']
        session_id = session['id']
        metadata = session.get('metadata', {})
        checkout_type = metadata.get('type', 'ticket')  # Default to ticket for backward compatibility
        
        # Handle registration payments
        if checkout_type == 'registration':
            return handle_registration_payment(session, metadata)
        
        # Handle ticket orders
        order_id = metadata.get('order_id')
        event_id = metadata.get('event_id')
        quantity = int(metadata.get('quantity', 1))
        
        if not order_id:
            logger.error(f"No order_id in checkout session metadata: {session_id}")
            return HttpResponse("No order_id found", status=400)
        
        with transaction.atomic():
            # Get the order
            order = get_object_or_404(TicketOrder, id=order_id)
            
            # Check if already processed
            if order.status == TicketOrder.Status.PAID:
                logger.info(f"Order {order_id} already processed")
                return HttpResponse("Order already processed", status=200)
            
            # Get or create ticket type
            ticket_type, created = TicketType.objects.get_or_create(
                event_id=event_id,
                name='General Admission',
                defaults={
                    'description': 'General admission ticket',
                    'price_cents': order.total_cents // quantity,
                    'currency': order.currency,
                    'quantity_total': 1000,
                    'quantity_sold': 0,
                    'on_sale': True
                }
            )
            
            # Mark order as paid
            order.status = TicketOrder.Status.PAID
            order.provider_payment_intent_id = session.get('payment_intent', session_id)
            order.provider_session_id = session_id
            order.paid_at = timezone.now()
            order.save()
            
            # Create tickets with VALID status (payment received)
            tickets_created = []
            for i in range(quantity):
                serial = f"TKT-{uuid.uuid4().hex[:12].upper()}"
                code = f"TKT-{event_id}-{order.id}-{i+1}"
                
                ticket = Ticket.objects.create(
                    order=order,
                    ticket_type=ticket_type,
                    serial=serial,
                    code=code,
                    qr_payload=f"event:{event_id},order:{order.id},user:{order.user.id},seq:{i+1}",
                    status=Ticket.Status.VALID  # Payment received, ticket is valid
                )
                tickets_created.append({
                    'id': ticket.id,
                    'serial': ticket.serial,
                    'status': 'valid'
                })
                
            # Send realtime notification
            try:
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync
                
                channel_layer = get_channel_layer()
                if channel_layer:
                    async_to_sync(channel_layer.group_send)(
                        f"user_{order.user.id}",
                        {
                            "type": "ticket_payment_success",
                            "order_id": order.id,
                            "status": "paid",
                            "tickets_pending_approval": True,
                            "event_name": order.event.name
                        }
                    )
            except Exception as e:
                logger.warning(f"Could not send realtime notification: {e}")
            
            logger.info(f"Successfully processed checkout session {session_id} for order {order_id}, created {len(tickets_created)} tickets")
            return HttpResponse("Checkout session processed successfully", status=200)
            
    except Exception as e:
        logger.error(f"Failed to handle checkout session completion: {str(e)}", exc_info=True)
        return HttpResponse(f"Checkout processing failed: {str(e)}", status=500)


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
        
        if event_type == 'checkout.session.completed':
            return handle_checkout_session_completed(event)
        elif event_type == 'payment_intent.succeeded':
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
            
            # Send realtime notification
            try:
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync
                
                channel_layer = get_channel_layer()
                if channel_layer:
                    async_to_sync(channel_layer.group_send)(
                        f"user_{order.user.id}",
                        {
                            "type": "order_paid",
                            "order_id": order.id,
                            "status": "PAID",
                            "total_cents": order.total_cents,
                            "currency": order.currency,
                            "event_name": order.event.name
                        }
                    )
            except Exception:
                # Don't fail the webhook for realtime errors
                pass
            
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
            
            # Mark order as failed (payment cancelled)
            order.status = TicketOrder.Status.FAILED
            order.save()
            
            # Void all tickets
            for ticket in order.tickets.all():
                ticket.void_ticket()
            
            logger.info(f"Marked order {order_id} as failed (payment cancelled)")
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
