# tickets/serializers.py
from __future__ import annotations

from rest_framework import serializers
from django.utils import timezone
from django.db import transaction

from .models import TicketType, TicketOrder, Ticket, PaymentRecord
from events.serializers import EventSerializer
from accounts.serializers import UserSerializer


class TicketTypeSerializer(serializers.ModelSerializer):
    """Serializer for ticket types"""
    event_detail = EventSerializer(source='event', read_only=True)
    price_dollars = serializers.ReadOnlyField()
    available_quantity = serializers.ReadOnlyField()
    is_available = serializers.ReadOnlyField()
    is_sold_out = serializers.ReadOnlyField()
    
    class Meta:
        model = TicketType
        fields = [
            'id', 'event', 'event_detail', 'name', 'category', 'description',
            'price_cents', 'price_dollars', 'currency', 'total_quantity',
            'sold_quantity', 'available_quantity', 'max_per_order',
            'sale_start', 'sale_end', 'includes_seating', 'includes_amenities',
            'is_transferable', 'is_active', 'is_available', 'is_sold_out',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'sold_quantity', 'price_dollars', 'available_quantity',
            'is_available', 'is_sold_out', 'created_at', 'updated_at'
        ]


class TicketTypeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating ticket types"""
    class Meta:
        model = TicketType
        fields = [
            'event', 'name', 'category', 'description', 'price_cents',
            'currency', 'total_quantity', 'max_per_order', 'sale_start',
            'sale_end', 'includes_seating', 'includes_amenities', 'is_transferable'
        ]

    def validate(self, data):
        """Validate ticket type data"""
        if data.get('sale_start') and data.get('sale_end'):
            if data['sale_start'] >= data['sale_end']:
                raise serializers.ValidationError(
                    "Sale start time must be before sale end time"
                )
        
        if data.get('price_cents', 0) < 0:
            raise serializers.ValidationError("Price cannot be negative")
        
        if data.get('total_quantity', 0) <= 0:
            raise serializers.ValidationError("Total quantity must be greater than 0")
        
        return data


class TicketSerializer(serializers.ModelSerializer):
    """Serializer for individual tickets"""
    ticket_type_detail = TicketTypeSerializer(source='ticket_type', read_only=True)
    order_detail = serializers.SerializerMethodField()
    qr_code_url = serializers.SerializerMethodField()
    is_valid = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_id', 'order', 'order_detail', 'ticket_type',
            'ticket_type_detail', 'status', 'issued_at', 'used_at', 'expires_at',
            'holder_name', 'holder_email', 'seat_number', 'section',
            'qr_code', 'qr_code_url', 'validation_hash', 'notes',
            'is_valid', 'is_expired', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'ticket_id', 'issued_at', 'validation_hash',
            'is_valid', 'is_expired', 'created_at', 'updated_at'
        ]

    def get_order_detail(self, obj):
        """Get order details"""
        return {
            'order_number': obj.order.order_number,
            'status': obj.order.status,
            'created_at': obj.order.created_at
        }

    def get_qr_code_url(self, obj):
        """Get QR code URL"""
        return obj.get_qr_code_url()


class TicketOrderSerializer(serializers.ModelSerializer):
    """Serializer for ticket orders"""
    event_detail = EventSerializer(source='event', read_only=True)
    customer_detail = UserSerializer(source='customer', read_only=True)
    tickets = TicketSerializer(many=True, read_only=True)
    payment_amount_dollars = serializers.ReadOnlyField()
    total_tickets = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    can_cancel = serializers.ReadOnlyField()
    
    class Meta:
        model = TicketOrder
        fields = [
            'id', 'order_number', 'customer', 'customer_detail', 'event',
            'event_detail', 'status', 'created_at', 'updated_at', 'expires_at',
            'payment_provider', 'provider_reference', 'payment_amount_cents',
            'payment_amount_dollars', 'payment_currency', 'payment_date',
            'customer_name', 'customer_email', 'customer_phone', 'notes',
            'tickets', 'total_tickets', 'is_expired', 'can_cancel'
        ]
        read_only_fields = [
            'id', 'order_number', 'created_at', 'updated_at',
            'payment_amount_dollars', 'total_tickets', 'is_expired', 'can_cancel'
        ]


class TicketOrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating ticket orders"""
    tickets = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of tickets to purchase"
    )
    
    class Meta:
        model = TicketOrder
        fields = [
            'event', 'customer_name', 'customer_email', 'customer_phone',
            'notes', 'tickets'
        ]

    def validate(self, data):
        """Validate order data"""
        event = data.get('event')
        tickets_data = data.get('tickets', [])
        
        if not tickets_data:
            raise serializers.ValidationError("At least one ticket must be specified")
        
        # Validate each ticket
        total_amount = 0
        for ticket_data in tickets_data:
            ticket_type_id = ticket_data.get('ticket_type')
            quantity = ticket_data.get('quantity', 1)
            holder_name = ticket_data.get('holder_name')
            
            if not ticket_type_id:
                raise serializers.ValidationError("Ticket type is required for each ticket")
            
            if not holder_name:
                raise serializers.ValidationError("Holder name is required for each ticket")
            
            try:
                ticket_type = TicketType.objects.get(id=ticket_type_id, event=event)
            except TicketType.DoesNotExist:
                raise serializers.ValidationError(f"Invalid ticket type: {ticket_type_id}")
            
            if not ticket_type.can_purchase(quantity):
                raise serializers.ValidationError(
                    f"Cannot purchase {quantity} tickets of type '{ticket_type.name}'"
                )
            
            total_amount += ticket_type.price_cents * quantity
        
        # Set total amount
        data['payment_amount_cents'] = total_amount
        data['payment_currency'] = 'USD'  # Default currency
        
        return data

    @transaction.atomic
    def create(self, validated_data):
        """Create ticket order with tickets"""
        tickets_data = validated_data.pop('tickets')
        
        # Create order
        order = TicketOrder.objects.create(
            **validated_data,
            expires_at=timezone.now() + timezone.timedelta(hours=24)  # 24 hour expiry
        )
        
        # Create tickets
        for ticket_data in tickets_data:
            ticket_type_id = ticket_data['ticket_type']
            quantity = ticket_data.get('quantity', 1)
            holder_name = ticket_data['holder_name']
            holder_email = ticket_data.get('holder_email', validated_data['customer_email'])
            
            ticket_type = TicketType.objects.get(id=ticket_type_id)
            
            for _ in range(quantity):
                Ticket.objects.create(
                    order=order,
                    ticket_type=ticket_type,
                    holder_name=holder_name,
                    holder_email=holder_email,
                    expires_at=order.event.end_date
                )
        
        return order


