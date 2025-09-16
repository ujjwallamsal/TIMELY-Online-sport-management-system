# results/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Result, LeaderboardEntry, AthleteStat
from fixtures.models import Fixture
from events.models import Event
from teams.models import Team

User = get_user_model()


class ResultSerializer(serializers.ModelSerializer):
    """Serializer for Result model"""
    
    # Related field data
    fixture_id = serializers.IntegerField(source='fixture.id', read_only=True)
    fixture_name = serializers.CharField(source='fixture.__str__', read_only=True)
    home_team = serializers.CharField(source='fixture.home_team.name', read_only=True)
    away_team = serializers.CharField(source='fixture.away_team.name', read_only=True)
    event_name = serializers.CharField(source='fixture.event.name', read_only=True)
    event_id = serializers.IntegerField(source='fixture.event.id', read_only=True)
    
    # Verification data
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    verified_by_email = serializers.CharField(source='verified_by.email', read_only=True)
    
    # Computed fields
    is_draw = serializers.BooleanField(read_only=True)
    is_verified = serializers.BooleanField(read_only=True)
    can_be_published = serializers.BooleanField(read_only=True)
    winner_name = serializers.CharField(source='winner.name', read_only=True)
    
    class Meta:
        model = Result
        fields = [
            'id', 'fixture_id', 'fixture_name', 'home_team', 'away_team',
            'event_name', 'event_id', 'score_home', 'score_away',
            'status', 'published', 'winner', 'winner_name',
            'verified_by', 'verified_by_name', 'verified_by_email',
            'verified_at', 'notes', 'is_draw', 'is_verified',
            'can_be_published', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'verified_at']

    def validate(self, data):
        """Validate result data"""
        # Validate winner matches one of the teams
        if 'winner' in data and 'fixture' in data:
            fixture = data['fixture']
            winner = data['winner']
            home_team = fixture.home_team
            away_team = fixture.away_team
            
            if winner and winner not in [home_team, away_team]:
                raise serializers.ValidationError(
                    "Winner must be one of the teams in the fixture"
                )
        
        return data


class ResultCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating results"""
    
    class Meta:
        model = Result
        fields = ['score_home', 'score_away', 'notes']
    
    def create(self, validated_data):
        """Create result and automatically set winner"""
        result = super().create(validated_data)
        
        # Auto-set winner based on scores
        if result.score_home > result.score_away:
            result.winner = result.fixture.home_team
        elif result.score_away > result.score_home:
            result.winner = result.fixture.away_team
        # For draws, winner remains None
        
        result.save()
        return result


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    """Serializer for LeaderboardEntry model"""
    
    team_name = serializers.CharField(source='team.name', read_only=True)
    team_id = serializers.IntegerField(source='team.id', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    event_id = serializers.IntegerField(source='event.id', read_only=True)
    
    # Computed fields
    win_percentage = serializers.FloatField(read_only=True)
    points_per_match = serializers.FloatField(read_only=True)
    
    class Meta:
        model = LeaderboardEntry
        fields = [
            'id', 'event_id', 'event_name', 'team_id', 'team_name',
            'position', 'points', 'matches_played', 'wins', 'draws', 'losses',
            'goals_for', 'goals_against', 'goal_difference',
            'win_percentage', 'points_per_match', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AthleteStatSerializer(serializers.ModelSerializer):
    """Serializer for AthleteStat model"""
    
    athlete_name = serializers.CharField(source='athlete.get_full_name', read_only=True)
    athlete_email = serializers.CharField(source='athlete.email', read_only=True)
    athlete_id = serializers.IntegerField(source='athlete.id', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    event_id = serializers.IntegerField(source='event.id', read_only=True)
    
    # Verification data
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    verified_by_email = serializers.CharField(source='verified_by.email', read_only=True)
    
    class Meta:
        model = AthleteStat
        fields = [
            'id', 'event_id', 'event_name', 'athlete_id', 'athlete_name',
            'athlete_email', 'metrics', 'position', 'points', 'verified',
            'verified_by', 'verified_by_name', 'verified_by_email',
            'verified_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'verified_at']


class AthleteStatCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating athlete stats"""
    
    class Meta:
        model = AthleteStat
        fields = ['athlete', 'metrics', 'points']
    
    def validate_metrics(self, value):
        """Validate metrics JSONB field"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Metrics must be a dictionary")
        return value


class ResultActionSerializer(serializers.Serializer):
    """Serializer for result actions (finalize, verify, publish, etc.)"""
    
    action = serializers.ChoiceField(choices=[
        'finalize', 'verify', 'publish', 'unpublish', 'invalidate'
    ])
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_action(self, value):
        """Validate action based on current result state"""
        result = self.context.get('result')
        if not result:
            return value
        
        if value == 'finalize' and result.status == result.Status.FINAL:
            raise serializers.ValidationError("Result is already finalized")
        
        if value == 'verify' and result.is_verified:
            raise serializers.ValidationError("Result is already verified")
        
        if value == 'publish' and not result.can_be_published:
            raise serializers.ValidationError("Result cannot be published (must be final and verified)")
        
        if value == 'unpublish' and not result.published:
            raise serializers.ValidationError("Result is not published")
        
        if value == 'invalidate' and result.status == result.Status.PROVISIONAL:
            raise serializers.ValidationError("Result is already provisional")
        
        return value


class LeaderboardSummarySerializer(serializers.Serializer):
    """Serializer for leaderboard summary"""
    
    event_id = serializers.IntegerField()
    event_name = serializers.CharField()
    total_teams = serializers.IntegerField()
    total_matches = serializers.IntegerField()
    leaderboard = LeaderboardEntrySerializer(many=True)


class RecentResultsSerializer(serializers.Serializer):
    """Serializer for recent results"""
    
    results = ResultSerializer(many=True)
    total_count = serializers.IntegerField()
    has_more = serializers.BooleanField()


class FixtureResultSerializer(serializers.ModelSerializer):
    """Serializer for fixture with result data"""
    
    result = ResultSerializer(read_only=True)
    home_team = serializers.CharField(source='home_team.name', read_only=True)
    away_team = serializers.CharField(source='away_team.name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    
    class Meta:
        model = Fixture
        fields = [
            'id', 'event_name', 'home_team', 'away_team', 'venue_name',
            'starts_at', 'ends_at', 'status', 'result'
        ]


class EventResultsSummarySerializer(serializers.Serializer):
    """Serializer for event results summary"""
    
    event_id = serializers.IntegerField()
    event_name = serializers.CharField()
    total_fixtures = serializers.IntegerField()
    completed_fixtures = serializers.IntegerField()
    published_results = serializers.IntegerField()
    pending_results = serializers.IntegerField()
    leaderboard = LeaderboardEntrySerializer(many=True)
    recent_results = ResultSerializer(many=True)