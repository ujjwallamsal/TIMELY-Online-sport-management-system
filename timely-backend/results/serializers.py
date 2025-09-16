# results/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Result, LeaderboardEntry
from fixtures.models import Fixture
from events.models import Event
from api.models import Team

User = get_user_model()


class ResultSerializer(serializers.ModelSerializer):
    """Serializer for Result model"""
    
    # Related field data
    fixture_id = serializers.IntegerField(source='fixture.id', read_only=True)
    fixture_name = serializers.CharField(source='fixture.__str__', read_only=True)
    home_team = serializers.CharField(source='fixture.home.name', read_only=True)
    away_team = serializers.CharField(source='fixture.away.name', read_only=True)
    event_name = serializers.CharField(source='fixture.event.name', read_only=True)
    event_id = serializers.IntegerField(source='fixture.event.id', read_only=True)
    
    # Verification data
    entered_by_name = serializers.CharField(source='entered_by.get_full_name', read_only=True)
    entered_by_email = serializers.CharField(source='entered_by.email', read_only=True)
    
    # Computed fields
    is_draw = serializers.BooleanField(read_only=True)
    is_finalized = serializers.BooleanField(read_only=True)
    winner_name = serializers.CharField(source='winner.name', read_only=True)
    
    class Meta:
        model = Result
        fields = [
            'id', 'fixture_id', 'fixture_name', 'home_team', 'away_team',
            'event_name', 'event_id', 'home_score', 'away_score',
            'winner', 'winner_name', 'stats',
            'entered_by', 'entered_by_name', 'entered_by_email',
            'finalized_at', 'is_draw', 'is_finalized',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'finalized_at']

    def validate(self, data):
        """Validate result data"""
        # Validate winner matches one of the teams
        if 'winner' in data and 'fixture' in data:
            fixture = data['fixture']
            winner = data['winner']
            home_team = fixture.home
            away_team = fixture.away
            
            if winner and winner not in [home_team, away_team]:
                raise serializers.ValidationError(
                    "Winner must be one of the teams in the fixture"
                )
        
        return data


class ResultCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating results"""
    
    class Meta:
        model = Result
        fields = ['home_score', 'away_score', 'stats']
    
    def create(self, validated_data):
        """Create result and automatically set winner"""
        result = super().create(validated_data)
        
        # Auto-set winner based on scores
        if result.home_score > result.away_score:
            result.winner = result.fixture.home
        elif result.away_score > result.home_score:
            result.winner = result.fixture.away
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
    matches_played = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = LeaderboardEntry
        fields = [
            'id', 'event_id', 'event_name', 'team_id', 'team_name',
            'pts', 'w', 'd', 'l', 'gf', 'ga', 'gd',
            'win_percentage', 'points_per_match', 'matches_played',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ResultActionSerializer(serializers.Serializer):
    """Serializer for result actions (finalize, lock, etc.)"""
    
    action = serializers.ChoiceField(choices=[
        'finalize', 'lock'
    ])
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_action(self, value):
        """Validate action based on current result state"""
        result = self.context.get('result')
        if not result:
            return value
        
        if value == 'finalize' and result.is_finalized:
            raise serializers.ValidationError("Result is already finalized")
        
        if value == 'lock' and result.is_finalized:
            raise serializers.ValidationError("Result is already locked")
        
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
    home_team = serializers.CharField(source='home.name', read_only=True)
    away_team = serializers.CharField(source='away.name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    
    class Meta:
        model = Fixture
        fields = [
            'id', 'event_name', 'home_team', 'away_team', 'venue_name',
            'start_at', 'status', 'result'
        ]


class EventResultsSummarySerializer(serializers.Serializer):
    """Serializer for event results summary"""
    
    event_id = serializers.IntegerField()
    event_name = serializers.CharField()
    total_fixtures = serializers.IntegerField()
    completed_fixtures = serializers.IntegerField()
    finalized_results = serializers.IntegerField()
    pending_results = serializers.IntegerField()
    leaderboard = LeaderboardEntrySerializer(many=True)
    recent_results = ResultSerializer(many=True)