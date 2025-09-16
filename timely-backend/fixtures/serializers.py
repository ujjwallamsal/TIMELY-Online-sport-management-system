# fixtures/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Fixture

User = get_user_model()


class FixtureSerializer(serializers.ModelSerializer):
    """Serializer for Fixture CRUD operations"""
    
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    home_team_name = serializers.CharField(source='home.name', read_only=True)
    away_team_name = serializers.CharField(source='away.name', read_only=True)
    
    class Meta:
        model = Fixture
        fields = [
            'id', 'event', 'event_name', 'round', 'phase', 'start_at',
            'venue', 'venue_name', 'status', 'home', 'home_team_name',
            'away', 'away_team_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FixtureGenerateSerializer(serializers.Serializer):
    """Serializer for fixture generation requests"""
    
    event_id = serializers.IntegerField()
    mode = serializers.ChoiceField(choices=['rr', 'ko'])
    participants = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=2,
        help_text="List of team IDs or user IDs"
    )
    slot_hints = serializers.DictField(required=False, allow_empty=True)
    
    def validate_participants(self, value):
        """Validate participants list"""
        if len(value) < 2:
            raise serializers.ValidationError("At least 2 participants required")
        
        # For knockout, check if count is power of 2
        mode = self.initial_data.get('mode')
        if mode == 'ko':
            count = len(value)
            if count & (count - 1) != 0:
                raise serializers.ValidationError(
                    "Knockout tournaments require participant count to be a power of 2"
                )
        
        return value


class FixtureAcceptSerializer(serializers.Serializer):
    """Serializer for accepting generated fixtures"""
    
    event_id = serializers.IntegerField()
    fixtures = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    
    def validate_fixtures(self, value):
        """Validate fixtures data structure"""
        for i, fixture_data in enumerate(value):
            required_fields = ['round', 'start_at']
            for field in required_fields:
                if field not in fixture_data:
                    raise serializers.ValidationError(
                        f"Fixture {i}: Missing required field '{field}'"
                    )
            
            # Validate teams
            if 'home_team_id' not in fixture_data and 'away_team_id' not in fixture_data:
                raise serializers.ValidationError(
                    f"Fixture {i}: Must have at least one team"
                )
        
        return value


class FixtureRescheduleSerializer(serializers.Serializer):
    """Serializer for rescheduling fixtures"""
    
    start_at = serializers.DateTimeField(required=False)
    venue_id = serializers.IntegerField(required=False, allow_null=True)


class FixtureSwapEntriesSerializer(serializers.Serializer):
    """Serializer for swapping fixture entries"""
    
    swap = serializers.ChoiceField(choices=['home-away'])


class FixtureConflictSerializer(serializers.Serializer):
    """Serializer for conflict checking"""
    
    fixture_id = serializers.IntegerField(required=False)
    start_at = serializers.DateTimeField()
    venue_id = serializers.IntegerField(required=False, allow_null=True)


class FixtureListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for fixture lists"""
    
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    home_team_name = serializers.CharField(source='home.name', read_only=True)
    away_team_name = serializers.CharField(source='away.name', read_only=True)
    
    class Meta:
        model = Fixture
        fields = [
            'id', 'event', 'round', 'phase', 'start_at',
            'venue', 'venue_name', 'status', 'home_team_name', 'away_team_name'
        ]


class FixtureProposalSerializer(serializers.Serializer):
    """Serializer for fixture generation proposals"""
    
    round = serializers.IntegerField()
    start_at = serializers.DateTimeField()
    venue_id = serializers.IntegerField(required=False, allow_null=True)
    home_team_id = serializers.IntegerField(required=False, allow_null=True)
    away_team_id = serializers.IntegerField(required=False, allow_null=True)