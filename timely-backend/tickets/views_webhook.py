# tickets/views_webhook.py
"""
Stripe webhook handler for ticket/registration payments
"""
import logging
import stripe
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import TicketOrder, Ticket
from registrations.models import Registration, RegistrationPaymentLog
from notifications.models import Notification
from accounts.models import User

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY if hasattr(settings, 'STRIPE_SECRET_KEY') else ''


@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook(request):
    """
    Handle Stripe webhook events
    POST /api/stripe/webhook/
    No authentication required (signature verified instead)
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')
    
    if not webhook_secret:
        logger.warning("STRIPE_WEBHOOK_SECRET not configured - accepting all webhooks in development mode")
        # In development without webhook secret, parse the event directly
        try:
            event = stripe.Event.construct_from(
                stripe.util.convert_to_stripe_object(request.body, None, None),
                stripe.api_key
            )
        except Exception as e:
            logger.error(f"Error parsing webhook payload: {str(e)}")
            return HttpResponse(status=400)
    else:
        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {str(e)}")
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {str(e)}")
            return HttpResponse(status=400)
    
    logger.info(f"Received Stripe webhook event: {event['type']}, ID: {event.get('id')}")
    
    # Handle the event
    try:
        if event['type'] == 'checkout.session.completed':
            handle_checkout_session_completed(event['data']['object'])
        elif event['type'] == 'payment_intent.payment_failed':
            handle_payment_failed(event['data']['object'])
        else:
            logger.info(f"Unhandled event type: {event['type']}")
    
    except Exception as e:
        logger.error(f"Error processing webhook {event.get('id')}: {str(e)}", exc_info=True)
        return HttpResponse(status=500)
    
    return HttpResponse(status=200)


def handle_checkout_session_completed(session):
    """Handle successful checkout session completion"""
    try:
        logger.info(f"Processing checkout.session.completed: {session['id']}")
        
        metadata = session.get('metadata', {})
        mode = metadata.get('mode', 'ticket')
        
        if mode == 'registration':
            handle_registration_payment(session, metadata)
        else:
            handle_ticket_payment(session, metadata)
            
    except Exception as e:
        logger.error(f"Error in handle_checkout_session_completed: {str(e)}", exc_info=True)
        raise


def handle_ticket_payment(session, metadata):
    """Handle successful ticket payment"""
    try:
        # Get order by client_reference_id
        client_ref_id = session.get('client_reference_id')
        if not client_ref_id:
            logger.error(f"No client_reference_id in session {session['id']}")
            return
        
        with transaction.atomic():
            try:
                order = TicketOrder.objects.select_for_update().get(
                    client_reference_id=client_ref_id
                )
            except TicketOrder.DoesNotExist:
                logger.error(f"Order not found for client_reference_id: {client_ref_id}")
                return
            
            # Check if already processed
            if order.status == TicketOrder.Status.PAID:
                logger.info(f"Order {order.id} already marked as paid")
                return
            
            # Update order status
            order.status = TicketOrder.Status.PAID
            order.provider_payment_intent_id = session.get('payment_intent', '')
            order.save(update_fields=['status', 'provider_payment_intent_id'])
            
            # Get quantity from metadata
            quantity = int(metadata.get('quantity', 1))
            
            # Create tickets in pending_approval status
            from events.models import Event
            try:
                event = Event.objects.get(id=order.event_id)
                event_name = event.name
            except Event.DoesNotExist:
                event_name = f"Event #{order.event_id}"
            
            for _ in range(quantity):
                Ticket.objects.create(
                    order=order,
                    ticket_type=None,  # Simple flow without ticket types
                    status=Ticket.Status.PENDING_APPROVAL
                )
            
            logger.info(f"Created {quantity} tickets for order {order.id}")
            
            # Notify user
            Notification.objects.create(
                user=order.user,
                kind='success',
                topic='payment',
                title='Payment Successful',
                body=f'Your payment for {event_name} was successful. Your order is submitted for admin approval.',
                link_url='/tickets/me'
            )
            
            # Notify admin/organizers
            admins = User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
            for admin in admins.distinct():
                Notification.objects.create(
                    user=admin,
                    kind='info',
                    topic='ticket',
                    title='New Order Pending Approval',
                    body=f'New paid order from {order.user.email} for {event_name}',
                    link_url=f'/admin/tickets/ticketorder/{order.id}/change/'
                )
            
            logger.info(f"Order {order.id} marked as paid and notifications sent")
            
    except Exception as e:
        logger.error(f"Error in handle_ticket_payment: {str(e)}", exc_info=True)
        raise


def handle_registration_payment(session, metadata):
    """Handle successful registration payment"""
    try:
        registration_id = metadata.get('registration_id')
        if not registration_id:
            logger.error("No registration_id in session metadata")
            return
        
        with transaction.atomic():
            try:
                registration = Registration.objects.select_for_update().get(id=registration_id)
            except Registration.DoesNotExist:
                logger.error(f"Registration not found: {registration_id}")
                return
            
            # Check if already processed
            if registration.payment_status == 'PAID':
                logger.info(f"Registration {registration_id} already marked as paid")
                return
            
            # Update registration payment status
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
            
            # Notify athlete/team
            user = registration.applicant_user or registration.applicant
            if user:
                Notification.objects.create(
                    user=user,
                    kind='success',
                    topic='payment',
                    title='Registration Payment Successful',
                    body=f'Your payment for {registration.event.name} was successful. Your registration is pending approval.',
                    link_url='/registrations/mine'
                )
            
            # Notify admin
            admins = User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
            for admin in admins.distinct():
                Notification.objects.create(
                    user=admin,
                    kind='info',
                    topic='registration',
                    title='New Registration Pending Approval',
                    body=f'New paid registration for {registration.event.name}',
                    link_url=f'/admin/registrations/registration/{registration.id}/change/'
                )
            
            logger.info(f"Registration {registration_id} payment processed successfully")
            
    except Exception as e:
        logger.error(f"Error in handle_registration_payment: {str(e)}", exc_info=True)
        raise


def handle_payment_failed(payment_intent):
    """Handle failed payment"""
    try:
        logger.info(f"Processing payment_intent.payment_failed: {payment_intent['id']}")
        
        metadata = payment_intent.get('metadata', {})
        order_id = metadata.get('order_id')
        
        if not order_id:
            logger.warning(f"No order_id in payment_intent metadata: {payment_intent['id']}")
            return
        
        with transaction.atomic():
            try:
                order = TicketOrder.objects.select_for_update().get(id=order_id)
            except TicketOrder.DoesNotExist:
                logger.error(f"Order not found: {order_id}")
                return
            
            # Update order status to failed
            order.status = TicketOrder.Status.FAILED
            order.provider_payment_intent_id = payment_intent['id']
            order.save(update_fields=['status', 'provider_payment_intent_id'])
            
            # Notify user
            Notification.objects.create(
                user=order.user,
                kind='error',
                topic='payment',
                title='Payment Failed',
                body='Your payment could not be processed. Please try again or contact support.',
                link_url=f'/events/{order.event_id}/checkout'
            )
            
            logger.info(f"Order {order_id} marked as failed")
            
    except Exception as e:
        logger.error(f"Error in handle_payment_failed: {str(e)}", exc_info=True)
        raise

