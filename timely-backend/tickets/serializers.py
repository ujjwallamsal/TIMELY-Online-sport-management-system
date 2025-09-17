# tickets/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Purchase, Ticket, TicketType, TicketOrder
from .services.pricing import format_price

User = get_user_model()


class PurchaseSerializer(serializers.ModelSerializer):
    """Serializer for Purchase model"""
    
    amount_dollars = serializers.ReadOnlyField()
    event_name = serializers.CharField(source='event.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Purchase
        fields = [
            'id', 'user', 'user_email', 'event', 'event_name',
            'intent_id', 'status', 'amount', 'amount_dollars', 'currency',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TicketSerializer(serializers.ModelSerializer):
    """Serializer for simplified Ticket model"""
    
    event_name = serializers.CharField(source='purchase.event.name', read_only=True)
    purchase_status = serializers.CharField(source='purchase.status', read_only=True)
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'purchase', 'code', 'status', 'qr_payload',
            'event_name', 'purchase_status', 'created_at', 'used_at'
        ]
        read_only_fields = ['id', 'code', 'qr_payload', 'created_at']


class CheckoutSerializer(serializers.Serializer):
    """Serializer for checkout request"""
    
    event_id = serializers.IntegerField()
    amount = serializers.IntegerField(min_value=1, help_text="Amount in cents")
    currency = serializers.CharField(max_length=3, default='USD')
    
    def validate_event_id(self, value):
        """Validate event exists"""
        from events.models import Event
        try:
            Event.objects.get(id=value)
        except Event.DoesNotExist:
            raise serializers.ValidationError("Event not found")
        return value


class TicketVerificationSerializer(serializers.Serializer):
    """Serializer for ticket verification"""
    
    code = serializers.CharField(max_length=50)
    
    def validate_code(self, value):
        """Validate ticket code format"""
        if not value.startswith('TKT-'):
            raise serializers.ValidationError("Invalid ticket code format")
        return value


class TicketTypeSerializer(serializers.ModelSerializer):
    """Serializer for ticket types"""
    
    price_dollars = serializers.ReadOnlyField()
    available_quantity = serializers.ReadOnlyField()
    is_available = serializers.ReadOnlyField()
    
    class Meta:
        model = TicketType
        fields = [
            'id', 'event', 'fixture', 'name', 'description',
            'price_cents', 'price_dollars', 'currency',
            'quantity_total', 'quantity_sold', 'available_quantity',
            'on_sale', 'is_available', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'quantity_sold']


class TicketTypeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating ticket types (organizer/admin only)"""
    
    class Meta:
        model = TicketType
        fields = [
            'event', 'fixture', 'name', 'description',
            'price_cents', 'currency', 'quantity_total', 'on_sale'
        ]
    
    def validate(self, data):
        """Validate ticket type data"""
        # Ensure either event or fixture is provided, not both
        if data.get('event') and data.get('fixture'):
            if data['fixture'].event != data['event']:
                raise serializers.ValidationError(
                    "Fixture must belong to the specified event"
                )
        elif not data.get('event') and not data.get('fixture'):
            raise serializers.ValidationError(
                "Either event or fixture must be specified"
            )
        
        return data


class TicketSerializer(serializers.ModelSerializer):
    """Serializer for individual tickets"""
    
    ticket_type_name = serializers.CharField(source='ticket_type.name', read_only=True)
    event_name = serializers.CharField(source='order.event.name', read_only=True)
    fixture_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'order', 'ticket_type', 'ticket_type_name',
            'qr_payload', 'serial', 'status',
            'issued_at', 'used_at', 'event_name', 'fixture_info'
        ]
        read_only_fields = ['id', 'qr_payload', 'serial', 'issued_at']
    
    def get_fixture_info(self, obj):
        """Get fixture information if applicable"""
        if obj.order.fixture:
            return {
                'id': obj.order.fixture.id,
                'starts_at': obj.order.fixture.starts_at,
                'ends_at': obj.order.fixture.ends_at,
                'venue': obj.order.fixture.venue.name if obj.order.fixture.venue else None
            }
        return None


class TicketOrderSerializer(serializers.ModelSerializer):
    """Serializer for ticket orders"""
    
    total_dollars = serializers.ReadOnlyField()
    can_cancel = serializers.ReadOnlyField()
    tickets = TicketSerializer(many=True, read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    fixture_info = serializers.SerializerMethodField()
    
    class Meta:
        model = TicketOrder
        fields = [
            'id', 'user', 'user_email', 'event', 'event_name', 'fixture', 'fixture_info',
            'total_cents', 'total_dollars', 'currency', 'status',
            'provider', 'provider_session_id', 'provider_payment_intent',
            'created_at', 'updated_at', 'can_cancel', 'tickets'
        ]
        read_only_fields = [
            'id', 'user', 'total_cents', 'currency', 'status',
            'provider_session_id', 'provider_payment_intent',
            'created_at', 'updated_at', 'tickets'
        ]
    
    def get_fixture_info(self, obj):
        """Get fixture information if applicable"""
        if obj.fixture:
            return {
                'id': obj.fixture.id,
                'starts_at': obj.fixture.starts_at,
                'ends_at': obj.fixture.ends_at,
                'venue': obj.fixture.venue.name if obj.fixture.venue else None
            }
        return None


class CreateOrderSerializer(serializers.Serializer):
    """Serializer for creating ticket orders"""
    
    event_id = serializers.IntegerField()
    fixture_id = serializers.IntegerField(required=False, allow_null=True)
    items = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField()
        ),
        min_length=1
    )
    
    def validate_items(self, value):
        """Validate order items"""
        for item in value:
            if 'ticket_type_id' not in item or 'qty' not in item:
                raise serializers.ValidationError(
                    "Each item must have 'ticket_type_id' and 'qty'"
                )
            
            if item['qty'] <= 0:
                raise serializers.ValidationError(
                    "Quantity must be greater than 0"
                )
        
        return value
    
    def validate(self, data):
        """Validate order data"""
        from .models import Event, TicketType
        from .services.pricing import validate_inventory
        
        # Validate event exists
        try:
            event = Event.objects.get(id=data['event_id'])
        except Event.DoesNotExist:
            raise serializers.ValidationError("Event not found")
        
        # Validate fixture if provided
        if data.get('fixture_id'):
            try:
                from fixtures.models import Fixture
                fixture = Fixture.objects.get(id=data['fixture_id'], event=event)
            except Fixture.DoesNotExist:
                raise serializers.ValidationError("Fixture not found or doesn't belong to event")
        
        # Validate inventory
        validation_result = validate_inventory(data['items'])
        if not validation_result['valid']:
            raise serializers.ValidationError(validation_result['errors'])
        
        return data


class OrderSummarySerializer(serializers.Serializer):
    """Serializer for order summary display"""
    
    order_id = serializers.IntegerField()
    total_cents = serializers.IntegerField()
    total_dollars = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField()
    items = serializers.ListField()
    event_name = serializers.CharField()
    fixture_info = serializers.DictField(required=False, allow_null=True)


class MyTicketsListSerializer(serializers.ModelSerializer):
    """Serializer for my tickets list view"""
    
    ticket_type_name = serializers.CharField(source='ticket_type.name', read_only=True)
    event_name = serializers.CharField(source='order.event.name', read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)
    fixture_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'serial', 'ticket_type_name', 'event_name',
            'status', 'issued_at', 'used_at', 'order_status', 'fixture_info'
        ]
    
    def get_fixture_info(self, obj):
        """Get fixture information if applicable"""
        if obj.order.fixture:
            return {
                'id': obj.order.fixture.id,
                'starts_at': obj.order.fixture.starts_at,
                'ends_at': obj.order.fixture.ends_at
            }
        return None


class TicketDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed ticket view"""
    
    ticket_type = TicketTypeSerializer(read_only=True)
    order = TicketOrderSerializer(read_only=True)
    event_name = serializers.CharField(source='order.event.name', read_only=True)
    fixture_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'serial', 'qr_payload', 'status',
            'issued_at', 'used_at', 'ticket_type', 'order',
            'event_name', 'fixture_info'
        ]
    
    def get_fixture_info(self, obj):
        """Get fixture information if applicable"""
        if obj.order.fixture:
            return {
                'id': obj.order.fixture.id,
                'starts_at': obj.order.fixture.starts_at,
                'ends_at': obj.order.fixture.ends_at,
                'venue': obj.order.fixture.venue.name if obj.order.fixture.venue else None
            }
        return None