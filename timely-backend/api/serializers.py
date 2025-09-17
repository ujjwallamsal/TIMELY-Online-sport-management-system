# api/serializers.py - Unified API Serializers
from rest_framework import serializers
from accounts.models import User
from events.models import Event
from venues.models import Venue
from sports.models import Sport
from teams.models import Team, TeamMember
from registrations.models import Registration
from fixtures.models import Fixture
from results.models import Result, LeaderboardEntry
from notifications.models import Notification
from events.models import Announcement


class UserSerializer(serializers.ModelSerializer):
    """User serializer"""
    full_name = serializers.CharField(read_only=True)
    is_verified = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'role', 'is_active', 'is_verified', 'phone_number', 'date_of_birth',
            'address', 'city', 'state', 'postal_code', 'country', 'bio',
            'website', 'profile_picture', 'created_at', 'last_login'
        ]
        read_only_fields = ['id', 'created_at', 'last_login', 'is_verified']


class SportSerializer(serializers.ModelSerializer):
    """Sport serializer"""
    class Meta:
        model = Sport
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class VenueSerializer(serializers.ModelSerializer):
    """Venue serializer"""
    class Meta:
        model = Venue
        fields = [
            'id', 'name', 'address', 'capacity', 'facilities', 'timezone',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class EventSerializer(serializers.ModelSerializer):
    """Event serializer"""
    sport_name = serializers.CharField(source='sport.name', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'name', 'sport', 'sport_name', 'description', 'start_datetime',
            'end_datetime', 'registration_open_at', 'registration_close_at',
            'location', 'capacity', 'fee_cents', 'venue', 'venue_name',
            'eligibility', 'status', 'visibility', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class TeamMemberSerializer(serializers.ModelSerializer):
    """Team member serializer"""
    athlete_name = serializers.CharField(source='athlete.full_name', read_only=True)
    
    class Meta:
        model = TeamMember
        fields = [
            'id', 'athlete', 'athlete_name', 'jersey_no', 'position',
            'is_captain', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TeamSerializer(serializers.ModelSerializer):
    """Team serializer"""
    manager_name = serializers.CharField(source='manager.full_name', read_only=True)
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    members = TeamMemberSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = [
            'id', 'name', 'manager', 'manager_name', 'coach', 'coach_name',
            'event', 'event_name', 'description', 'members', 'member_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        return obj.members.count()


class RegistrationSerializer(serializers.ModelSerializer):
    """Registration serializer"""
    applicant_name = serializers.CharField(source='applicant.full_name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    
    class Meta:
        model = Registration
        fields = [
            'id', 'event', 'event_name', 'applicant', 'applicant_name',
            'team', 'team_name', 'type', 'status', 'docs', 'submitted_at',
            'decided_at', 'reason'
        ]
        read_only_fields = ['id', 'submitted_at', 'decided_at']


class FixtureSerializer(serializers.ModelSerializer):
    """Fixture serializer"""
    event_name = serializers.CharField(source='event.name', read_only=True)
    home_name = serializers.CharField(source='home.name', read_only=True)
    away_name = serializers.CharField(source='away.name', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    
    class Meta:
        model = Fixture
        fields = [
            'id', 'event', 'event_name', 'round', 'phase', 'home', 'home_name',
            'away', 'away_name', 'venue', 'venue_name', 'start_at', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ResultSerializer(serializers.ModelSerializer):
    """Result serializer"""
    fixture_event = serializers.CharField(source='fixture.event.name', read_only=True)
    fixture_home = serializers.CharField(source='fixture.home.name', read_only=True)
    fixture_away = serializers.CharField(source='fixture.away.name', read_only=True)
    winner_name = serializers.CharField(source='winner.name', read_only=True)
    entered_by_name = serializers.CharField(source='entered_by.full_name', read_only=True)
    
    class Meta:
        model = Result
        fields = [
            'id', 'fixture', 'fixture_event', 'fixture_home', 'fixture_away',
            'home_score', 'away_score', 'winner', 'winner_name', 'entered_by',
            'entered_by_name', 'entered_at', 'finalized_at', 'finalized_by',
            'is_finalized', 'notes'
        ]
        read_only_fields = ['id', 'entered_at', 'finalized_at', 'is_finalized']


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    """Leaderboard entry serializer"""
    team_name = serializers.CharField(source='team.name', read_only=True)
    
    class Meta:
        model = LeaderboardEntry
        fields = [
            'id', 'team', 'team_name', 'pts', 'w', 'd', 'l', 'gf', 'ga', 'gd',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class NotificationSerializer(serializers.ModelSerializer):
    """Notification serializer"""
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'title', 'message', 'kind', 'is_read', 'data',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AnnouncementSerializer(serializers.ModelSerializer):
    """Announcement serializer"""
    event_name = serializers.CharField(source='event.name', read_only=True)
    sent_by_name = serializers.CharField(source='sent_by.full_name', read_only=True)
    
    class Meta:
        model = Announcement
        fields = [
            'id', 'event', 'event_name', 'subject', 'body', 'audience',
            'sent_by', 'sent_by_name', 'sent_at'
        ]
        read_only_fields = ['id', 'sent_by', 'sent_at']


class ReportSerializer(serializers.Serializer):
    """Report serializer - for CSV exports"""
    name = serializers.CharField()
    sport = serializers.CharField()
    status = serializers.CharField()
    start_date = serializers.DateTimeField()
    end_date = serializers.DateTimeField()
    venue = serializers.CharField()
    created_by = serializers.CharField()