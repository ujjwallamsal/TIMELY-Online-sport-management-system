# realtime/serializers.py
from rest_framework import serializers
from results.models import Result, LeaderboardEntry
from fixtures.models import Fixture
from events.models import Announcement


class MinimalResultSerializer(serializers.ModelSerializer):
    """Minimal result serializer for real-time updates"""
    home_team_name = serializers.CharField(source='fixture.home.name', read_only=True)
    away_team_name = serializers.CharField(source='fixture.away.name', read_only=True)
    winner_name = serializers.CharField(source='winner.name', read_only=True)
    
    class Meta:
        model = Result
        fields = [
            'id', 'home_score', 'away_score', 'winner_name',
            'home_team_name', 'away_team_name', 'is_draw', 'is_finalized',
            'finalized_at', 'created_at'
        ]


class MinimalLeaderboardEntrySerializer(serializers.ModelSerializer):
    """Minimal leaderboard entry serializer for real-time updates"""
    team_name = serializers.CharField(source='team.name', read_only=True)
    position = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaderboardEntry
        fields = [
            'id', 'team_name', 'pts', 'w', 'd', 'l', 'gf', 'ga', 'gd',
            'win_percentage', 'points_per_match', 'matches_played', 'position'
        ]
    
    def get_position(self, obj):
        """Get position in leaderboard"""
        # This would need to be calculated based on the current leaderboard
        # For now, return a placeholder
        return 1


class MinimalFixtureSerializer(serializers.ModelSerializer):
    """Minimal fixture serializer for real-time updates"""
    home_team_name = serializers.CharField(source='home.name', read_only=True)
    away_team_name = serializers.CharField(source='away.name', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    
    class Meta:
        model = Fixture
        fields = [
            'id', 'round', 'phase', 'start_at', 'venue_name', 'status',
            'home_team_name', 'away_team_name', 'created_at'
        ]


class MinimalAnnouncementSerializer(serializers.ModelSerializer):
    """Minimal announcement serializer for real-time updates"""
    sent_by_name = serializers.CharField(source='sent_by.full_name', read_only=True)
    
    class Meta:
        model = Announcement
        fields = [
            'id', 'subject', 'body', 'audience', 'sent_by_name', 'sent_at'
        ]


class RealtimeUpdateSerializer(serializers.Serializer):
    """Serializer for real-time update messages"""
    type = serializers.CharField()
    event_id = serializers.CharField()
    data = serializers.DictField()
    timestamp = serializers.DateTimeField()


class ResultsUpdateSerializer(serializers.Serializer):
    """Serializer for results update messages"""
    type = serializers.CharField(default='results_update')
    event_id = serializers.CharField()
    result = MinimalResultSerializer(required=False)
    leaderboard = MinimalLeaderboardEntrySerializer(many=True, required=False)
    message = serializers.CharField(required=False)
    timestamp = serializers.DateTimeField()


class ScheduleUpdateSerializer(serializers.Serializer):
    """Serializer for schedule update messages"""
    type = serializers.CharField(default='schedule_update')
    event_id = serializers.CharField()
    fixture = MinimalFixtureSerializer(required=False)
    fixtures = MinimalFixtureSerializer(many=True, required=False)
    message = serializers.CharField(required=False)
    timestamp = serializers.DateTimeField()


class AnnouncementsUpdateSerializer(serializers.Serializer):
    """Serializer for announcements update messages"""
    type = serializers.CharField(default='announcements_update')
    event_id = serializers.CharField()
    announcement = MinimalAnnouncementSerializer(required=False)
    message = serializers.CharField(required=False)
    timestamp = serializers.DateTimeField()
