# teams/serializers.py
from rest_framework import serializers
from .models import Team, TeamMember
from accounts.serializers import UserSerializer


class TeamMemberSerializer(serializers.ModelSerializer):
    """Serializer for TeamMember model"""
    athlete = UserSerializer(read_only=True)
    athlete_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = TeamMember
        fields = ['id', 'athlete', 'athlete_id', 'jersey_no', 'position', 'is_captain', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_jersey_no(self, value):
        """Validate jersey number"""
        if value <= 0:
            raise serializers.ValidationError("Jersey number must be positive")
        return value


class TeamSerializer(serializers.ModelSerializer):
    """Serializer for Team model"""
    manager = UserSerializer(read_only=True)
    manager_id = serializers.IntegerField(write_only=True)
    coach = UserSerializer(read_only=True, required=False)
    coach_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    members = TeamMemberSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = [
            'id', 'name', 'manager', 'manager_id', 'coach', 'coach_id', 
            'event', 'description', 'members', 'member_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        """Get the number of team members"""
        return obj.members.count()
    
    def validate_name(self, value):
        """Validate team name"""
        if not value or not value.strip():
            raise serializers.ValidationError("Team name cannot be empty")
        return value.strip()
