# tickets/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Ticket, TicketType, TicketOrder
from .services.pricing import format_price

User = get_user_model()


class TicketOrderSerializer(serializers.ModelSerializer):
    """Serializer for TicketOrder model"""
    
    total_dollars = serializers.ReadOnlyField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = TicketOrder
        fields = [
            'id', 'user', 'user_email', 'event_id', 'fixture_id',
            'provider_payment_intent_id', 'status', 'total_cents', 'total_dollars', 'currency',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TicketSerializer(serializers.ModelSerializer):
    """Serializer for simplified Ticket model"""
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'serial', 'code', 'status', 'qr_payload',
            'issued_at', 'used_at'
        ]
        read_only_fields = ['id', 'serial', 'code', 'qr_payload', 'issued_at']


class CheckoutSerializer(serializers.Serializer):
    """Serializer for checkout request - only event_id required, backend calculates amount"""
    
    event_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=10, default=1, help_text="Number of tickets (1-10)")
    amount = serializers.IntegerField(min_value=0, required=False, help_text="Amount in cents (ignored, calculated by backend)")
    currency = serializers.CharField(max_length=3, default='USD', required=False)
    
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
    
    class Meta:
        model = TicketType
        fields = [
            'id', 'event_id', 'fixture_id', 'name', 'description',
            'price_cents', 'price_dollars', 'currency',
            'quantity_total', 'quantity_sold', 'available_quantity',
            'on_sale', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'quantity_sold']


class TicketTypeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating ticket types (organizer/admin only)"""
    
    class Meta:
        model = TicketType
        fields = [
            'event_id', 'fixture_id', 'name', 'description',
            'price_cents', 'currency', 'quantity_total', 'on_sale'
        ]
    
    def validate(self, data):
        """Validate ticket type data"""
        # Ensure either event_id or fixture_id is provided, not both
        if data.get('event_id') and data.get('fixture_id'):
            from fixtures.models import Fixture
            try:
                fixture = Fixture.objects.get(id=data['fixture_id'])
                if fixture.event.id != data['event_id']:
                    raise serializers.ValidationError(
                        "Fixture must belong to the specified event"
                    )
            except Fixture.DoesNotExist:
                raise serializers.ValidationError("Fixture not found")
        elif not data.get('event_id') and not data.get('fixture_id'):
            raise serializers.ValidationError(
                "Either event_id or fixture_id must be specified"
            )
        
        return data


class TicketSerializer(serializers.ModelSerializer):
    """Serializer for individual tickets"""
    
    ticket_type_name = serializers.CharField(source='ticket_type.name', read_only=True)
    event_name = serializers.SerializerMethodField()
    fixture_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'order', 'ticket_type', 'ticket_type_name',
            'qr_payload', 'serial', 'status',
            'issued_at', 'used_at', 'event_name', 'fixture_info'
        ]
        read_only_fields = ['id', 'qr_payload', 'serial', 'issued_at']
    
    def get_event_name(self, obj):
        """Get event name"""
        try:
            from events.models import Event
            event = Event.objects.get(id=obj.order.event_id)
            return event.name
        except Event.DoesNotExist:
            return None
    
    def get_fixture_info(self, obj):
        """Get fixture information if applicable"""
        if obj.order.fixture_id:
            try:
                from fixtures.models import Fixture
                fixture = Fixture.objects.get(id=obj.order.fixture_id)
                return {
                    'id': fixture.id,
                    'starts_at': fixture.start_at,
                    'ends_at': fixture.end_at,
                    'venue': fixture.venue.name if fixture.venue else None
                }
            except Fixture.DoesNotExist:
                return None
        return None


class TicketOrderSerializer(serializers.ModelSerializer):
    """Serializer for ticket orders"""
    
    total_dollars = serializers.ReadOnlyField()
    can_cancel = serializers.ReadOnlyField()
    tickets = TicketSerializer(many=True, read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    event_name = serializers.SerializerMethodField()
    fixture_info = serializers.SerializerMethodField()
    
    class Meta:
        model = TicketOrder
        fields = [
            'id', 'user', 'user_email', 'event_id', 'event_name', 'fixture_id', 'fixture_info',
            'total_cents', 'total_dollars', 'currency', 'status',
            'payment_provider', 'provider_session_id', 'provider_payment_intent_id',
            'created_at', 'updated_at', 'can_cancel', 'tickets'
        ]
        read_only_fields = [
            'id', 'user', 'total_cents', 'currency', 'status',
            'provider_session_id', 'provider_payment_intent_id',
            'created_at', 'updated_at', 'tickets'
        ]
    
    def get_event_name(self, obj):
        """Get event name"""
        try:
            from events.models import Event
            event = Event.objects.get(id=obj.event_id)
            return event.name
        except Event.DoesNotExist:
            return None
    
    def get_fixture_info(self, obj):
        """Get fixture information if applicable"""
        if obj.fixture_id:
            try:
                from fixtures.models import Fixture
                fixture = Fixture.objects.get(id=obj.fixture_id)
                return {
                    'id': fixture.id,
                    'starts_at': fixture.start_at,
                    'ends_at': fixture.end_at,
                    'venue': fixture.venue.name if fixture.venue else None
                }
            except Fixture.DoesNotExist:
                return None
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
        from events.models import Event
        from .models import TicketType
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
    
    ticket_type_name = serializers.SerializerMethodField()
    event_name = serializers.SerializerMethodField()
    event_id = serializers.IntegerField(source='order.event_id', read_only=True)
    event_date = serializers.SerializerMethodField()
    venue_name = serializers.SerializerMethodField()
    order_status = serializers.CharField(source='order.status', read_only=True)
    price = serializers.SerializerMethodField()
    fixture_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'serial', 'ticket_type_name', 'event_name', 'event_id', 'event_date',
            'venue_name', 'price', 'status', 'issued_at', 'used_at', 'order_status', 
            'fixture_info', 'qr_payload', 'approved_at'
        ]
    
    def get_ticket_type_name(self, obj):
        """Get ticket type name or default"""
        if obj.ticket_type:
            return obj.ticket_type.name
        return 'General Admission'
    
    def get_event_name(self, obj):
        """Get event name"""
        try:
            from events.models import Event
            event = Event.objects.get(id=obj.order.event_id)
            return event.name
        except Event.DoesNotExist:
            return f"Event #{obj.order.event_id}"
    
    def get_event_date(self, obj):
        """Get event start date"""
        try:
            from events.models import Event
            event = Event.objects.get(id=obj.order.event_id)
            return event.start_datetime.isoformat() if event.start_datetime else None
        except Event.DoesNotExist:
            return None
    
    def get_venue_name(self, obj):
        """Get venue name"""
        try:
            from events.models import Event
            event = Event.objects.get(id=obj.order.event_id)
            return event.venue.name if event.venue else None
        except Event.DoesNotExist:
            return None
    
    def get_price(self, obj):
        """Get price from order total divided by number of tickets"""
        # Return price in dollars (cents / 100)
        if obj.order.total_cents == 0:
            return 0.0
        # Divide order total by number of tickets
        num_tickets = obj.order.tickets.count()
        if num_tickets > 0:
            return obj.order.total_cents / (100 * num_tickets)
        return obj.order.total_cents / 100
    
    def get_fixture_info(self, obj):
        """Get fixture information if applicable"""
        if obj.order.fixture_id:
            try:
                from fixtures.models import Fixture
                fixture = Fixture.objects.get(id=obj.order.fixture_id)
                return {
                    'id': fixture.id,
                    'starts_at': fixture.start_at,
                    'ends_at': fixture.end_at
                }
            except Fixture.DoesNotExist:
                return None
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
        if obj.order.fixture_id:
            try:
                from fixtures.models import Fixture
                fixture = Fixture.objects.get(id=obj.order.fixture_id)
                return {
                    'id': fixture.id,
                    'starts_at': fixture.start_at,
                    'ends_at': fixture.end_at,
                    'venue': fixture.venue.name if fixture.venue else None
                }
            except Fixture.DoesNotExist:
                return None
        return None