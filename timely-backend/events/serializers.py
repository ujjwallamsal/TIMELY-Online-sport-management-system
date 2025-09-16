from rest_framework import serializers
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import Event, Division


class DivisionSerializer(serializers.ModelSerializer):
    """Serializer for event divisions"""
    
    class Meta:
        model = Division
        fields = ['id', 'name', 'sort_order']
        read_only_fields = ['id']
    
    def validate_name(self, value):
        """Validate division name uniqueness within event"""
        event = self.context.get('event')
        if event and Division.objects.filter(event=event, name=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise ValidationError(f"Division '{value}' already exists for this event")
        return value


class EventSerializer(serializers.ModelSerializer):
    """Main event serializer with computed phase field"""
    
    phase = serializers.ReadOnlyField(help_text="Computed event phase")
    divisions = DivisionSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source="created_by.email", read_only=True)
    is_published = serializers.SerializerMethodField(help_text="Whether event is published")
    
    class Meta:
        model = Event
        fields = [
            'id', 'name', 'sport', 'description',
            'start_datetime', 'end_datetime',
            'registration_open_at', 'registration_close_at',
            'location', 'venue', 'capacity', 'fee_cents',
            'lifecycle_status', 'phase', 'is_published',
            'created_by', 'created_by_name',
            'created_at', 'updated_at', 'divisions'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'phase', 'is_published']
    
    def get_is_published(self, obj):
        """Check if event is published"""
        return obj.lifecycle_status == Event.LifecycleStatus.PUBLISHED
    
    def validate(self, data):
        """Validate event data"""
        # Validate datetime order
        if 'start_datetime' in data and 'end_datetime' in data:
            if data['start_datetime'] >= data['end_datetime']:
                raise ValidationError("End datetime must be after start datetime")
        
        # Validate registration windows
        if 'registration_open_at' in data and 'registration_close_at' in data:
            if data['registration_open_at'] >= data['registration_close_at']:
                raise ValidationError("Registration close must be after registration open")
        
        # Validate registration window
        if all(key in data for key in ['registration_open_at', 'registration_close_at', 'start_datetime']):
            # Registration can open before event starts (this is allowed)
            if data['registration_close_at'] > data['start_datetime']:
                raise ValidationError("Registration close cannot be after event start")
        
        # Validate registration close is not after event end
        if all(key in data for key in ['registration_close_at', 'end_datetime']):
            if data['registration_close_at'] > data['end_datetime']:
                raise ValidationError("Registration close cannot be after event end")
        
        return data
    
    def create(self, validated_data):
        """Create event with current user as creator"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class EventListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for event lists"""
    
    phase = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source="created_by.email", read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'name', 'sport', 'description',
            'start_datetime', 'end_datetime', 'location', 'venue',
            'capacity', 'fee_cents', 'lifecycle_status', 'phase',
            'created_by_name', 'created_at'
        ]


class EventLifecycleActionSerializer(serializers.Serializer):
    """Serializer for lifecycle actions (publish, unpublish, cancel)"""
    
    reason = serializers.CharField(required=False, allow_blank=True, help_text="Reason for cancellation")
    
    def validate_lifecycle_status(self, value, action):
        """Validate lifecycle status transitions"""
        event = self.context['event']
        current_status = event.lifecycle_status
        
        valid_transitions = {
            'publish': [Event.LifecycleStatus.DRAFT],
            'unpublish': [Event.LifecycleStatus.PUBLISHED],
            'cancel': [Event.LifecycleStatus.DRAFT, Event.LifecycleStatus.PUBLISHED]
        }
        
        if current_status not in valid_transitions.get(action, []):
            raise ValidationError(f"Cannot {action} event with status {current_status}")
        
        return value
