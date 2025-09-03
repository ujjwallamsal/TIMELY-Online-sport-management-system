# tickets/views.py
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.contrib.auth import get_user_model

from .models import TicketType, TicketOrder, Ticket
from .serializers import (
    TicketTypeSerializer, TicketTypeCreateSerializer,
    TicketOrderSerializer, CreateOrderSerializer,
    TicketSerializer, MyTicketsListSerializer,
    TicketDetailSerializer, OrderSummarySerializer
)
from .permissions import (
    IsOrganizerOrAdmin, IsEventOrganizerOrAdmin, IsTicketOwnerOrAdmin,
    IsOrderOwnerOrAdmin, CanViewTicketTypes, CanPurchaseTickets,
    IsEventOrganizerForOrder, CanCancelOrder, PublicReadOrAuthenticatedWrite
)
from .services.pricing import calculate_order_total, validate_inventory
from .services.qr import generate_qr_payload

User = get_user_model()


class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination for ticket views"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# Public/Authenticated Views

class TicketTypeListView(generics.ListAPIView):
    """
    List ticket types for an event (public read access)
    """
    serializer_class = TicketTypeSerializer
    permission_classes = [CanViewTicketTypes]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        event_id = self.kwargs['event_id']
        fixture_id = self.request.query_params.get('fixture_id')
        
        queryset = TicketType.objects.filter(
            event_id=event_id,
            on_sale=True
        ).select_related('event', 'fixture')
        
        if fixture_id:
            queryset = queryset.filter(fixture_id=fixture_id)
        
        return queryset.order_by('price_cents')


class MyTicketsListView(generics.ListAPIView):
    """
    List user's tickets
    """
    serializer_class = MyTicketsListSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return Ticket.objects.filter(
            order__user=self.request.user
        ).select_related('ticket_type', 'order', 'order__event', 'order__fixture')


class TicketDetailView(generics.RetrieveAPIView):
    """
    Get detailed ticket information (owner only)
    """
    serializer_class = TicketDetailSerializer
    permission_classes = [IsTicketOwnerOrAdmin]
    
    def get_queryset(self):
        return Ticket.objects.select_related(
            'ticket_type', 'order', 'order__event', 'order__fixture'
        )


# Order Management Views