class PaymentRecordSerializer(serializers.ModelSerializer):
    """Serializer for payment records"""
    order_detail = serializers.SerializerMethodField()
    amount_dollars = serializers.ReadOnlyField()
    
    class Meta:
        model = PaymentRecord
        fields = [
            'id', 'order', 'order_detail', 'provider', 'provider_reference',
            'amount_cents', 'amount_dollars', 'currency', 'status',
            'created_at', 'updated_at', 'processed_at', 'provider_data',
            'error_message', 'error_code'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'amount_dollars'
        ]

    def get_order_detail(self, obj):
        """Get order details"""
        return {
            'order_number': obj.order.order_number,
            'customer_name': obj.order.customer_name,
            'event_name': obj.order.event.name
        }


class StripeCheckoutSerializer(serializers.Serializer):
    """Serializer for Stripe checkout"""
    order_id = serializers.IntegerField()
    success_url = serializers.URLField()
    cancel_url = serializers.URLField()


class PayPalCheckoutSerializer(serializers.Serializer):
    """Serializer for PayPal checkout"""
    order_id = serializers.IntegerField()
    return_url = serializers.URLField()
    cancel_url = serializers.URLField()


class WebhookSerializer(serializers.Serializer):
    """Serializer for webhook data"""
    provider = serializers.ChoiceField(choices=TicketOrder.PaymentProvider.choices)
    provider_reference = serializers.CharField()
    status = serializers.CharField()
    amount_cents = serializers.IntegerField(required=False)
    currency = serializers.CharField(required=False)
    metadata = serializers.JSONField(required=False)


class TicketValidationSerializer(serializers.Serializer):
    """Serializer for ticket validation"""
    ticket_id = serializers.CharField()
    validation_hash = serializers.CharField()


class TicketListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for ticket lists"""
    event_name = serializers.CharField(source='order.event.name', read_only=True)
    ticket_type_name = serializers.CharField(source='ticket_type.name', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_id', 'event_name', 'ticket_type_name',
            'order_number', 'holder_name', 'status', 'status_display',
            'issued_at', 'expires_at', 'is_valid'
        ]
