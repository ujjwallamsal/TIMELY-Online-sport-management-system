# tickets/views.py
from __future__ import annotations

import stripe
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import TicketType, TicketOrder, Ticket, PaymentRecord
from .serializers import (
    TicketTypeSerializer, TicketTypeCreateSerializer,
    TicketSerializer, TicketListSerializer,
    TicketOrderSerializer, TicketOrderCreateSerializer,
    PaymentRecordSerializer, StripeCheckoutSerializer,
    PayPalCheckoutSerializer, WebhookSerializer,
    TicketValidationSerializer
)
from .permissions import IsOrganizerOrAdmin

# Configure Stripe
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', 'sk_test_...')


class TicketTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for ticket types"""
    queryset = TicketType.objects.select_related('event').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event', 'category', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['price_cents', 'created_at']
    ordering = ['event', 'price_cents']

    def get_serializer_class(self):
        if self.action == 'create':
            return TicketTypeCreateSerializer
        return TicketTypeSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsOrganizerOrAdmin()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by event if specified
        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        # Only show active ticket types for public access
        if self.action in ['list', 'retrieve']:
            queryset = queryset.filter(is_active=True)
        
        return queryset

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle ticket type active status"""
        ticket_type = self.get_object()
        ticket_type.is_active = not ticket_type.is_active
        ticket_type.save()
        
        return Response({
            'detail': f"Ticket type {'activated' if ticket_type.is_active else 'deactivated'}",
            'is_active': ticket_type.is_active
        })


class TicketOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for ticket orders"""
    queryset = TicketOrder.objects.select_related('event', 'customer').prefetch_related('tickets').all()
    serializer_class = TicketOrderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event', 'status', 'payment_provider']
    search_fields = ['order_number', 'customer_name', 'customer_email']
    ordering_fields = ['created_at', 'payment_amount_cents']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return TicketOrderCreateSerializer
        return TicketOrderSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsOrganizerOrAdmin()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Users can only see their own orders
        if self.request.user.is_authenticated and not self.request.user.is_staff:
            if self.request.user.role not in ['ADMIN', 'ORGANIZER']:
                queryset = queryset.filter(customer=self.request.user)
        
        return queryset

    def perform_create(self, serializer):
        """Create order with current user as customer"""
        serializer.save(customer=self.request.user)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a ticket order"""
        order = self.get_object()
        
        if not order.can_cancel:
            return Response({
                'detail': 'This order cannot be cancelled'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        order.cancel()
        return Response({
            'detail': 'Order cancelled successfully',
            'status': order.status
        })

    @action(detail=True, methods=['post'])
    def stripe_checkout(self, request, pk=None):
        """Create Stripe checkout session"""
        order = self.get_object()
        
        if order.status != TicketOrder.Status.PENDING:
            return Response({
                'detail': 'Order is not pending payment'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = StripeCheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create Stripe checkout session
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': order.payment_currency.lower(),
                        'product_data': {
                            'name': f"Tickets for {order.event.name}",
                            'description': f"Order {order.order_number}",
                        },
                        'unit_amount': order.payment_amount_cents,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=serializer.validated_data['success_url'],
                cancel_url=serializer.validated_data['cancel_url'],
                metadata={
                    'order_id': order.id,
                    'order_number': order.order_number,
                },
                expires_at=int((order.expires_at.timestamp())),
            )
            
            # Create payment record
            PaymentRecord.objects.create(
                order=order,
                provider=TicketOrder.PaymentProvider.STRIPE,
                provider_reference=checkout_session.id,
                amount_cents=order.payment_amount_cents,
                currency=order.payment_currency,
                status=PaymentRecord.Status.PENDING,
                provider_data={'session_id': checkout_session.id}
            )
            
            return Response({
                'checkout_url': checkout_session.url,
                'session_id': checkout_session.id
            })
            
        except Exception as e:
            return Response({
                'detail': f'Error creating checkout session: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def paypal_checkout(self, request, pk=None):
        """Create PayPal checkout (stub implementation)"""
        order = self.get_object()
        
        if order.status != TicketOrder.Status.PENDING:
            return Response({
                'detail': 'Order is not pending payment'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = PayPalCheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Create payment record
        payment_record = PaymentRecord.objects.create(
            order=order,
            provider=TicketOrder.PaymentProvider.PAYPAL,
            provider_reference=f"PAYPAL-{order.order_number}",
            amount_cents=order.payment_amount_cents,
            currency=order.payment_currency,
            status=PaymentRecord.Status.PENDING
        )
        
        # For now, return a mock PayPal checkout URL
        # In production, this would integrate with PayPal's API
        return Response({
            'checkout_url': f"https://www.paypal.com/checkout?order={payment_record.id}",
            'payment_id': payment_record.id
        })


class TicketViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for individual tickets"""
    queryset = Ticket.objects.select_related('order', 'ticket_type').all()
    serializer_class = TicketSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['order', 'ticket_type', 'status']
    search_fields = ['ticket_id', 'holder_name', 'holder_email']
    ordering_fields = ['issued_at', 'expires_at']
    ordering = ['-issued_at']

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Users can only see their own tickets
        if not self.request.user.is_staff:
            if self.request.user.role not in ['ADMIN', 'ORGANIZER']:
                queryset = queryset.filter(order__customer=self.request.user)
        
        return queryset

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        """Validate a ticket"""
        ticket = self.get_object()
        
        if not ticket.is_valid:
            return Response({
                'detail': 'Ticket is not valid',
                'reason': 'expired' if ticket.is_expired else 'invalid_status'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark ticket as used
        if ticket.use_ticket():
            return Response({
                'detail': 'Ticket validated successfully',
                'ticket_id': ticket.ticket_id,
                'holder_name': ticket.holder_name,
                'event_name': ticket.order.event.name
            })
        else:
            return Response({
                'detail': 'Ticket validation failed'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def qr_code(self, request, pk=None):
        """Get ticket QR code"""
        ticket = self.get_object()
        
        if not ticket.qr_code:
            return Response({
                'detail': 'QR code not available'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'qr_code_url': ticket.get_qr_code_url(),
            'ticket_id': ticket.ticket_id
        })

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download ticket as PDF (stub)"""
        ticket = self.get_object()
        
        # In production, this would generate and return a PDF
        # For now, return ticket details as JSON
        return Response({
            'ticket_id': ticket.ticket_id,
            'holder_name': ticket.holder_name,
            'event_name': ticket.order.event.name,
            'ticket_type': ticket.ticket_type.name,
            'issued_at': ticket.issued_at,
            'expires_at': ticket.expires_at,
            'qr_code_url': ticket.get_qr_code_url()
        })


class PaymentRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for payment records"""
    queryset = PaymentRecord.objects.select_related('order').all()
    serializer_class = PaymentRecordSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['order', 'provider', 'status']
    ordering_fields = ['created_at', 'processed_at']
    ordering = ['-created_at']

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Users can only see payments for their own orders
        if not self.request.user.is_staff:
            if self.request.user.role not in ['ADMIN', 'ORGANIZER']:
                queryset = queryset.filter(order__customer=self.request.user)
        
        return queryset


# Webhook handlers
@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(viewsets.ViewSet):
    """Handle Stripe webhooks"""
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def stripe_webhook(self, request):
        """Handle Stripe webhook events"""
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, getattr(settings, 'STRIPE_WEBHOOK_SECRET', 'whsec_...')
            )
        except ValueError as e:
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError as e:
            return HttpResponse(status=400)
        
        # Handle the event
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            self._handle_checkout_completed(session)
        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            self._handle_payment_failed(payment_intent)
        
        return HttpResponse(status=200)

    def _handle_checkout_completed(self, session):
        """Handle successful checkout completion"""
        order_id = session.metadata.get('order_id')
        if not order_id:
            return
        
        try:
            order = TicketOrder.objects.get(id=order_id)
            payment_record = PaymentRecord.objects.get(
                order=order,
                provider_reference=session.id
            )
            
            # Mark order as paid
            order.mark_paid(
                provider=TicketOrder.PaymentProvider.STRIPE,
                reference=session.id,
                amount_cents=session.amount_total
            )
            
            # Mark payment as succeeded
            payment_record.mark_succeeded()
            
        except (TicketOrder.DoesNotExist, PaymentRecord.DoesNotExist):
            pass

    def _handle_payment_failed(self, payment_intent):
        """Handle failed payment"""
        # Find payment record and mark as failed
        try:
            payment_record = PaymentRecord.objects.get(
                provider_reference=payment_intent.id
            )
            payment_record.mark_failed(
                error_message=payment_intent.last_payment_error.message if payment_intent.last_payment_error else "",
                error_code=payment_intent.last_payment_error.code if payment_intent.last_payment_error else ""
            )
        except PaymentRecord.DoesNotExist:
            pass


@method_decorator(csrf_exempt, name='dispatch')
class PayPalWebhookView(viewsets.ViewSet):
    """Handle PayPal webhooks (stub implementation)"""
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def paypal_webhook(self, request):
        """Handle PayPal webhook events"""
        # In production, this would verify PayPal webhook signatures
        # and process payment confirmations
        
        data = request.data
        serializer = WebhookSerializer(data=data)
        
        if serializer.is_valid():
            provider_ref = serializer.validated_data['provider_reference']
            status = serializer.validated_data['status']
            
            try:
                payment_record = PaymentRecord.objects.get(
                    provider_reference=provider_ref
                )
                
                if status == 'COMPLETED':
                    payment_record.mark_succeeded()
                    payment_record.order.mark_paid(
                        provider=TicketOrder.PaymentProvider.PAYPAL,
                        reference=provider_ref,
                        amount_cents=payment_record.amount_cents
                    )
                elif status == 'FAILED':
                    payment_record.mark_failed()
                    
            except PaymentRecord.DoesNotExist:
                pass
        
        return HttpResponse(status=200)


# Public ticket validation endpoint
class TicketValidationView(viewsets.ViewSet):
    """Public endpoint for ticket validation"""
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def validate_ticket(self, request):
        """Validate a ticket using ticket_id and validation_hash"""
        serializer = TicketValidationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        ticket_id = serializer.validated_data['ticket_id']
        validation_hash = serializer.validated_data['validation_hash']
        
        try:
            ticket = Ticket.objects.get(
                ticket_id=ticket_id,
                validation_hash=validation_hash
            )
            
            if not ticket.is_valid:
                return Response({
                    'valid': False,
                    'reason': 'expired' if ticket.is_expired else 'invalid_status',
                    'message': 'Ticket is not valid for use'
                })
            
            return Response({
                'valid': True,
                'ticket_id': ticket.ticket_id,
                'holder_name': ticket.holder_name,
                'event_name': ticket.order.event.name,
                'ticket_type': ticket.ticket_type.name,
                'issued_at': ticket.issued_at,
                'expires_at': ticket.expires_at
            })
            
        except Ticket.DoesNotExist:
            return Response({
                'valid': False,
                'reason': 'not_found',
                'message': 'Ticket not found'
            }, status=status.HTTP_404_NOT_FOUND)