@api_view(['POST'])
@permission_classes([CanPurchaseTickets])
def create_order(request):
    """
    Create a new ticket order
    """
    serializer = CreateOrderSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    
    try:
        with transaction.atomic():
            # Calculate total
            total_cents, currency = calculate_order_total(data['items'])
            
            # Create order
            order = TicketOrder.objects.create(
                user=request.user,
                event_id=data['event_id'],
                fixture_id=data.get('fixture_id'),
                total_cents=total_cents,
                currency=currency
            )
            
            # Create tickets
            for item in data['items']:
                ticket_type_id = item['ticket_type_id']
                quantity = item['qty']
                
                for _ in range(quantity):
                    ticket = Ticket.objects.create(
                        order=order,
                        ticket_type_id=ticket_type_id
                    )
                    # Generate QR payload
                    ticket.qr_payload = generate_qr_payload(
                        ticket.id, order.id, ticket.serial
                    )
                    ticket.save()
            
            # Return order summary
            order_serializer = TicketOrderSerializer(order)
            return Response(order_serializer.data, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class OrderDetailView(generics.RetrieveAPIView):
    """
    Get order details (owner only)
    """
    serializer_class = TicketOrderSerializer
    permission_classes = [IsOrderOwnerOrAdmin]
    
    def get_queryset(self):
        return TicketOrder.objects.select_related(
            'user', 'event', 'fixture'
        ).prefetch_related('tickets', 'tickets__ticket_type')


@api_view(['POST'])
@permission_classes([CanCancelOrder])
def cancel_order(request, order_id):
    """
    Cancel an order (owner or admin/organizer)
    """
    order = get_object_or_404(TicketOrder, id=order_id)
    
    # Check permissions
    if not (request.user.is_superuser or 
            request.user.is_staff or 
            order.user == request.user or
            (request.user.role == User.Role.ORGANIZER and 
             order.event.created_by == request.user)):
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    if not order.can_cancel:
        return Response(
            {'error': 'Order cannot be cancelled'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Cancel order
    order.cancel()
    
    # TODO: Implement refund logic for paid orders
    if order.status == TicketOrder.Status.PAID:
        # Stub for refund - in test mode, just mark as cancelled
        pass
    
    return Response(
        {'message': 'Order cancelled successfully'}, 
        status=status.HTTP_200_OK
    )


# Organizer/Admin Views

class TicketTypeCreateView(generics.CreateAPIView):
    """
    Create ticket types (organizer/admin only)
    """
    serializer_class = TicketTypeCreateSerializer
    permission_classes = [IsEventOrganizerOrAdmin]
    
    def perform_create(self, serializer):
        serializer.save()


class TicketTypeUpdateView(generics.UpdateAPIView):
    """
    Update ticket types (organizer/admin only)
    """
    serializer_class = TicketTypeCreateSerializer
    permission_classes = [IsEventOrganizerOrAdmin]
    
    def get_queryset(self):
        return TicketType.objects.select_related('event', 'fixture')


class TicketTypeDeleteView(generics.DestroyAPIView):
    """
    Delete ticket types (organizer/admin only)
    """
    permission_classes = [IsEventOrganizerOrAdmin]
    
    def get_queryset(self):
        return TicketType.objects.select_related('event', 'fixture')


class EventOrdersListView(generics.ListAPIView):
    """
    List orders for an event (organizer/admin only)
    """
    serializer_class = TicketOrderSerializer
    permission_classes = [IsEventOrganizerForOrder]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        event_id = self.kwargs['event_id']
        status_filter = self.request.query_params.get('status')
        
        queryset = TicketOrder.objects.filter(
            event_id=event_id
        ).select_related('user', 'event', 'fixture').prefetch_related('tickets')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')


# Utility Views

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_summary(request, order_id):
    """
    Get order summary for checkout
    """
    order = get_object_or_404(TicketOrder, id=order_id, user=request.user)
    
    # Build items summary
    items = []
    for ticket in order.tickets.all():
        items.append({
            'ticket_type_name': ticket.ticket_type.name,
            'price_cents': ticket.ticket_type.price_cents,
            'quantity': 1  # Each ticket is individual
        })
    
    summary_data = {
        'order_id': order.id,
        'total_cents': order.total_cents,
        'total_dollars': order.total_dollars,
        'currency': order.currency,
        'items': items,
        'event_name': order.event.name,
        'fixture_info': {
            'id': order.fixture.id,
            'starts_at': order.fixture.starts_at,
            'ends_at': order.fixture.ends_at
        } if order.fixture else None
    }
    
    serializer = OrderSummarySerializer(summary_data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ticket_validation(request, ticket_id):
    """
    Validate a ticket (for scanning/check-in)
    """
    ticket = get_object_or_404(Ticket, id=ticket_id)
    
    # Check if user has permission to validate this ticket
    if not (request.user.is_superuser or 
            request.user.is_staff or
            ticket.order.event.created_by == request.user):
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    validation_data = {
        'ticket_id': ticket.id,
        'serial': ticket.serial,
        'status': ticket.status,
        'is_valid': ticket.is_valid,
        'event_name': ticket.order.event.name,
        'ticket_type': ticket.ticket_type.name,
        'issued_at': ticket.issued_at,
        'used_at': ticket.used_at
    }
    
    return Response(validation_data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def use_ticket(request, ticket_id):
    """
    Mark a ticket as used (for check-in)
    """
    ticket = get_object_or_404(Ticket, id=ticket_id)
    
    # Check if user has permission to use this ticket
    if not (request.user.is_superuser or 
            request.user.is_staff or
            ticket.order.event.created_by == request.user):
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    if ticket.use_ticket():
        return Response(
            {'message': 'Ticket marked as used'}, 
            status=status.HTTP_200_OK
        )
    else:
        return Response(
            {'error': 'Ticket cannot be used'}, 
            status=status.HTTP_400_BAD_REQUEST
        )