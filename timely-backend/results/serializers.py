# results/serializers.py
from __future__ import annotations
from rest_framework import serializers
from .models import Result

class ResultSerializer(serializers.ModelSerializer):
    event = serializers.IntegerField(source="match.event_id", read_only=True)
    match_str = serializers.CharField(source="match.__str__", read_only=True)

    class Meta:
        model = Result
        fields = ["id", "match", "event", "score_a", "score_b", "notes", "match_str", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at", "event", "match_str"]
