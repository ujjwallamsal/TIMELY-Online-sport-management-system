from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Team, TeamMember, AthleteProfile, TeamInvitation, TeamEventEntry
from venues.serializers import VenueSerializer

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user information serializer"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'first_name', 'last_name']


class AthleteProfileSerializer(serializers.ModelSerializer):
    """Serializer for athlete profiles"""
    user = UserBasicSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = AthleteProfile
        fields = [
            'id', 'user', 'user_id', 'height_cm', 'weight_kg', 'primary_sport',
            'secondary_sports', 'years_experience', 'skill_level', 'achievements',
            'medical_conditions', 'emergency_contact', 'emergency_phone',
            'preferred_positions', 'availability', 'is_complete', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'is_complete', 'created_at', 'updated_at']
    
    def validate_user_id(self, value):
        """Validate that the user exists and doesn't already have a profile"""
        try:
            user = User.objects.get(id=value)
            if hasattr(user, 'athlete_profile'):
                raise serializers.ValidationError("User already has an athlete profile")
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")
        return value


class TeamMemberSerializer(serializers.ModelSerializer):
    """Serializer for team members"""
    user = UserBasicSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = TeamMember
        fields = [
            'id', 'team', 'user', 'user_id', 'team_name', 'full_name', 'date_of_birth',
            'role', 'role_display', 'status', 'status_display', 'jersey_number', 
            'position', 'joined_date', 'left_date', 'can_manage_team', 'can_edit_results', 
            'is_active_member', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'team', 'user', 'team_name', 'role_display', 
                           'status_display', 'joined_date', 'is_active_member', 
                           'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate team member data"""
        if 'jersey_number' in data and data['jersey_number']:
            # Check if jersey number is already taken by another active member
            existing_member = TeamMember.objects.filter(
                team=data['team'],
                jersey_number=data['jersey_number'],
                status=TeamMember.Status.ACTIVE
            ).exclude(id=self.instance.id if self.instance else None)
            
            if existing_member.exists():
                raise serializers.ValidationError(
                    f"Jersey number {data['jersey_number']} is already taken by another team member"
                )
        
        return data


class TeamSerializer(serializers.ModelSerializer):
    """Serializer for teams"""
    members = TeamMemberSerializer(many=True, read_only=True)
    home_venue = VenueSerializer(read_only=True)
    home_venue_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    manager = UserBasicSerializer(read_only=True)
    manager_id = serializers.IntegerField(write_only=True)
    coach = UserBasicSerializer(read_only=True)
    coach_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    created_by = UserBasicSerializer(read_only=True)
    created_by_id = serializers.IntegerField(write_only=True, required=False)
    
    # Computed fields
    total_members = serializers.SerializerMethodField()
    active_members = serializers.SerializerMethodField()
    win_percentage = serializers.FloatField(read_only=True)
    points = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Team
        fields = [
            'id', 'name', 'sport', 'description', 'manager', 'manager_id', 'coach', 'coach_id',
            'contact_email', 'contact_phone', 'founded_date', 'home_venue', 'home_venue_id', 
            'logo', 'is_active', 'is_public', 'total_matches', 'wins', 'losses', 'draws', 
            'total_members', 'active_members', 'win_percentage', 'points', 'created_by', 
            'created_by_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_matches', 'wins', 'losses', 'draws',
                           'win_percentage', 'points', 'created_by', 'created_at', 'updated_at']
    
    def get_total_members(self, obj):
        """Get total number of team members"""
        return obj.members.count()
    
    def get_active_members(self, obj):
        """Get number of active team members"""
        return obj.members.filter(status=TeamMember.Status.ACTIVE).count()
    
    def validate_name(self, value):
        """Validate team name uniqueness"""
        if Team.objects.filter(name=value).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("A team with this name already exists")
        return value


class TeamCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating teams"""
    class Meta:
        model = Team
        fields = [
            'name', 'sport', 'description', 'manager_id', 'coach_id', 'contact_email', 
            'contact_phone', 'founded_date', 'home_venue', 'logo', 'is_active', 'is_public'
        ]


class TeamUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating teams"""
    class Meta:
        model = Team
        fields = [
            'name', 'sport', 'description', 'manager_id', 'coach_id', 'contact_email', 
            'contact_phone', 'founded_date', 'home_venue', 'logo', 'is_active', 'is_public'
        ]
        read_only_fields = ['created_by']


class TeamMemberCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating team members"""
    class Meta:
        model = TeamMember
        fields = [
            'team', 'user', 'user_id', 'full_name', 'date_of_birth', 'role', 
            'jersey_number', 'position', 'can_manage_team', 'can_edit_results'
        ]
    
    def validate(self, data):
        """Validate team member creation"""
        # Check if user is already a member of this team (if user is provided)
        if data.get('user') and TeamMember.objects.filter(team=data['team'], user=data['user']).exists():
            raise serializers.ValidationError("User is already a member of this team")
        
        # Ensure either user or full_name is provided
        if not data.get('user') and not data.get('full_name'):
            raise serializers.ValidationError("Either user or full_name must be provided")
        
        return data


class TeamMemberUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating team members"""
    class Meta:
        model = TeamMember
        fields = [
            'full_name', 'date_of_birth', 'role', 'status', 'jersey_number', 'position',
            'can_manage_team', 'can_edit_results'
        ]


class TeamInvitationSerializer(serializers.ModelSerializer):
    """Serializer for team invitations"""
    team = TeamSerializer(read_only=True)
    team_id = serializers.IntegerField(write_only=True)
    invited_user = UserBasicSerializer(read_only=True)
    invited_user_id = serializers.IntegerField(write_only=True)
    invited_by = UserBasicSerializer(read_only=True)
    invited_by_id = serializers.IntegerField(write_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = TeamInvitation
        fields = [
            'id', 'team', 'team_id', 'invited_user', 'invited_user_id',
            'invited_by', 'invited_by_id', 'role', 'role_display', 'message',
            'status', 'status_display', 'expires_at', 'is_expired',
            'created_at', 'updated_at', 'responded_at'
        ]
        read_only_fields = ['id', 'team', 'invited_user', 'invited_by',
                           'role_display', 'status_display', 'is_expired',
                           'created_at', 'updated_at', 'responded_at']


class TeamInvitationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating team invitations"""
    class Meta:
        model = TeamInvitation
        fields = ['team', 'invited_user', 'role', 'message', 'expires_at']
    
    def validate(self, data):
        """Validate invitation data"""
        # Check if user is already a member of this team
        if TeamMember.objects.filter(team=data['team'], user=data['invited_user']).exists():
            raise serializers.ValidationError("User is already a member of this team")
        
        # Check if there's already a pending invitation
        if TeamInvitation.objects.filter(
            team=data['team'], 
            invited_user=data['invited_user'],
            status=TeamInvitation.Status.PENDING
        ).exists():
            raise serializers.ValidationError("User already has a pending invitation to this team")
        
        return data


class TeamInvitationResponseSerializer(serializers.ModelSerializer):
    """Serializer for responding to team invitations"""
    action = serializers.ChoiceField(choices=['accept', 'decline'], write_only=True)
    
    class Meta:
        model = TeamInvitation
        fields = ['action']
    
    def update(self, instance, validated_data):
        """Handle invitation response"""
        action = validated_data.get('action')
        
        if action == 'accept':
            if instance.accept():
                return instance
            else:
                raise serializers.ValidationError("Cannot accept this invitation")
        elif action == 'decline':
            if instance.decline():
                return instance
            else:
                raise serializers.ValidationError("Cannot decline this invitation")
        
        return instance


class TeamStatsSerializer(serializers.ModelSerializer):
    """Serializer for team statistics"""
    total_members = serializers.SerializerMethodField()
    active_members = serializers.SerializerMethodField()
    win_percentage = serializers.FloatField(read_only=True)
    points = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Team
        fields = [
            'id', 'name', 'sport', 'total_matches', 'wins', 'losses', 'draws',
            'total_members', 'active_members', 'win_percentage', 'points'
        ]
    
    def get_total_members(self, obj):
        return obj.members.count()
    
    def get_active_members(self, obj):
        return obj.members.filter(status=TeamMember.Status.ACTIVE).count()


class TeamRosterSerializer(serializers.ModelSerializer):
    """Serializer for team roster display"""
    members = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'sport', 'members']
    
    def get_members(self, obj):
        """Get active team members with their details"""
        active_members = obj.members.filter(status=TeamMember.Status.ACTIVE)
        return TeamMemberSerializer(active_members, many=True).data


class TeamEventEntrySerializer(serializers.ModelSerializer):
    """Serializer for team event entries"""
    team = TeamSerializer(read_only=True)
    team_id = serializers.IntegerField(write_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)
    decided_by_name = serializers.CharField(source='decided_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = TeamEventEntry
        fields = [
            'id', 'team', 'team_id', 'event', 'event_name', 'division', 'division_name',
            'status', 'status_display', 'note', 'decided_at', 'decided_by', 'decided_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'team', 'event_name', 'division_name', 'status_display',
                           'decided_at', 'decided_by', 'decided_by_name', 'created_at', 'updated_at']


class TeamEventEntryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating team event entries"""
    class Meta:
        model = TeamEventEntry
        fields = ['team', 'event', 'division', 'note']
    
    def validate(self, data):
        """Validate entry creation"""
        # Check if team already has an entry for this event/division
        existing_entry = TeamEventEntry.objects.filter(
            team=data['team'],
            event=data['event'],
            division=data.get('division'),
            status__in=[TeamEventEntry.Status.PENDING, TeamEventEntry.Status.APPROVED]
        ).exists()
        
        if existing_entry:
            raise serializers.ValidationError("Team already has an entry for this event/division")
        
        return data


class TeamEventEntryActionSerializer(serializers.Serializer):
    """Serializer for entry actions (approve/reject/withdraw)"""
    note = serializers.CharField(required=False, allow_blank=True)
    
    def validate_note(self, value):
        """Validate note is provided for reject action"""
        if self.context.get('action') == 'reject' and not value:
            raise serializers.ValidationError("Note is required when rejecting an entry")
        return value


class EligibilityCheckSerializer(serializers.Serializer):
    """Serializer for eligibility check requests"""
    team_id = serializers.IntegerField()
    event_id = serializers.IntegerField()
    division_id = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_team_id(self, value):
        """Validate team exists"""
        try:
            Team.objects.get(id=value)
        except Team.DoesNotExist:
            raise serializers.ValidationError("Team not found")
        return value
    
    def validate_event_id(self, value):
        """Validate event exists"""
        try:
            from events.models import Event
            Event.objects.get(id=value)
        except:
            raise serializers.ValidationError("Event not found")
        return value
    
    def validate_division_id(self, value):
        """Validate division exists if provided"""
        if value:
            try:
                from events.models import Division
                Division.objects.get(id=value)
            except:
                raise serializers.ValidationError("Division not found")
        return value


class EligibilityResultSerializer(serializers.Serializer):
    """Serializer for eligibility check results"""
    eligible = serializers.BooleanField()
    reasons = serializers.ListField(child=serializers.CharField())
    team_summary = serializers.DictField(required=False)
