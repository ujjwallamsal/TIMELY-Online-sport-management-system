# tickets/views_stripe.py
import json
import logging
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import TicketType, TicketOrder, Ticket
from .serializers import (
    TicketTypeSerializer, CreateOrderSerializer, TicketSerializer,
    TicketOrderSerializer, MyTicketsListSerializer
)
from .services.stripe_service import stripe_service
from .services.email_service import email_service
from .services.qr_service import qr_service
from .permissions import CanPurchaseTickets, IsTicketOwnerOrAdmin
from events.models import Event

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([CanPurchaseTickets])
def create_checkout_session(request):
    """
    Create Stripe checkout session for ticket purchase
    POST /api/tickets/checkout
    """
    serializer = CreateOrderSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    
    try:
        with transaction.atomic():
            # Get event
            event = get_object_or_404(Event, id=data['event_id'])
            
            # Calculate total
            total_cents = 0
            ticket_items = []
            
            for item in data['items']:
                ticket_type = get_object_or_404(TicketType, id=item['ticket_type_id'])
                quantity = item['qty']
                
                # Validate inventory
                if not ticket_type.can_purchase(quantity):
                    return Response(
                        {'error': f'Not enough tickets available for {ticket_type.name}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                item_total = ticket_type.price_cents * quantity
                total_cents += item_total
                
                ticket_items.append({
                    'ticket_type': ticket_type,
                    'quantity': quantity,
                    'price_cents': ticket_type.price_cents,
                    'total_cents': item_total
                })
            
            # Create order
            order = TicketOrder.objects.create(
                user=request.user,
                event=event,
                fixture_id=data.get('fixture_id'),
                total_cents=total_cents,
                currency='usd',
                payment_provider=TicketOrder.Provider.STRIPE
            )
            
            # Create tickets
            tickets = []
            for item in ticket_items:
                for _ in range(item['quantity']):
                    ticket = Ticket.objects.create(
                        order=order,
                        ticket_type=item['ticket_type']
                    )
                    tickets.append(ticket)
            
            # Prepare order data for Stripe
            order_data = {
                'order_id': order.id,
                'event_id': event.id,
                'user_id': request.user.id,
                'user_email': request.user.email,
                'user_name': request.user.get_full_name() or request.user.username,
                'event_name': event.name,
                'amount_cents': total_cents,
                'currency': 'usd',
            }
            
            if data.get('fixture_id'):
                order_data['fixture_id'] = data['fixture_id']
            
            # Create Stripe PaymentIntent
            payment_data = stripe_service.create_payment_intent(order_data)
            
            # Update order with payment intent
            order.provider_payment_intent_id = payment_data['payment_intent_id']
            order.save()
            
            # Prepare response
            response_data = {
                'order_id': order.id,
                'client_secret': payment_data['client_secret'],
                'payment_intent_id': payment_data['payment_intent_id'],
                'total_cents': total_cents,
                'currency': 'usd',
                'status': payment_data['status'],
                'tickets': [
                    {
                        'id': ticket.id,
                        'serial': ticket.serial,
                        'ticket_type_name': ticket.ticket_type.name,
                        'price_cents': ticket.ticket_type.price_cents,
                    }
                    for ticket in tickets
                ]
            }
            
            logger.info(f"Created checkout session for order {order.id} with PaymentIntent {payment_data['payment_intent_id']}")
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"Checkout creation failed: {str(e)}")
        return Response(
            {'error': f'Checkout creation failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_tickets(request):
    """
    Get user's tickets
    GET /api/me/tickets
    """
    try:
        tickets = Ticket.objects.filter(
            order__user=request.user,
            order__status=TicketOrder.Status.PAID
        ).select_related(
            'ticket_type', 'order', 'order__event', 'order__fixture'
        ).order_by('-issued_at')
        
        # Apply filters
        event_id = request.query_params.get('event_id')
        if event_id:
            tickets = tickets.filter(order__event_id=event_id)
        
        status_filter = request.query_params.get('status')
        if status_filter:
            tickets = tickets.filter(status=status_filter)
        
        # Serialize tickets
        serializer = MyTicketsListSerializer(tickets, many=True)
        
        return Response({
            'tickets': serializer.data,
            'count': tickets.count()
        })
        
    except Exception as e:
        logger.error(f"Failed to get user tickets: {str(e)}")
        return Response(
            {'error': f'Failed to get tickets: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsTicketOwnerOrAdmin])
def get_ticket_qr(request, ticket_id):
    """
    Get QR code for a ticket
    GET /api/tickets/{id}/qr
    """
    try:
        ticket = get_object_or_404(Ticket, id=ticket_id)
        format_type = request.query_params.get('format', 'png')  # png or svg
        size = int(request.query_params.get('size', 200))
        
        if format_type not in ['png', 'svg']:
            return Response(
                {'error': 'Format must be png or svg'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if format_type == 'png':
            qr_data = qr_service.generate_ticket_qr_png(
                ticket.id, ticket.order.id, ticket.serial, size
            )
            return HttpResponse(qr_data, content_type='image/png')
        else:
            qr_data = qr_service.generate_ticket_qr_svg(
                ticket.id, ticket.order.id, ticket.serial, size
            )
            return HttpResponse(qr_data, content_type='image/svg+xml')
            
    except Exception as e:
        logger.error(f"Failed to generate QR code for ticket {ticket_id}: {str(e)}")
        return Response(
            {'error': f'Failed to generate QR code: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsTicketOwnerOrAdmin])
def get_ticket_qr_data(request, ticket_id):
    """
    Get QR code data for a ticket (JSON response)
    GET /api/tickets/{id}/qr/data
    """
    try:
        ticket = get_object_or_404(Ticket, id=ticket_id)
        
        qr_data = {
            'ticket_id': ticket.id,
            'serial': ticket.serial,
            'qr_payload': ticket.qr_payload,
            'qr_png_url': f'/api/tickets/{ticket.id}/qr?format=png',
            'qr_svg_url': f'/api/tickets/{ticket.id}/qr?format=svg',
            'status': ticket.status,
            'event_name': ticket.order.event.name,
            'ticket_type_name': ticket.ticket_type.name,
            'issued_at': ticket.issued_at,
            'used_at': ticket.used_at,
        }
        
        return Response(qr_data)
        
    except Exception as e:
        logger.error(f"Failed to get QR data for ticket {ticket_id}: {str(e)}")
        return Response(
            {'error': f'Failed to get QR data: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_ticket(request):
    """
    Verify a ticket by QR code
    GET /api/tickets/verify?code=...
    """
    try:
        qr_code = request.query_params.get('code')
        if not qr_code:
            return Response(
                {'error': 'QR code is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate QR code format
        qr_data = qr_service.validate_qr_data(qr_code)
        if not qr_data['valid']:
            return Response(
                {'error': qr_data['error']}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get ticket
        ticket = get_object_or_404(
            Ticket, 
            id=qr_data['ticket_id'],
            serial=qr_data['serial']
        )
        
        # Check if user has permission to verify this ticket
        if not (request.user.is_staff or 
                request.user.is_superuser or
                ticket.order.event.created_by == request.user):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Prepare verification response
        verification_data = {
            'ticket_id': ticket.id,
            'serial': ticket.serial,
            'status': ticket.status,
            'is_valid': ticket.is_valid,
            'event_name': ticket.order.event.name,
            'ticket_type_name': ticket.ticket_type.name,
            'issued_at': ticket.issued_at,
            'used_at': ticket.used_at,
            'order_id': ticket.order.id,
            'user_email': ticket.order.user.email,
            'user_name': ticket.order.user.get_full_name() or ticket.order.user.username,
        }
        
        return Response(verification_data)
        
    except Exception as e:
        logger.error(f"Ticket verification failed: {str(e)}")
        return Response(
            {'error': f'Ticket verification failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def use_ticket(request, ticket_id):
    """
    Mark a ticket as used (check-in)
    POST /api/tickets/{id}/use
    """
    try:
        ticket = get_object_or_404(Ticket, id=ticket_id)
        
        # Check permissions
        if not (request.user.is_staff or 
                request.user.is_superuser or
                ticket.order.event.created_by == request.user):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if ticket can be used
        if ticket.status == Ticket.Status.USED:
            return Response(
                {'error': 'Ticket already used'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if ticket.status == Ticket.Status.VOID:
            return Response(
                {'error': 'Ticket is void'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use ticket
        if ticket.use_ticket():
            return Response({
                'message': 'Ticket checked in successfully',
                'ticket': {
                    'id': ticket.id,
                    'serial': ticket.serial,
                    'ticket_type_name': ticket.ticket_type.name,
                    'event_name': ticket.order.event.name,
                    'used_at': ticket.used_at.isoformat()
                }
            })
        else:
            return Response(
                {'error': 'Failed to check in ticket'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        logger.error(f"Failed to use ticket {ticket_id}: {str(e)}")
        return Response(
            {'error': f'Failed to use ticket: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
