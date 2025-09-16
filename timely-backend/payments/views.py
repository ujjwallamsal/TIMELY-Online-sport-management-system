# payments/views.py
from __future__ import annotations
import stripe
import json
import logging
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import PaymentIntent, WebhookEvent, Refund
from .stripe_gateway import stripe_gateway
from .provider import PaymentProviderFactory
from registrations.models import Registration
from registrations.serializers import RegistrationDetailSerializer
from django.utils import timezone
from common.security import verify_stripe_webhook_signature, log_webhook_event

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment_intent(request):
    """Create a Stripe payment intent for registration"""
    try:
        registration_id = request.data.get('registration_id')
        if not registration_id:
            return Response(
                {'error': 'registration_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get registration
        registration = get_object_or_404(Registration, id=registration_id, user=request.user)
        
        # Check if payment is required
        if not registration.requires_payment:
            return Response(
                {'error': 'This registration does not require payment'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already paid
        if registration.is_paid:
            return Response(
                {'error': 'Registration is already paid'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create Stripe payment intent
        intent_data = {
            'amount': registration.event.fee_cents,
            'currency': 'aud',
            'metadata': {
                'registration_id': registration.id,
                'event_name': registration.event.name,
                'user_email': registration.user.email
            },
            'automatic_payment_methods': {
                'enabled': True,
            },
        }
        
        # Add customer if exists
        if hasattr(registration.user, 'stripe_customer_id') and registration.user.stripe_customer_id:
            intent_data['customer'] = registration.user.stripe_customer_id
        
        intent = stripe.PaymentIntent.create(**intent_data)
        
        # Save payment intent to database
        payment_intent = PaymentIntent.objects.create(
            stripe_payment_intent_id=intent.id,
            stripe_customer_id=intent.customer,
            amount_cents=intent.amount,
            currency=intent.currency,
            status=intent.status,
            registration=registration,
            client_secret=intent.client_secret,
            metadata=intent.metadata
        )
        
        # Update registration with payment intent ID
        registration.stripe_payment_intent_id = intent.id
        if intent.customer:
            registration.stripe_customer_id = intent.customer
        registration.save()
        
        return Response({
            'client_secret': intent.client_secret,
            'payment_intent_id': intent.id,
            'amount': intent.amount,
            'currency': intent.currency
        })
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        return Response(
            {'error': 'Payment service error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Payment intent creation error: {e}")
        return Response(
            {'error': 'Failed to create payment intent'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_payment(request):
    """Confirm a payment after successful Stripe payment"""
    try:
        payment_intent_id = request.data.get('payment_intent_id')
        if not payment_intent_id:
            return Response(
                {'error': 'payment_intent_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify payment intent with Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status != 'succeeded':
            return Response(
                {'error': 'Payment not successful'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get our payment intent record
        payment_intent = get_object_or_404(
            PaymentIntent, 
            stripe_payment_intent_id=payment_intent_id
        )
        
        # Update payment intent status
        payment_intent.status = intent.status
        payment_intent.confirmed_at = timezone.now()
        payment_intent.save()
        
        # Mark registration as paid
        registration = payment_intent.registration
        registration.mark_payment_received(
            payment_intent_id,
            intent.amount,
            intent.currency
        )
        
        # Send confirmation email (implement email service)
        # send_payment_confirmation_email(registration)
        
        return Response({
            'success': True,
            'registration_id': registration.id,
            'status': registration.status,
            'message': 'Payment confirmed successfully'
        })
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        return Response(
            {'error': 'Payment service error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Payment confirmation error: {e}")
        return Response(
            {'error': 'Failed to confirm payment'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment_session(request):
    """Create payment session with specified provider"""
    try:
        order_id = request.data.get('order_id')
        provider = request.data.get('provider', 'stripe')
        
        if not order_id:
            return Response(
                {'error': 'order_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get order (assuming TicketOrder model exists)
        from tickets.models import TicketOrder
        order = get_object_or_404(TicketOrder, id=order_id, user=request.user)
        
        # Get provider
        try:
            payment_provider = PaymentProviderFactory.get_provider(provider)
        except ValueError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prepare order data
        order_data = {
            'order_id': str(order.id),
            'user_id': str(order.user.id),
            'event_id': str(order.event.id),
            'amount_cents': order.total_cents,
            'currency': order.currency,
            'customer_email': order.user.email,
            'success_url': f"{settings.FRONTEND_URL}/tickets/success?order_id={order.id}",
            'cancel_url': f"{settings.FRONTEND_URL}/tickets/cancel?order_id={order.id}",
            'items': [
                {
                    'name': f"{ticket.ticket_type.name} - {order.event.name}",
                    'description': ticket.ticket_type.description or f"Ticket for {order.event.name}",
                    'price_cents': ticket.ticket_type.price_cents,
                    'quantity': 1
                }
                for ticket in order.tickets.all()
            ]
        }
        
        # Create session
        session_data = payment_provider.create_session(order_data)
        
        # Update order with session info
        order.provider_session_id = session_data.get('session_id')
        order.payment_provider = provider
        order.save()
        
        return Response(session_data)
        
    except Exception as e:
        logger.error(f"Error creating payment session: {str(e)}")
        return Response(
            {'error': 'Failed to create payment session'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_refund(request):
    """Process refund for an order"""
    try:
        order_id = request.data.get('order_id')
        amount_cents = request.data.get('amount_cents')
        reason = request.data.get('reason', 'Refund requested')
        
        if not order_id:
            return Response(
                {'error': 'order_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get order
        from tickets.models import TicketOrder
        order = get_object_or_404(TicketOrder, id=order_id)
        
        # Check permissions (admin or order owner)
        if not (request.user.is_staff or order.user == request.user):
            return Response(
                {'error': 'You do not have permission to refund this order'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if order.status != TicketOrder.Status.PAID:
            return Response(
                {'error': 'Order is not paid'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get provider
        provider = order.payment_provider or 'stripe'
        try:
            payment_provider = PaymentProviderFactory.get_provider(provider)
        except ValueError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prepare order data for refund
        order_data = {
            'order_id': str(order.id),
            'payment_intent_id': order.provider_payment_intent_id,
            'currency': order.currency,
            'refund_reason': reason
        }
        
        # Process refund
        refund_amount = amount_cents or order.total_cents
        refund_data = payment_provider.refund(order_data, refund_amount)
        
        # Update order status
        order.status = TicketOrder.Status.REFUNDED
        order.save()
        
        return Response(refund_data)
        
    except Exception as e:
        logger.error(f"Error processing refund: {str(e)}")
        return Response(
            {'error': 'Failed to process refund'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_providers(request):
    """Get list of available payment providers"""
    providers = PaymentProviderFactory.get_available_providers()
    
    provider_info = {
        'stripe': {
            'name': 'Stripe',
            'description': 'Credit card payments',
            'supported_currencies': ['USD', 'EUR', 'GBP', 'AUD'],
            'fees': '2.9% + 30¢ per transaction'
        },
        'paypal': {
            'name': 'PayPal',
            'description': 'PayPal payments',
            'supported_currencies': ['USD', 'EUR', 'GBP', 'AUD'],
            'fees': '2.9% + fixed fee per transaction'
        },
        'offline': {
            'name': 'Bank Transfer',
            'description': 'Offline bank transfer',
            'supported_currencies': ['AUD', 'USD'],
            'fees': 'No additional fees'
        }
    }
    
    return Response({
        'providers': [
            {
                'id': provider,
                **provider_info.get(provider, {})
            }
            for provider in providers
        ]
    })


@csrf_exempt
@require_http_methods(["POST"])
def paypal_webhook(request):
    """Handle PayPal webhook events"""
    try:
        # Get PayPal provider
        paypal_provider = PaymentProviderFactory.get_provider('paypal')
        
        # Verify webhook
        if not paypal_provider.verify_webhook(request):
            logger.error("Invalid PayPal webhook signature")
            return HttpResponse(status=400)
        
        # Process webhook
        webhook_data = paypal_provider.process_webhook(request)
        
        # Handle the event
        if webhook_data.get('event_type') == 'payment_completed':
            # Update order status
            order_id = webhook_data.get('order_id')
            if order_id:
                from tickets.models import TicketOrder
                try:
                    order = TicketOrder.objects.get(id=order_id)
                    order.status = TicketOrder.Status.PAID
                    order.provider_payment_intent_id = webhook_data.get('capture_id')
                    order.save()
                    logger.info(f"Order {order_id} marked as paid via PayPal")
                except TicketOrder.DoesNotExist:
                    logger.error(f"Order {order_id} not found for PayPal webhook")
        
        return HttpResponse(status=200)
        
    except Exception as e:
        logger.error(f"Error processing PayPal webhook: {str(e)}")
        return HttpResponse(status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_offline_payment(request):
    """Confirm offline payment (admin only)"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        order_id = request.data.get('order_id')
        bank_reference = request.data.get('bank_reference')
        amount = request.data.get('amount')
        notes = request.data.get('notes', '')
        
        if not all([order_id, bank_reference, amount]):
            return Response(
                {'error': 'order_id, bank_reference, and amount are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get order
        from tickets.models import TicketOrder
        order = get_object_or_404(TicketOrder, id=order_id)
        
        # Get offline provider
        offline_provider = PaymentProviderFactory.get_provider('offline')
        
        # Confirm payment
        confirmation_data = {
            'amount': amount,
            'bank_reference': bank_reference,
            'confirmed_by': request.user.id,
            'notes': notes
        }
        
        result = offline_provider.confirm_payment(
            {'reference_number': order.provider_session_id},
            confirmation_data
        )
        
        # Update order
        order.status = TicketOrder.Status.PAID
        order.save()
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error confirming offline payment: {str(e)}")
        return Response(
            {'error': 'Failed to confirm payment'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook(request):
    """Handle Stripe webhook events with signature verification"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    # Verify webhook signature using our security utility
    is_valid, error_message = verify_stripe_webhook_signature(request)
    if not is_valid:
        logger.error(f"Webhook signature verification failed: {error_message}")
        log_webhook_event(request, 'stripe', False, {'error': error_message})
        return HttpResponse(status=400)
    
    try:
        # Parse the event
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        log_webhook_event(request, 'stripe', False, {'error': f'Invalid payload: {e}'})
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        log_webhook_event(request, 'stripe', False, {'error': f'Invalid signature: {e}'})
        return HttpResponse(status=400)
    
    # Save webhook event
    webhook_event = WebhookEvent.objects.create(
        stripe_event_id=event.id,
        event_type=event.type,
        api_version=event.api_version,
        created_at=timezone.datetime.fromtimestamp(event.created, tz=timezone.utc),
        data=event.data
    )
    
    try:
        # Log successful webhook receipt
        log_webhook_event(request, 'stripe', True, {
            'event_type': event.type,
            'event_id': event.id
        })
        
        # Handle the event
        if event.type == 'payment_intent.succeeded':
            handle_payment_succeeded(event.data.object, webhook_event)
        elif event.type == 'payment_intent.payment_failed':
            handle_payment_failed(event.data.object, webhook_event)
        elif event.type == 'charge.refunded':
            handle_refund_processed(event.data.object, webhook_event)
        else:
            logger.info(f"Unhandled event type: {event.type}")
        
        webhook_event.processed = True
        webhook_event.save()
        
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        log_webhook_event(request, 'stripe', False, {
            'event_type': event.type,
            'event_id': event.id,
            'error': str(e)
        })
        webhook_event.processing_error = str(e)
        webhook_event.save()
        return HttpResponse(status=500)
    
    return HttpResponse(status=200)


def handle_payment_succeeded(payment_intent_data, webhook_event):
    """Handle successful payment webhook"""
    try:
        # Find our payment intent record
        payment_intent = PaymentIntent.objects.get(
            stripe_payment_intent_id=payment_intent_data.id
        )
        
        # Update payment intent status
        payment_intent.status = payment_intent_data.status
        payment_intent.confirmed_at = timezone.now()
        payment_intent.save()
        
        # Mark registration as paid
        registration = payment_intent.registration
        registration.mark_payment_received(
            payment_intent_data.id,
            payment_intent_data.amount,
            payment_intent_data.currency
        )
        
        # Send confirmation email
        # send_payment_confirmation_email(registration)
        
        logger.info(f"Payment succeeded for registration {registration.id}")
        
    except PaymentIntent.DoesNotExist:
        logger.error(f"Payment intent not found: {payment_intent_data.id}")
    except Exception as e:
        logger.error(f"Error handling payment succeeded: {e}")


def handle_payment_failed(payment_intent_data, webhook_event):
    """Handle failed payment webhook"""
    try:
        payment_intent = PaymentIntent.objects.get(
            stripe_payment_intent_id=payment_intent_data.id
        )
        
        # Update payment intent status
        payment_intent.status = payment_intent_data.status
        payment_intent.save()
        
        # Update registration status if needed
        registration = payment_intent.registration
        if registration.status == Registration.Status.PAYMENT_PENDING:
            # Could implement retry logic here
            pass
        
        logger.info(f"Payment failed for registration {registration.id}")
        
    except PaymentIntent.DoesNotExist:
        logger.error(f"Payment intent not found: {payment_intent_data.id}")
    except Exception as e:
        logger.error(f"Error handling payment failed: {e}")


def handle_refund_processed(refund_data, webhook_event):
    """Handle refund webhook"""
    try:
        # Create or update refund record
        refund, created = Refund.objects.get_or_create(
            stripe_refund_id=refund_data.id,
            defaults={
                'stripe_payment_intent_id': refund_data.payment_intent,
                'amount_cents': refund_data.amount,
                'currency': refund_data.currency,
                'reason': refund_data.reason,
                'status': refund_data.status,
                'metadata': refund_data.metadata
            }
        )
        
        if not created:
            refund.status = refund_data.status
            refund.save()
        
        # Update registration if needed
        if refund_data.payment_intent:
            try:
                payment_intent = PaymentIntent.objects.get(
                    stripe_payment_intent_id=refund_data.payment_intent
                )
                registration = payment_intent.registration
                
                # Could implement logic to handle refunds
                # e.g., mark registration as cancelled, send email, etc.
                
                logger.info(f"Refund processed for registration {registration.id}")
                
            except PaymentIntent.DoesNotExist:
                logger.error(f"Payment intent not found for refund: {refund_data.payment_intent}")
        
    except Exception as e:
        logger.error(f"Error handling refund: {e}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_status(request, registration_id):
    """Get payment status for a registration"""
    try:
        registration = get_object_or_404(
            Registration, 
            id=registration_id, 
            user=request.user
        )
        
        payment_data = {
            'requires_payment': registration.requires_payment,
            'is_paid': registration.is_paid,
            'payment_status': registration.payment_status_display,
            'amount_cents': registration.event.fee_cents if registration.event.fee_cents else 0,
            'currency': 'AUD'
        }
        
        if registration.stripe_payment_intent_id:
            payment_data['payment_intent_id'] = registration.stripe_payment_intent_id
            
            # Get latest status from Stripe
            try:
                intent = stripe.PaymentIntent.retrieve(registration.stripe_payment_intent_id)
                payment_data['stripe_status'] = intent.status
                payment_data['client_secret'] = intent.client_secret
            except stripe.error.StripeError:
                payment_data['stripe_status'] = 'unknown'
        
        return Response(payment_data)
        
    except Exception as e:
        logger.error(f"Error getting payment status: {e}")
        return Response(
            {'error': 'Failed to get payment status'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Ticketing-specific payment views

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stripe_checkout(request):
    """Create Stripe checkout session for ticket order"""
    try:
        order_id = request.data.get('order_id')
        if not order_id:
            return Response(
                {'error': 'order_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get order
        from tickets.models import TicketOrder
        order = get_object_or_404(TicketOrder, id=order_id, user=request.user)
        
        # Check if order can be paid
        if order.status != TicketOrder.Status.PENDING:
            return Response(
                {'error': 'Order is not in pending status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create checkout session
        result = stripe_gateway.create_checkout_session(order, request)
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook_tickets(request):
    """Handle Stripe webhook events for ticket orders"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    # Verify webhook
    event = stripe_gateway.verify_webhook(payload, sig_header)
    if not event:
        return HttpResponse(status=400)
    
    # Handle event
    result = stripe_gateway.handle_webhook_event(event)
    
    if result['status'] == 'error':
        logger.error(f"Webhook processing error: {result['message']}")
        return HttpResponse(status=500)
    
    return HttpResponse(status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_refund(request, order_id):
    """Create refund for ticket order (stub for test mode)"""
    try:
        from tickets.models import TicketOrder
        
        # Get order
        order = get_object_or_404(TicketOrder, id=order_id)
        
        # Check permissions (admin/organizer only)
        if not (request.user.is_superuser or 
                request.user.is_staff or
                (request.user.role == 'ORGANIZER' and 
                 order.event.created_by == request.user)):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create refund
        result = stripe_gateway.create_refund(order)
        
        if result['status'] == 'error':
            return Response(
                {'error': result['message']}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Refund creation error: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
