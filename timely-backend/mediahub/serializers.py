"""
Media Hub serializers for API operations.
Handles CRUD operations, moderation actions, and public gallery.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import MediaItem

User = get_user_model()


class MediaItemSerializer(serializers.ModelSerializer):
    """Serializer for MediaItem CRUD operations"""
    
    uploader_name = serializers.CharField(source='uploader.display_name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    fixture_name = serializers.CharField(source='fixture.name', read_only=True)
    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    share_url = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_moderate = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    
    class Meta:
        model = MediaItem
        fields = [
            'id', 'uploader', 'uploader_name', 'event', 'event_name',
            'fixture', 'fixture_name', 'kind', 'file', 'file_url',
            'thumbnail', 'thumbnail_url', 'title', 'description',
            'status', 'featured', 'created_at', 'updated_at',
            'share_url', 'can_edit', 'can_moderate', 'can_delete'
        ]
        read_only_fields = ['id', 'uploader', 'created_at', 'updated_at']
    
    def get_file_url(self, obj):
        """Get full URL for media file"""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_thumbnail_url(self, obj):
        """Get full URL for thumbnail"""
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None
    
    def get_share_url(self, obj):
        """Get share URL"""
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.get_share_url())
        return obj.get_share_url()
    
    def get_can_edit(self, obj):
        """Check if current user can edit"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.can_edit(request.user)
        return False
    
    def get_can_moderate(self, obj):
        """Check if current user can moderate"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.can_moderate(request.user)
        return False
    
    def get_can_delete(self, obj):
        """Check if current user can delete"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.can_delete(request.user)
        return False
    
    def validate(self, data):
        """Validate media item data"""
        # Ensure at least one of event or fixture is provided
        if not data.get('event') and not data.get('fixture'):
            raise serializers.ValidationError(
                "Media must be linked to either an event or fixture"
            )
        
        # If fixture is provided, ensure it belongs to the event (if provided)
        if data.get('fixture') and data.get('event'):
            if data['fixture'].event != data['event']:
                raise serializers.ValidationError(
                    "Fixture must belong to the specified event"
                )
        
        return data


class MediaItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating media items (with file upload)"""
    
    class Meta:
        model = MediaItem
        fields = [
            'id', 'event', 'fixture', 'file', 'title', 'description', 'status', 'kind'
        ]
        read_only_fields = ['id', 'status', 'kind']
    
    def validate_file(self, value):
        """Validate uploaded file"""
        from .services.storage import validate_media_file
        
        # Validate file type and size
        try:
            validate_media_file(value)
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        
        return value
    
    def validate(self, data):
        """Validate creation data"""
        # Set uploader from request
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            data['uploader'] = request.user
        else:
            raise serializers.ValidationError("Authentication required")
        
        # Ensure at least one of event or fixture is provided
        if not data.get('event') and not data.get('fixture'):
            raise serializers.ValidationError(
                "Media must be linked to either an event or fixture"
            )
        
        return data
    
    def create(self, validated_data):
        """Create media item with EXIF stripping for images"""
        from .services.storage import strip_exif_metadata
        
        file = validated_data.get('file')
        
        # Strip EXIF metadata from images for privacy
        if file and file.content_type and file.content_type.startswith('image/'):
            validated_data['file'] = strip_exif_metadata(file)
        
        return super().create(validated_data)


class MediaItemUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating media items (no file changes)"""
    
    class Meta:
        model = MediaItem
        fields = ['title', 'description', 'event', 'fixture', 'featured']
    
    def validate(self, data):
        """Validate update data"""
        # Only allow certain fields to be updated based on user permissions
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required")
        
        instance = self.instance
        user = request.user
        
        # Uploaders can only edit title/description while pending
        if instance.uploader == user and instance.status == MediaItem.Status.PENDING:
            allowed_fields = {'title', 'description'}
            for field in data:
                if field not in allowed_fields:
                    raise serializers.ValidationError(
                        f"Uploaders can only edit title and description while pending"
                    )
        
        # Moderators can edit more fields
        elif instance.can_moderate(user):
            # Moderators can edit all fields
            pass
        else:
            raise serializers.ValidationError("Insufficient permissions")
        
        return data


class MediaItemPublicSerializer(serializers.ModelSerializer):
    """Serializer for public gallery (approved items only)"""
    
    uploader_name = serializers.CharField(source='uploader.display_name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    fixture_name = serializers.CharField(source='fixture.name', read_only=True)
    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    share_url = serializers.SerializerMethodField()
    
    class Meta:
        model = MediaItem
        fields = [
            'id', 'uploader_name', 'event', 'event_name',
            'fixture', 'fixture_name', 'kind', 'file_url',
            'thumbnail_url', 'title', 'description',
            'featured', 'created_at', 'share_url'
        ]
    
    def get_file_url(self, obj):
        """Get full URL for media file"""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_thumbnail_url(self, obj):
        """Get full URL for thumbnail"""
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None
    
    def get_share_url(self, obj):
        """Get share URL"""
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.get_share_url())
        return obj.get_share_url()


class MediaModerationSerializer(serializers.Serializer):
    """Serializer for moderation actions"""
    
    reason = serializers.CharField(
        max_length=500,
        required=False,
        help_text="Optional reason for moderation action"
    )


class MediaShareSerializer(serializers.ModelSerializer):
    """Serializer for share information"""
    
    share_url = serializers.SerializerMethodField()
    share_text = serializers.SerializerMethodField()
    uploader_name = serializers.CharField(source='uploader.display_name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    fixture_name = serializers.CharField(source='fixture.name', read_only=True)
    
    class Meta:
        model = MediaItem
        fields = [
            'id', 'title', 'description', 'kind', 'uploader_name',
            'event_name', 'fixture_name', 'created_at',
            'share_url', 'share_text'
        ]
    
    def get_share_url(self, obj):
        """Get canonical share URL"""
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.get_share_url())
        return obj.get_share_url()
    
    def get_share_text(self, obj):
        """Get suggested share text"""
        return obj.get_share_text()
