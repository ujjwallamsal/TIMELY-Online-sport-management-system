# venues/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Venue, VenueSlot

User = get_user_model()


class VenueSerializer(serializers.ModelSerializer):
    """Serializer for Venue CRUD operations"""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    slot_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Venue
        fields = [
            'id', 'name', 'address', 'capacity', 'facilities', 
            'created_by', 'created_by_name', 'slot_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_slot_count(self, obj):
        """Get count of slots for this venue"""
        return obj.slots.count()

    def validate_capacity(self, value):
        """Validate capacity is non-negative"""
        if value < 0:
            raise serializers.ValidationError("Capacity must be non-negative")
        return value

    def validate_facilities(self, value):
        """Validate facilities JSON"""
        if value is not None:
            try:
                if isinstance(value, str):
                    import json
                    json.loads(value)
            except (json.JSONDecodeError, TypeError):
                raise serializers.ValidationError("Facilities must be valid JSON")
        return value

    def create(self, validated_data):
        """Create venue with current user as creator"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        else:
            # Fallback: get user from context or raise error
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                # Try to get admin user as fallback
                admin_user = User.objects.filter(is_staff=True).first()
                if admin_user:
                    validated_data['created_by'] = admin_user
                else:
                    raise serializers.ValidationError("No authenticated user found")
            except Exception:
                raise serializers.ValidationError("No authenticated user found")
        return super().create(validated_data)


class VenueSlotSerializer(serializers.ModelSerializer):
    """Serializer for VenueSlot operations"""
    
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    duration_minutes = serializers.ReadOnlyField()
    
    class Meta:
        model = VenueSlot
        fields = [
            'id', 'venue', 'venue_name', 'starts_at', 'ends_at', 
            'status', 'reason', 'duration_minutes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """Validate slot data"""
        starts_at = data.get('starts_at')
        ends_at = data.get('ends_at')
        
        if starts_at and ends_at:
            if ends_at <= starts_at:
                raise serializers.ValidationError({
                    'ends_at': 'End time must be after start time'
                })
        
        status = data.get('status', VenueSlot.Status.AVAILABLE)
        reason = data.get('reason', '')
        
        if status == VenueSlot.Status.BLOCKED and not reason:
            raise serializers.ValidationError({
                'reason': 'Blocked slots must have a reason'
            })
        
        return data


class VenueAvailabilitySerializer(serializers.Serializer):
    """Serializer for venue availability queries"""
    
    venue_id = serializers.IntegerField()
    from_date = serializers.DateTimeField()
    to_date = serializers.DateTimeField()
    
    def validate(self, data):
        """Validate date range"""
        from_date = data.get('from_date')
        to_date = data.get('to_date')
        
        if from_date and to_date:
            if to_date <= from_date:
                raise serializers.ValidationError({
                    'to_date': 'End date must be after start date'
                })
            
            # Limit query window to 90 days
            from django.utils import timezone
            max_span = timezone.timedelta(days=90)
            if to_date - from_date > max_span:
                raise serializers.ValidationError({
                    'to_date': 'Query window cannot exceed 90 days'
                })
        
        return data


class VenueConflictCheckSerializer(serializers.Serializer):
    """Serializer for conflict checking"""
    
    venue_id = serializers.IntegerField()
    starts_at = serializers.DateTimeField()
    ends_at = serializers.DateTimeField()
    exclude_slot_id = serializers.IntegerField(required=False, allow_null=True)
    
    def validate(self, data):
        """Validate conflict check data"""
        starts_at = data.get('starts_at')
        ends_at = data.get('ends_at')
        
        if starts_at and ends_at:
            if ends_at <= starts_at:
                raise serializers.ValidationError({
                    'ends_at': 'End time must be after start time'
                })
        
        return data


class VenueListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for venue lists"""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Venue
        fields = [
            'id', 'name', 'address', 'capacity', 
            'created_by_name', 'created_at'
        ]