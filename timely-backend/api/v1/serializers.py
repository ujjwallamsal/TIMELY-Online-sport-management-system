# api/v1/serializers.py
from rest_framework import serializers
from accounts.models import User
from events.models import Event
from venues.models import Venue
from registrations.models import Registration
from fixtures.models import Fixture
from results.models import Result, LeaderboardEntry
from notifications.models import Notification
from sports.models import Sport
from teams.models import Team, TeamMember
from api.models import Announcement


class UserSerializer(serializers.ModelSerializer):
    """User serializer"""
    full_name = serializers.ReadOnlyField()
    is_verified = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'role', 'is_verified', 'is_active', 'phone_number', 'date_of_birth',
            'address', 'city', 'state', 'postal_code', 'country',
            'profile_picture', 'bio', 'website', 'last_login', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'last_login']


class SportSerializer(serializers.ModelSerializer):
    """Sport serializer"""
    
    class Meta:
        model = Sport
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']


class VenueSerializer(serializers.ModelSerializer):
    """Venue serializer"""
    
    class Meta:
        model = Venue
        fields = [
            'id', 'name', 'address', 'capacity', 'facilities'
        ]
        read_only_fields = ['id']


class EventSerializer(serializers.ModelSerializer):
    """Event serializer"""
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    sport_name = serializers.CharField(source='sport', read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'name', 'sport', 'sport_name', 'status', 'start_date', 'end_date',
            'venue', 'venue_name', 'eligibility', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TeamSerializer(serializers.ModelSerializer):
    """Team serializer"""
    manager_name = serializers.CharField(source='manager.full_name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    
    class Meta:
        model = Team
        fields = [
            'id', 'name', 'manager', 'manager_name', 'event', 'event_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TeamMemberSerializer(serializers.ModelSerializer):
    """Team member serializer"""
    athlete_name = serializers.CharField(source='athlete.full_name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    
    class Meta:
        model = TeamMember
        fields = [
            'id', 'team', 'team_name', 'athlete', 'athlete_name', 'jersey_no',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class RegistrationSerializer(serializers.ModelSerializer):
    """Registration serializer"""
    applicant_name = serializers.SerializerMethodField()
    event_name = serializers.CharField(source='event.name', read_only=True)
    
    class Meta:
        model = Registration
        fields = [
            'id', 'event', 'event_name', 'applicant_user', 'applicant_team',
            'applicant_name', 'type', 'status', 'docs', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_applicant_name(self, obj):
        """Get applicant name based on type"""
        if obj.applicant_user:
            return obj.applicant_user.full_name
        elif obj.applicant_team:
            return obj.applicant_team.name
        return None


class FixtureSerializer(serializers.ModelSerializer):
    """Fixture serializer"""
    home_team_name = serializers.CharField(source='home.name', read_only=True)
    away_team_name = serializers.CharField(source='away.name', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    
    class Meta:
        model = Fixture
        fields = [
            'id', 'event', 'event_name', 'round', 'phase', 'start_at',
            'venue', 'venue_name', 'status', 'home', 'home_team_name',
            'away', 'away_team_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ResultSerializer(serializers.ModelSerializer):
    """Result serializer"""
    home_team_name = serializers.CharField(source='fixture.home.name', read_only=True)
    away_team_name = serializers.CharField(source='fixture.away.name', read_only=True)
    winner_name = serializers.CharField(source='winner.name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.full_name', read_only=True)
    is_draw = serializers.ReadOnlyField()
    is_finalized = serializers.ReadOnlyField()
    
    class Meta:
        model = Result
        fields = [
            'id', 'fixture', 'home_team_name', 'away_team_name', 'score_home',
            'score_away', 'winner', 'winner_name',
            'verified_by', 'verified_by_name', 'verified_at',
            'is_draw', 'is_finalized', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_draw', 'is_finalized']


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    """Leaderboard entry serializer"""
    team_name = serializers.CharField(source='team.name', read_only=True)
    win_percentage = serializers.ReadOnlyField()
    points_per_match = serializers.ReadOnlyField()
    matches_played = serializers.ReadOnlyField()
    
    class Meta:
        model = LeaderboardEntry
        fields = [
            'id', 'event', 'team', 'team_name', 'pts', 'w', 'd', 'l',
            'gf', 'ga', 'gd', 'win_percentage', 'points_per_match', 'matches_played',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'win_percentage', 'points_per_match', 'matches_played']


class AnnouncementSerializer(serializers.ModelSerializer):
    """Announcement serializer"""
    sent_by_name = serializers.CharField(source='sent_by.full_name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    
    class Meta:
        model = Announcement
        fields = [
            'id', 'event', 'event_name', 'subject', 'body', 'audience',
            'sent_by', 'sent_by_name', 'sent_at'
        ]
        read_only_fields = ['id', 'sent_at']


# Additional serializers for specific use cases
class EventCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating events"""
    
    class Meta:
        model = Event
        fields = [
            'name', 'sport', 'status', 'start_date', 'end_date', 'venue', 'eligibility'
        ]


class RegistrationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating registrations"""
    
    class Meta:
        model = Registration
        fields = [
            'event', 'applicant_user', 'applicant_team', 'type', 'docs'
        ]


class FixtureCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating fixtures"""
    
    class Meta:
        model = Fixture
        fields = [
            'event', 'round', 'phase', 'start_at', 'venue', 'status', 'home', 'away'
        ]


class ResultCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating results"""
    
    class Meta:
        model = Result
        fields = [
            'fixture', 'home_score', 'away_score', 'stats'
        ]


class AnnouncementCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating announcements"""
    
    class Meta:
        model = Announcement
        fields = [
            'event', 'subject', 'body', 'audience'
        ]
