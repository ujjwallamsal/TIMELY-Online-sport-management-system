# fixtures/serializers.py
from __future__ import annotations

from rest_framework import serializers
from django.utils import timezone
from django.db import transaction

from .models import Fixture, MatchEntry, Match
from events.serializers import DivisionSerializer
from venues.serializers import VenueSerializer
from teams.serializers import TeamSerializer
from accounts.serializers import UserSerializer


class MatchEntrySerializer(serializers.ModelSerializer):
    """Serializer for match entries"""
    team_detail = TeamSerializer(source='team', read_only=True)
    individual_detail = UserSerializer(source='individual_registration.user', read_only=True)
    entry_display = serializers.SerializerMethodField()
    
    class Meta:
        model = MatchEntry
        fields = [
            'id', 'fixture', 'match', 'entry_type', 'team', 'team_detail',
            'individual_registration', 'individual_detail', 'position', 'seed',
            'previous_match', 'entry_display', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_entry_display(self, obj):
        """Get human-readable entry display"""
        if obj.entry_type == MatchEntry.EntryType.TEAM:
            return f"{obj.team.name} ({obj.position})" if obj.team else "TBD"
        elif obj.entry_type == MatchEntry.EntryType.INDIVIDUAL:
            if obj.individual_registration and obj.individual_registration.user:
                return f"{obj.individual_registration.user.get_full_name()} ({obj.position})"
            return "TBD"
        else:
            return f"Bye ({obj.position})"


class MatchSerializer(serializers.ModelSerializer):
    """Serializer for matches"""
    entries = MatchEntrySerializer(many=True, read_only=True)
    venue_detail = VenueSerializer(source='venue', read_only=True)
    winner_detail = MatchEntrySerializer(source='winner', read_only=True)
    end_time = serializers.ReadOnlyField()
    has_conflicts = serializers.ReadOnlyField()
    
    class Meta:
        model = Match
        fields = [
            'id', 'fixture', 'round_number', 'match_number', 'venue', 'venue_detail',
            'scheduled_at', 'status', 'is_published', 'entries', 'winner', 'winner_detail',
            'score_home', 'score_away', 'notes', 'end_time', 'has_conflicts',
            'original_scheduled_at', 'rescheduled_by', 'reschedule_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'end_time', 'has_conflicts',
            'original_scheduled_at', 'rescheduled_by'
        ]


class FixtureSerializer(serializers.ModelSerializer):
    """Serializer for fixtures"""
    division_detail = DivisionSerializer(source='division', read_only=True)
    venues_detail = VenueSerializer(source='venues', many=True, read_only=True)
    generated_by_detail = UserSerializer(source='generated_by', read_only=True)
    matches = MatchSerializer(many=True, read_only=True)
    total_matches = serializers.ReadOnlyField()
    is_generatable = serializers.ReadOnlyField()
    
    class Meta:
        model = Fixture
        fields = [
            'id', 'event', 'division', 'division_detail', 'name', 'tournament_type',
            'status', 'rounds', 'teams_per_match', 'start_date', 'end_date',
            'match_duration_minutes', 'break_between_matches_minutes', 'venues',
            'venues_detail', 'max_matches_per_venue_per_day', 'earliest_start_time',
            'latest_end_time', 'generated_at', 'generated_by', 'generated_by_detail',
            'generation_notes', 'matches', 'total_matches', 'is_generatable',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'generated_at', 'generated_by', 'created_at', 'updated_at',
            'total_matches', 'is_generatable'
        ]


class FixtureCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating fixtures"""
    class Meta:
        model = Fixture
        fields = [
            'event', 'division', 'name', 'tournament_type', 'rounds', 'teams_per_match',
            'start_date', 'end_date', 'match_duration_minutes', 'break_between_matches_minutes',
            'venues', 'max_matches_per_venue_per_day', 'earliest_start_time', 'latest_end_time'
        ]

    def validate(self, data):
        """Validate fixture data"""
        # Check if event has confirmed registrations
        if data.get('division'):
            confirmed_count = data['division'].registrations.filter(status='CONFIRMED').count()
            if confirmed_count < 2:
                raise serializers.ValidationError(
                    f"Division must have at least 2 confirmed registrations. Current: {confirmed_count}"
                )
        
        # Check if venues are available
        if data.get('venues'):
            for venue in data['venues']:
                # Check venue availability for the date range
                conflicting_fixtures = Fixture.objects.filter(
                    venues=venue,
                    start_date__lte=data['end_date'],
                    end_date__gte=data['start_date'],
                    status__in=[Fixture.Status.PUBLISHED, Fixture.Status.PROPOSED]
                )
                if conflicting_fixtures.exists():
                    raise serializers.ValidationError(
                        f"Venue {venue.name} is not available for the selected date range"
                    )
        
        return data


class FixtureUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating fixtures"""
    class Meta:
        model = Fixture
        fields = [
            'name', 'tournament_type', 'rounds', 'teams_per_match', 'start_date', 'end_date',
            'match_duration_minutes', 'break_between_matches_minutes', 'venues',
            'max_matches_per_venue_per_day', 'earliest_start_time', 'latest_end_time',
            'generation_notes'
        ]

    def validate(self, data):
        """Validate fixture updates"""
        instance = self.instance
        
        # Cannot change dates if matches are already scheduled
        if instance.matches.exists():
            if 'start_date' in data and data['start_date'] != instance.start_date:
                raise serializers.ValidationError(
                    "Cannot change start date when matches are already scheduled"
                )
            if 'end_date' in data and data['end_date'] != instance.end_date:
                raise serializers.ValidationError(
                    "Cannot change end date when matches are already scheduled"
                )
        
        return data


class FixtureGenerateSerializer(serializers.Serializer):
    """Serializer for fixture generation requests"""
    generation_type = serializers.ChoiceField(choices=[
        ('ROUND_ROBIN', 'Round Robin'),
        ('KNOCKOUT', 'Knockout'),
        ('GROUP_STAGE', 'Group Stage + Knockout'),
        ('SWISS', 'Swiss System')
    ])
    
    # Round Robin specific options
    rounds = serializers.IntegerField(min_value=1, max_value=10, required=False)
    randomize_seeds = serializers.BooleanField(default=False)
    
    # Knockout specific options
    seed_teams = serializers.BooleanField(default=False)
    include_playoffs = serializers.BooleanField(default=False)
    
    # Group Stage options
    group_size = serializers.IntegerField(min_value=3, max_value=8, required=False)
    teams_per_group = serializers.IntegerField(min_value=2, max_value=8, required=False)
    
    # Scheduling options
    start_time = serializers.TimeField(required=False)
    end_time = serializers.TimeField(required=False)
    matches_per_day = serializers.IntegerField(min_value=1, max_value=20, required=False)
    
    # Venue assignment
    auto_assign_venues = serializers.BooleanField(default=True)
    venue_preferences = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of venue IDs in order of preference"
    )

    def validate(self, data):
        """Validate generation parameters"""
        fixture = self.context.get('fixture')
        if not fixture:
            raise serializers.ValidationError("Fixture context is required")
        
        if not fixture.is_generatable:
            raise serializers.ValidationError("Fixture cannot be generated - check teams and venues")
        
        # Validate group stage parameters
        if data.get('generation_type') == 'GROUP_STAGE':
            if not data.get('group_size') or not data.get('teams_per_group'):
                raise serializers.ValidationError(
                    "Group size and teams per group are required for group stage tournaments"
                )
            
            available_teams = fixture.get_available_teams().count()
            if available_teams < data['teams_per_group'] * data['group_size']:
                raise serializers.ValidationError(
                    f"Not enough teams for {data['group_size']} groups of {data['teams_per_group']} teams. Available: {available_teams}"
                )
        
        return data


class MatchRescheduleSerializer(serializers.Serializer):
    """Serializer for rescheduling matches"""
    new_scheduled_at = serializers.DateTimeField()
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
    check_conflicts = serializers.BooleanField(default=True)

    def validate_new_scheduled_at(self, value):
        """Validate new scheduled time"""
        if value <= timezone.now():
            raise serializers.ValidationError("New scheduled time must be in the future")
        return value


class FixturePublishSerializer(serializers.Serializer):
    """Serializer for publishing fixtures"""
    publish_matches = serializers.BooleanField(default=True)
    send_notifications = serializers.BooleanField(default=True)
    publish_notes = serializers.CharField(max_length=500, required=False, allow_blank=True)


class FixtureListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for fixture lists"""
    division_name = serializers.CharField(source='division.name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    total_matches = serializers.ReadOnlyField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Fixture
        fields = [
            'id', 'name', 'event_name', 'division_name', 'tournament_type',
            'status', 'status_display', 'start_date', 'end_date', 'total_matches',
            'generated_at', 'created_at'
        ]
