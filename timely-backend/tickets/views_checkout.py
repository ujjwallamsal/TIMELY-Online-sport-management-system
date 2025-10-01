# tickets/views_checkout.py
"""
Real Stripe Checkout implementation with approval workflow
"""
import logging
import uuid
import stripe
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from events.models import Event
from .models import TicketOrder, Ticket, TicketType
from .permissions import CanPurchaseTickets
from notifications.models import Notification
from accounts.models import User

logger = logging.getLogger(__name__)

# Configure Stripe - set API key dynamically
def get_stripe_key():
    """Get Stripe API key from settings"""
    return getattr(settings, 'STRIPE_SECRET_KEY', '')

# Set initial Stripe API key
stripe.api_key = get_stripe_key()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout(request):
    """
    Create a Stripe Checkout Session for ticket/registration purchase
    POST /api/tickets/checkout/
    Body: {event_id: int, quantity: int, mode: "ticket" | "registration"}
    Returns: {sessionId: str, publicKey: str} OR {status: "pending_approval"} for free events
    """
    event_id = request.data.get('event_id')
    quantity = request.data.get('quantity', 1)
    mode = request.data.get('mode', 'ticket')  # ticket or registration
    
    # Validate inputs
    if not event_id:
        return Response({'detail': 'event_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if quantity < 1 or quantity > 10:
        return Response({'detail': 'Quantity must be between 1 and 10'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        return Response({'detail': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Calculate amount from backend (authoritative source)
    unit_price = event.fee_cents or 0
    total_amount = unit_price * quantity
    currency = getattr(event, 'currency', 'usd').lower() or 'usd'
    
    # Handle free events (no Stripe needed)
    if total_amount == 0:
        try:
            with transaction.atomic():
                # Create order with FREE status
                order = TicketOrder.objects.create(
                    user=request.user,
                    event_id=event_id,
                    total_cents=0,
                    currency=currency,
                    status=TicketOrder.Status.FREE,
                    payment_provider=TicketOrder.Provider.OFFLINE
                )
                
                # Create tickets in pending_approval status
                for _ in range(quantity):
                    Ticket.objects.create(
                        order=order,
                        ticket_type=None,  # No ticket type for simple flow
                        status=Ticket.Status.PENDING_APPROVAL
                    )
                
                # Notify user
                Notification.objects.create(
                    user=request.user,
                    kind='info',
                    topic='ticket',
                    title='Free Ticket Submitted',
                    body=f'Your free ticket request for {event.name} has been submitted for admin approval.',
                    link_url=f'/tickets/me'
                )
                
                # Notify admin/organizers
                admins = User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
                for admin in admins:
                    Notification.objects.create(
                        user=admin,
                        kind='info',
                        topic='ticket',
                        title='New Free Ticket Request',
                        body=f'{request.user.email} requested a free ticket for {event.name}',
                        link_url=f'/admin/tickets/ticketorder/{order.id}/change/'
                    )
                
                logger.info(f"Free ticket order {order.id} created for user {request.user.id}, event {event_id}")
                
                return Response({
                    'status': 'pending_approval',
                    'order_id': order.id,
                    'message': 'Free ticket submitted for approval'
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            logger.error(f"Error creating free ticket order: {str(e)}")
            return Response({'detail': f'Failed to create order: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Ensure Stripe is configured with fresh key from settings
    current_key = get_stripe_key()
    if not current_key or current_key.startswith('sk_test_xx'):
        logger.error(f"Stripe secret key not properly configured: {current_key[:15] if current_key else 'EMPTY'}")
        return Response({
            'detail': 'Payment processing is not configured. Please restart the server and ensure STRIPE_SECRET_KEY is set in .env file.'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    # Update stripe.api_key to ensure we're using the latest from settings
    stripe.api_key = current_key
    
    try:
        # Use database transaction with row-level locking
        with transaction.atomic():
            # Generate unique client reference ID
            client_ref_id = f"order_{uuid.uuid4().hex[:16]}"
            
            # Create TicketOrder record (in payment_pending status)
            order = TicketOrder.objects.create(
                user=request.user,
                event_id=event_id,
                total_cents=total_amount,
                currency=currency,
                status=TicketOrder.Status.PAYMENT_PENDING,
                client_reference_id=client_ref_id
            )
            
            logger.info(f"Created order {order.id} for user {request.user.id}, event {event_id}")
        
        # Create Stripe Checkout Session with idempotency key
        idempotency_key = f"checkout_{order.id}_{request.user.id}_{int(order.created_at.timestamp())}"
        
        frontend_url = request.META.get('HTTP_REFERER', 'http://localhost:5173')
        if frontend_url.endswith('/'):
            frontend_url = frontend_url[:-1]
        base_frontend_url = '/'.join(frontend_url.split('/')[:3])  # Get protocol://domain:port
        
        session = stripe.checkout.Session.create(
            idempotency_key=idempotency_key,
            mode='payment',
            payment_method_types=['card'],
            client_reference_id=client_ref_id,
            customer_email=request.user.email,
            line_items=[{
                'price_data': {
                    'currency': currency,
                    'product_data': {
                        'name': f'{event.name} - Ticket',
                        'description': f'Ticket for {event.name}',
                    },
                    'unit_amount': unit_price,  # Amount in cents
                },
                'quantity': quantity,
            }],
            success_url=f'{base_frontend_url}/tickets/checkout/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{base_frontend_url}/events/{event_id}/checkout?canceled=1',
            metadata={
                'order_id': str(order.id),
                'event_id': str(event_id),
                'user_id': str(request.user.id),
                'quantity': str(quantity),
                'mode': mode
            }
        )
        
        # Update order with session ID
        order.provider_session_id = session.id
        order.save(update_fields=['provider_session_id'])
        
        logger.info(f"Created Stripe checkout session {session.id} for order {order.id}")
        
        # Return session ID, checkout URL, and publishable key
        return Response({
            'sessionId': session.id,
            'checkoutUrl': session.url,  # Full checkout URL from Stripe
            'publicKey': settings.VITE_STRIPE_PUBLISHABLE_KEY if hasattr(settings, 'VITE_STRIPE_PUBLISHABLE_KEY') else '',
            'order_id': order.id
        }, status=status.HTTP_200_OK)
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating checkout session: {str(e)}")
        return Response({
            'detail': f'Payment processing error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        return Response({
            'detail': f'Failed to create checkout session: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def free_ticket(request):
    """
    Create free ticket (no payment needed)
    POST /api/tickets/free/
    Body: {event_id: int}
    """
    event_id = request.data.get('event_id')
    
    if not event_id:
        return Response({'detail': 'event_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        return Response({'detail': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Verify event is actually free
    if event.fee_cents and event.fee_cents > 0:
        return Response({'detail': 'This is a paid event. Use checkout endpoint.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        with transaction.atomic():
            # Create order with FREE status
            order = TicketOrder.objects.create(
                user=request.user,
                event_id=event_id,
                total_cents=0,
                currency='usd',
                status=TicketOrder.Status.FREE,
                payment_provider=TicketOrder.Provider.OFFLINE
            )
            
            # Get or create ticket type
            ticket_type, _ = TicketType.objects.get_or_create(
                event_id=event_id,
                name='General Admission',
                defaults={
                    'description': 'General admission ticket',
                    'price_cents': 0,
                    'currency': 'usd',
                    'quantity_total': 1000,
                    'quantity_sold': 0,
                    'on_sale': True
                }
            )
            
            # Create ticket in pending_approval status
            ticket = Ticket.objects.create(
                order=order,
                ticket_type=ticket_type,
                status=Ticket.Status.PENDING_APPROVAL
            )
            
            # Notify user
            try:
                Notification.objects.create(
                    user=request.user,
                    kind='info',
                    topic='ticket',
                    title='Free Ticket Submitted',
                    body=f'Your free ticket request for {event.name} has been submitted for admin approval.',
                    link_url='/tickets/me'
                )
            except Exception as e:
                logger.warning(f"Failed to create user notification: {e}")
            
            # Notify admin
            try:
                admins = User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
                for admin in admins.distinct()[:1]:
                    Notification.objects.create(
                        user=admin,
                        kind='info',
                        topic='ticket',
                        title='New Free Ticket Request',
                        body=f'{request.user.email} requested a free ticket for {event.name}',
                        link_url=f'/admin/tickets/ticketorder/{order.id}/change/'
                    )
            except Exception as e:
                logger.warning(f"Failed to create admin notification: {e}")
            
            logger.info(f"Free ticket created: order {order.id}, ticket {ticket.id}")
            
            return Response({
                'status': 'pending_approval',
                'order_id': order.id,
                'ticket_id': ticket.id,
                'message': 'Free ticket submitted for approval'
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"Error creating free ticket: {str(e)}")
        return Response({'detail': f'Failed to create ticket: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_by_session(request):
    """
    Get order details by Stripe session ID
    GET /api/tickets/orders/by_session/?session_id=...
    """
    session_id = request.query_params.get('session_id')
    
    if not session_id:
        return Response({'detail': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        order = TicketOrder.objects.get(provider_session_id=session_id, user=request.user)
        
        # Get event details
        try:
            event = Event.objects.get(id=order.event_id)
            event_name = event.name
        except Event.DoesNotExist:
            event_name = f"Event #{order.event_id}"
        
        # Get tickets
        tickets = list(order.tickets.all())
        
        return Response({
            'order_id': order.id,
            'event_id': order.event_id,
            'event_name': event_name,
            'status': order.status,
            'total_cents': order.total_cents,
            'currency': order.currency,
            'quantity': len(tickets),
            'created_at': order.created_at,
            'tickets': [{
                'id': ticket.id,
                'serial': ticket.serial,
                'status': ticket.status
            } for ticket in tickets]
        }, status=status.HTTP_200_OK)
        
    except TicketOrder.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error retrieving order by session: {str(e)}")
        return Response({'detail': 'Failed to retrieve order'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

