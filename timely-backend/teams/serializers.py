from rest_framework import serializers
from .models import Team, AthleteProfile

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ["id", "name", "coach", "created_at"]
        read_only_fields = ["id", "created_at"]

class AthleteProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AthleteProfile
        fields = ["id", "user", "date_of_birth", "bio", "sport", "team"]
        read_only_fields = ["id"]
