"""
Serializers for notifications and messaging system.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Notification, MessageThread, MessageParticipant, Message

User = get_user_model()


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    is_read = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'kind', 'topic', 'title', 'body', 'link_url',
            'delivered_email', 'delivered_sms', 'is_read', 'read_at', 'created_at'
        ]
        read_only_fields = ['id', 'delivered_email', 'delivered_sms', 'read_at', 'created_at']
    
    def get_is_read(self, obj):
        return obj.is_read


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications (admin/organizer use)"""
    
    class Meta:
        model = Notification
        fields = ['user', 'kind', 'topic', 'title', 'body', 'link_url']
    
    def validate_user(self, value):
        """Ensure user exists and is active"""
        if not value.is_active:
            raise serializers.ValidationError("User is not active")
        return value


class AnnouncementSerializer(serializers.Serializer):
    """Serializer for creating announcements"""
    scope = serializers.ChoiceField(choices=['event', 'team', 'registration'])
    scope_id = serializers.CharField()
    title = serializers.CharField(max_length=200)
    body = serializers.CharField()
    kind = serializers.ChoiceField(choices=Notification.KIND_CHOICES, default='announcement')
    topic = serializers.ChoiceField(choices=Notification.TOPIC_CHOICES, default='system')
    link_url = serializers.URLField(required=False, allow_blank=True)
    
    def validate_scope_id(self, value):
        """Validate that scope_id exists for the given scope"""
        scope = self.initial_data.get('scope')
        
        if scope == 'event':
            from events.models import Event
            try:
                Event.objects.get(id=value)
            except Event.DoesNotExist:
                raise serializers.ValidationError("Event not found")
        
        elif scope == 'team':
            from api.models import Team
            try:
                Team.objects.get(id=value)
            except Team.DoesNotExist:
                raise serializers.ValidationError("Team not found")
        
        elif scope == 'registration':
            from registrations.models import Registration
            try:
                Registration.objects.get(id=value)
            except Registration.DoesNotExist:
                raise serializers.ValidationError("Registration not found")
        
        return value


class MessageParticipantSerializer(serializers.ModelSerializer):
    """Serializer for message participants"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = MessageParticipant
        fields = ['id', 'user', 'user_email', 'user_name', 'role', 'last_read_at', 'joined_at']
        read_only_fields = ['id', 'user_email', 'user_name', 'joined_at']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for messages"""
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'thread', 'sender', 'sender_email', 'sender_name',
            'body', 'created_at', 'edited_at', 'deleted_at', 'is_deleted'
        ]
        read_only_fields = ['id', 'sender', 'sender_email', 'sender_name', 'created_at', 'edited_at', 'deleted_at', 'is_deleted']
    
    def validate_body(self, value):
        """Validate message body length"""
        if len(value) > 2000:
            raise serializers.ValidationError("Message body cannot exceed 2000 characters")
        return value


class MessageThreadSerializer(serializers.ModelSerializer):
    """Serializer for message threads"""
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    participants = MessageParticipantSerializer(many=True, read_only=True)
    participant_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MessageThread
        fields = [
            'id', 'scope', 'scope_id', 'title', 'created_by', 'created_by_email', 'created_by_name',
            'created_at', 'participants', 'participant_count', 'last_message', 'unread_count'
        ]
        read_only_fields = ['id', 'created_by', 'created_by_email', 'created_by_name', 'created_at']
    
    def get_participant_count(self, obj):
        return obj.participants.count()
    
    def get_last_message(self, obj):
        last_msg = obj.messages.filter(deleted_at__isnull=True).last()
        if last_msg:
            return {
                'id': last_msg.id,
                'body': last_msg.body[:100] + '...' if len(last_msg.body) > 100 else last_msg.body,
                'sender_email': last_msg.sender.email,
                'created_at': last_msg.created_at
            }
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return 0
        
        try:
            participant = obj.participants.get(user=request.user)
            if participant.last_read_at:
                return obj.messages.filter(
                    deleted_at__isnull=True,
                    created_at__gt=participant.last_read_at
                ).count()
            else:
                return obj.messages.filter(deleted_at__isnull=True).count()
        except MessageParticipant.DoesNotExist:
            return 0


class MessageThreadCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating message threads"""
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = MessageThread
        fields = ['scope', 'scope_id', 'title', 'participant_ids']
    
    def validate_participant_ids(self, value):
        """Validate participant IDs"""
        if not value:
            raise serializers.ValidationError("At least one participant is required")
        
        # Check if all users exist
        existing_users = User.objects.filter(id__in=value, is_active=True)
        if len(existing_users) != len(value):
            raise serializers.ValidationError("Some users not found or inactive")
        
        return value
    
    def create(self, validated_data):
        """Create thread and add participants"""
        participant_ids = validated_data.pop('participant_ids', [])
        thread = MessageThread.objects.create(**validated_data)
        
        # Add creator as participant
        MessageParticipant.objects.create(
            thread=thread,
            user=validated_data['created_by'],
            role='organizer' if validated_data['created_by'].is_staff else 'participant'
        )
        
        # Add other participants
        for user_id in participant_ids:
            if user_id != validated_data['created_by'].id:
                MessageParticipant.objects.create(
                    thread=thread,
                    user_id=user_id,
                    role='participant'
                )
        
        return thread


class MessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating messages"""
    
    class Meta:
        model = Message
        fields = ['body']
    
    def validate_body(self, value):
        """Validate message body"""
        if not value.strip():
            raise serializers.ValidationError("Message body cannot be empty")
        
        if len(value) > 2000:
            raise serializers.ValidationError("Message body cannot exceed 2000 characters")
        
        return value.strip()