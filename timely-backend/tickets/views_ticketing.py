# tickets/views_ticketing.py - Simplified ticketing system views
import stripe
import qrcode
import io
import hashlib
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
import json
import logging

from .models import Ticket, TicketOrder
from .serializers import (
    CheckoutSerializer, 
    TicketOrderSerializer, 
    TicketSerializer, 
    TicketVerificationSerializer
)

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout(request):
    """
    Create a Stripe PaymentIntent for ticket purchase
    POST /api/tickets/checkout
    """
    serializer = CheckoutSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    event_id = serializer.validated_data['event_id']
    amount = serializer.validated_data['amount']
    currency = serializer.validated_data.get('currency', 'USD')
    
    try:
        # Create PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=currency,
            metadata={
                'user_id': request.user.id,
                'event_id': event_id,
                'type': 'ticket_purchase'
            }
        )
        
        # Create TicketOrder record
        ticket_order = TicketOrder.objects.create(
            user=request.user,
            event_id=event_id,
            provider_payment_intent_id=intent.id,
            total_cents=amount,
            currency=currency,
            status='PENDING'
        )
        
        return Response({
            'client_secret': intent.client_secret,
            'ticket_order_id': ticket_order.id,
            'intent_id': intent.id
        }, status=status.HTTP_201_CREATED)
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error during checkout: {e}")
        return Response(
            {'error': 'Payment processing error'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Unexpected error during checkout: {e}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@require_http_methods(["POST"])
def webhook(request):
    """
    Handle Stripe webhook events
    POST /api/tickets/webhook
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        return HttpResponse(status=400)
    
    # Handle the event
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        handle_payment_succeeded(payment_intent)
    else:
        logger.info(f"Unhandled event type: {event['type']}")
    
    return HttpResponse(status=200)


def handle_payment_succeeded(payment_intent):
    """
    Handle successful payment - create ticket and send email
    """
    intent_id = payment_intent['id']
    
    try:
        # Find the purchase
        ticket_order = TicketOrder.objects.get(provider_payment_intent_id=intent_id)
        
        # Update ticket order status
        ticket_order.status = 'PAID'
        ticket_order.save()
        
        # Create ticket
        ticket = Ticket.objects.create(
            order=ticket_order,
            status=Ticket.Status.VALID
        )
        
        # Send email receipt
        send_ticket_receipt(ticket)
        
        logger.info(f"Ticket created for ticket order {ticket_order.id}: {ticket.code}")
        
    except TicketOrder.DoesNotExist:
        logger.error(f"TicketOrder not found for intent_id: {intent_id}")
    except Exception as e:
        logger.error(f"Error handling payment succeeded: {e}")


def send_ticket_receipt(ticket):
    """
    Send email receipt with ticket QR code
    """
    try:
        from django.core.mail import send_mail
        from django.template.loader import render_to_string
        
        # Generate QR code image
        qr_image = generate_qr_code_image(ticket.qr_payload)
        
        # Render email template
        context = {
            'ticket': ticket,
            'purchase': ticket.purchase,
            'user': ticket.purchase.user,
        }
        
        html_message = render_to_string('emails/ticket_receipt.html', context)
        subject = f"Your ticket for Event {ticket.purchase.event_id}"
        
        # Send email
        send_mail(
            subject=subject,
            message=f"Your ticket code: {ticket.code}",
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[ticket.purchase.user.email],
            fail_silently=False,
        )
        
        logger.info(f"Ticket receipt sent to {ticket.purchase.user.email}")
        
    except Exception as e:
        logger.error(f"Error sending ticket receipt: {e}")


def generate_qr_code_image(qr_payload, format='PNG'):
    """
    Generate QR code image from payload
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_payload)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to bytes
    img_io = io.BytesIO()
    img.save(img_io, format=format)
    img_io.seek(0)
    
    return img_io.getvalue()


class MyTicketsView(ListAPIView):
    """
    List all tickets for authenticated user
    GET /api/me/tickets
    """
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Ticket.objects.filter(
            order__user=self.request.user
        ).select_related('order')


class TicketQRView(APIView):
    """
    Get QR code image for a ticket
    GET /api/tickets/:id/qr
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, ticket_id):
        ticket = get_object_or_404(
            Ticket, 
            id=ticket_id, 
            order__user=request.user
        )
        
        # Generate QR code image
        qr_image = generate_qr_code_image(ticket.qr_payload)
        
        return HttpResponse(qr_image, content_type='image/png')


@api_view(['GET'])
def verify_ticket(request):
    """
    Verify a ticket by code
    GET /api/tickets/verify?code=...
    """
    code = request.GET.get('code')
    if not code:
        return Response(
            {'error': 'Code parameter required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        ticket = Ticket.objects.get(serial=code)
        
        # Verify ticket is valid
        if not ticket.is_valid:
            return Response({
                'valid': False,
                'message': 'Ticket is not valid',
                'status': ticket.status
            })
        
        # Verify QR payload
        expected_payload = ticket._generate_qr_payload()
        if ticket.qr_payload != expected_payload:
            return Response({
                'valid': False,
                'message': 'Invalid ticket signature'
            })
        
        return Response({
            'valid': True,
            'ticket_id': ticket.id,
            'order_id': ticket.order.id,
            'event_id': ticket.order.event_id,
            'status': ticket.status
        })
        
    except Ticket.DoesNotExist:
        return Response({
            'valid': False,
            'message': 'Ticket not found'
        })
    except Exception as e:
        logger.error(f"Error verifying ticket: {e}")
        return Response(
            {'error': 'Verification failed'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def use_ticket(request, ticket_id):
    """
    Mark a ticket as used
    POST /api/tickets/:id/use
    """
    ticket = get_object_or_404(
        Ticket, 
        id=ticket_id, 
        order__user=request.user
    )
    
    if ticket.use_ticket():
        return Response({
            'success': True,
            'message': 'Ticket marked as used',
            'ticket_id': ticket.id
        })
    else:
        return Response({
            'success': False,
            'message': 'Ticket cannot be used',
            'status': ticket.status
        }, status=status.HTTP_400_BAD_REQUEST)