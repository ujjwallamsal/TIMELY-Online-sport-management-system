# fixtures/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Fixture, FixtureEntry

User = get_user_model()


class FixtureEntrySerializer(serializers.ModelSerializer):
    """Serializer for FixtureEntry"""
    
    team_name = serializers.CharField(source='team.name', read_only=True)
    participant_name = serializers.CharField(source='participant.get_full_name', read_only=True)
    name = serializers.ReadOnlyField()
    
    class Meta:
        model = FixtureEntry
        fields = [
            'id', 'fixture', 'side', 'team', 'team_name', 
            'participant', 'participant_name', 'name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """Validate fixture entry data"""
        team = data.get('team')
        participant = data.get('participant')
        
        if not team and not participant:
            raise serializers.ValidationError("Must specify either team or participant")
        
        if team and participant:
            raise serializers.ValidationError("Cannot specify both team and participant")
        
        return data


class FixtureSerializer(serializers.ModelSerializer):
    """Serializer for Fixture CRUD operations"""
    
    entries = FixtureEntrySerializer(many=True, read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    home_team = serializers.ReadOnlyField()
    away_team = serializers.ReadOnlyField()
    home_participant = serializers.ReadOnlyField()
    away_participant = serializers.ReadOnlyField()
    
    class Meta:
        model = Fixture
        fields = [
            'id', 'event', 'event_name', 'round_no', 'starts_at', 'ends_at',
            'venue', 'venue_name', 'status', 'entries', 'home_team', 'away_team',
            'home_participant', 'away_participant', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """Validate fixture data"""
        starts_at = data.get('starts_at')
        ends_at = data.get('ends_at')
        
        if starts_at and ends_at:
            if ends_at <= starts_at:
                raise serializers.ValidationError({
                    'ends_at': 'End time must be after start time'
                })
        
        return data


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
            required_fields = ['round_no', 'starts_at', 'ends_at', 'entries']
            for field in required_fields:
                if field not in fixture_data:
                    raise serializers.ValidationError(
                        f"Fixture {i}: Missing required field '{field}'"
                    )
            
            # Validate entries
            entries = fixture_data.get('entries', [])
            if len(entries) < 2:
                raise serializers.ValidationError(
                    f"Fixture {i}: Must have at least 2 entries"
                )
            
            # Check for home and away entries
            sides = [entry.get('side') for entry in entries]
            if 'home' not in sides or 'away' not in sides:
                raise serializers.ValidationError(
                    f"Fixture {i}: Must have both home and away entries"
                )
        
        return value


class FixtureRescheduleSerializer(serializers.Serializer):
    """Serializer for rescheduling fixtures"""
    
    starts_at = serializers.DateTimeField(required=False)
    ends_at = serializers.DateTimeField(required=False)
    venue_id = serializers.IntegerField(required=False, allow_null=True)
    
    def validate(self, data):
        """Validate reschedule data"""
        starts_at = data.get('starts_at')
        ends_at = data.get('ends_at')
        
        if starts_at and ends_at:
            if ends_at <= starts_at:
                raise serializers.ValidationError({
                    'ends_at': 'End time must be after start time'
                })
        
        return data


class FixtureSwapEntriesSerializer(serializers.Serializer):
    """Serializer for swapping fixture entries"""
    
    swap = serializers.ChoiceField(choices=['home-away'])


class FixtureConflictSerializer(serializers.Serializer):
    """Serializer for conflict checking"""
    
    fixture_id = serializers.IntegerField(required=False)
    starts_at = serializers.DateTimeField()
    ends_at = serializers.DateTimeField()
    venue_id = serializers.IntegerField(required=False, allow_null=True)
    
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


class FixtureListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for fixture lists"""
    
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    home_team_name = serializers.SerializerMethodField()
    away_team_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Fixture
        fields = [
            'id', 'event', 'round_no', 'starts_at', 'ends_at',
            'venue', 'venue_name', 'status', 'home_team_name', 'away_team_name'
        ]
    
    def get_home_team_name(self, obj):
        """Get home team name"""
        home_entry = obj.home_entry
        if home_entry:
            return home_entry.name
        return None
    
    def get_away_team_name(self, obj):
        """Get away team name"""
        away_entry = obj.away_entry
        if away_entry:
            return away_entry.name
        return None


class FixtureProposalSerializer(serializers.Serializer):
    """Serializer for fixture generation proposals"""
    
    round_no = serializers.IntegerField()
    starts_at = serializers.DateTimeField()
    ends_at = serializers.DateTimeField()
    venue_id = serializers.IntegerField(required=False, allow_null=True)
    entries = serializers.ListField(
        child=serializers.DictField(),
        min_length=2
    )
    
    def validate_entries(self, value):
        """Validate entries in proposal"""
        sides = [entry.get('side') for entry in value]
        if 'home' not in sides or 'away' not in sides:
            raise serializers.ValidationError("Must have both home and away entries")
        
        return value