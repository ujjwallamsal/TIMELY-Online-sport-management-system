from rest_framework import serializers
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import Event, Division
from venues.serializers import VenueSerializer

class DivisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Division
        fields = ['id', 'name', 'description', 'min_age', 'max_age', 'gender']

class EventSerializer(serializers.ModelSerializer):
    venue_detail = VenueSerializer(source="venue", read_only=True)
    divisions_detail = DivisionSerializer(source="divisions", many=True, read_only=True)
    fee_dollars = serializers.ReadOnlyField()
    is_registration_open = serializers.ReadOnlyField()
    is_published = serializers.ReadOnlyField()
    days_until_start = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source="created_by.email", read_only=True)

    class Meta:
        model = Event
        fields = [
            "id", "name", "sport_type", "description", "start_date", "end_date",
            "registration_open", "registration_close", "venue", "venue_detail",
            "capacity", "fee_cents", "fee_dollars", "status", "divisions",
            "divisions_detail", "eligibility_notes", "rules_and_regulations",
            "created_by", "created_by_name", "created_at", "updated_at",
            "is_registration_open", "is_published", "days_until_start"
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def validate(self, data):
        # Validate dates
        if 'start_date' in data and 'end_date' in data:
            if data['start_date'] > data['end_date']:
                raise ValidationError("End date must be after start date")
        
        if 'registration_close' in data and 'start_date' in data:
            if data['registration_close'].date() > data['start_date']:
                raise ValidationError("Registration must close before event starts")
        
        # Validate registration dates are in the future
        now = timezone.now()
        if 'registration_open' in data and data['registration_open'] <= now:
            raise ValidationError("Registration open date must be in the future")
        
        if 'registration_close' in data and data['registration_close'] <= now:
            raise ValidationError("Registration close date must be in the future")
        
        # Validate capacity
        if 'capacity' in data and data['capacity'] < 1:
            raise ValidationError("Capacity must be at least 1")
        
        # Validate fee
        if 'fee_cents' in data and data['fee_cents'] < 0:
            raise ValidationError("Fee cannot be negative")
        
        return data

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user if self.context["request"].user.is_authenticated else None
        return super().create(validated_data)

class EventCreateSerializer(EventSerializer):
    """Serializer for creating events with additional validation"""
    class Meta(EventSerializer.Meta):
        fields = EventSerializer.Meta.fields + ['divisions']
        read_only_fields = EventSerializer.Meta.read_only_fields

class EventUpdateSerializer(EventSerializer):
    """Serializer for updating events"""
    class Meta(EventSerializer.Meta):
        fields = EventSerializer.Meta.fields + ['divisions']
        read_only_fields = EventSerializer.Meta.read_only_fields + ['created_by', 'created_at']

class EventListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for event lists"""
    venue_name = serializers.CharField(source="venue.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.email", read_only=True)
    fee_dollars = serializers.ReadOnlyField()
    is_registration_open = serializers.ReadOnlyField()
    days_until_start = serializers.ReadOnlyField()
    
    class Meta:
        model = Event
        fields = [
            "id", "name", "sport_type", "start_date", "end_date",
            "venue_name", "capacity", "fee_dollars", "status",
            "created_by_name", "is_registration_open", "days_until_start"
        ]
