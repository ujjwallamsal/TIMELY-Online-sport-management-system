from rest_framework import serializers
from .models import Album, MediaAsset, Media, GalleryAlbum, GalleryMedia

class MediaAssetSerializer(serializers.ModelSerializer):
    share_url = serializers.SerializerMethodField()

    class Meta:
        model = MediaAsset
        fields = [
            "id", "album", "kind", "file", "external_url",
            "caption", "is_public", "uploaded_by", "uploaded_at",
            "share_url",
        ]
        read_only_fields = ["uploaded_by", "uploaded_at", "share_url"]

    def get_share_url(self, obj: MediaAsset) -> str:
        """
        Public URL the frontend can share on social.
        We’ll point to the public media detail endpoint.
        """
        request = self.context.get("request")
        if not request:
            return ""
        return request.build_absolute_uri(f"/api/public/media/{obj.id}/")


class AlbumSerializer(serializers.ModelSerializer):
    assets = MediaAssetSerializer(many=True, read_only=True)
    share_url = serializers.SerializerMethodField()

    class Meta:
        model = Album
        fields = [
            "id", "event", "match", "title", "description", "is_public",
            "created_by", "created_at", "assets", "share_url",
        ]
        read_only_fields = ["created_by", "created_at", "assets", "share_url"]

    def get_share_url(self, obj: Album) -> str:
        request = self.context.get("request")
        if not request:
            return ""

        return request.build_absolute_uri(f"/api/public/albums/{obj.id}/")



class MediaUploadSerializer(serializers.ModelSerializer):
    """Serializer for media upload"""
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Media
        fields = [
            "id", "file", "media_type", "event", "caption", "is_approved",
            "uploaded_by", "created_at", "file_url"
        ]
        read_only_fields = ["id", "is_approved", "uploaded_by", "created_at", "file_url"]

    def get_file_url(self, obj):
        """Get the URL for the media file"""
        return obj.file_url

    def create(self, validated_data):
        """Set uploaded_by to current user"""
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["uploaded_by"] = request.user
        return super().create(validated_data)


class MediaModerationSerializer(serializers.ModelSerializer):
    """Serializer for media moderation (admin/organizer only)"""
    file_url = serializers.SerializerMethodField()
    uploaded_by_email = serializers.SerializerMethodField()
    event_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Media
        fields = [
            "id", "file", "media_type", "event", "caption", "is_approved",
            "uploaded_by", "uploaded_by_email", "event_name",
            "created_at", "file_url"
        ]
        read_only_fields = ["id", "file", "media_type", "event", "caption",
                           "uploaded_by", "created_at", "file_url", "uploaded_by_email", 
                           "event_name"]

    def get_file_url(self, obj):
        return obj.file_url

    def get_uploaded_by_email(self, obj):
        return obj.uploaded_by.email if obj.uploaded_by else None

    def get_event_name(self, obj):
        return obj.event.name if obj.event else None

class PublicMediaSerializer(serializers.ModelSerializer):
    """Serializer for public media display (only approved media)"""
    file_url = serializers.SerializerMethodField()
    event_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Media
        fields = [
            "id", "media_type", "event", "caption",
            "created_at", "file_url", "event_name"
        ]

    def get_file_url(self, obj):
        return obj.file_url

    def get_event_name(self, obj):
        return obj.event.name if obj.event else None



class MediaSerializer(serializers.ModelSerializer):
    """General purpose media serializer"""
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Media
        fields = "__all__"
        read_only_fields = ["uploaded_by", "created_at", "file_url"]

    def get_file_url(self, obj):
        return obj.file_url

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["uploaded_by"] = request.user
        return super().create(validated_data)


class GalleryAlbumSerializer(serializers.ModelSerializer):
    """Serializer for gallery albums"""
    media_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GalleryAlbum
        fields = [
            "id", "title", "description", "cover", "is_public", 
            "created_by", "created_at", "media_count"
        ]
        read_only_fields = ["id", "created_by", "created_at", "media_count"]

    def get_media_count(self, obj):
        return obj.media_items.filter(is_public=True).count()

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["created_by"] = request.user
        return super().create(validated_data)


class GalleryMediaSerializer(serializers.ModelSerializer):
    """Serializer for gallery media"""
    file_url = serializers.SerializerMethodField()
    album_title = serializers.CharField(source='album.title', read_only=True)
    
    class Meta:
        model = GalleryMedia
        fields = [
            "id", "album", "title", "media_type", "image", "video_url",
            "is_public", "uploaded_by", "created_at", "file_url", "album_title"
        ]
        read_only_fields = ["id", "uploaded_by", "created_at", "file_url", "album_title"]

    def get_file_url(self, obj):
        return obj.file_url

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["uploaded_by"] = request.user
        return super().create(validated_data)


class PublicGalleryAlbumSerializer(serializers.ModelSerializer):
    """Public serializer for gallery albums (read-only, public only)"""
    media_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GalleryAlbum
        fields = [
            "id", "title", "description", "cover", "created_at", "media_count"
        ]
        read_only_fields = ["id", "title", "description", "cover", "created_at", "media_count"]

    def get_media_count(self, obj):
        return obj.media_items.filter(is_public=True).count()


class PublicGalleryMediaSerializer(serializers.ModelSerializer):
    """Public serializer for gallery media (read-only, public only)"""
    file_url = serializers.SerializerMethodField()
    album_title = serializers.CharField(source='album.title', read_only=True)
    
    class Meta:
        model = GalleryMedia
        fields = [
            "id", "album", "title", "media_type", "image", "video_url",
            "created_at", "file_url", "album_title"
        ]
        read_only_fields = ["id", "album", "title", "media_type", "image", "video_url",
                           "created_at", "file_url", "album_title"]

    def get_file_url(self, obj):
        return obj.file_url
