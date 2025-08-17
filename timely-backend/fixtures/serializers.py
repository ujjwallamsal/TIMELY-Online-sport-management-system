# fixtures/serializers.py
from __future__ import annotations
from rest_framework import serializers
from .models import Match

class MatchSerializer(serializers.ModelSerializer):
    event_name = serializers.CharField(source="event.name", read_only=True)
    venue_name = serializers.CharField(source="venue.name", read_only=True)
    team_a_name = serializers.CharField(source="team_a.name", read_only=True)
    team_b_name = serializers.CharField(source="team_b.name", read_only=True)

    class Meta:
        model = Match
        fields = [
            "id", "event", "event_name",
            "venue", "venue_name",
            "team_a", "team_a_name",
            "team_b", "team_b_name",
            "start_time", "end_time",
            "status", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
