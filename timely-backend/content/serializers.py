from rest_framework import serializers
from .models import Page, News, Banner, Announcement


class PageSerializer(serializers.ModelSerializer):
    seo_title = serializers.CharField(required=False, allow_blank=True)
    seo_description = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Page
        fields = [
            "id", "title", "slug", "body", "published", "publish_at",
            "seo_title", "seo_description", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_publish_at(self, value):
        """Validate that publish_at is not in the past when published=True."""
        if value and self.initial_data.get('published', False):
            from django.utils import timezone
            if value < timezone.now():
                raise serializers.ValidationError("Cannot schedule publication in the past.")
        return value


class NewsSerializer(serializers.ModelSerializer):
    seo_title = serializers.CharField(required=False, allow_blank=True)
    seo_description = serializers.CharField(required=False, allow_blank=True)
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    
    class Meta:
        model = News
        fields = [
            "id", "title", "body", "published", "publish_at",
            "seo_title", "seo_description", "author", "author_name",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at", "author_name"]

    def validate_publish_at(self, value):
        """Validate that publish_at is not in the past when published=True."""
        if value and self.initial_data.get('published', False):
            from django.utils import timezone
            if value < timezone.now():
                raise serializers.ValidationError("Cannot schedule publication in the past.")
        return value


class BannerSerializer(serializers.ModelSerializer):
    is_active_now = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Banner
        fields = [
            "id", "title", "image", "link_url", "active",
            "starts_at", "ends_at", "is_active_now", "created_at"
        ]
        read_only_fields = ["id", "created_at", "is_active_now"]

    def validate(self, data):
        """Validate that ends_at is after starts_at if both are provided."""
        starts_at = data.get('starts_at')
        ends_at = data.get('ends_at')
        
        if starts_at and ends_at and ends_at <= starts_at:
            raise serializers.ValidationError("End time must be after start time.")
        
        return data


# Keep AnnouncementSerializer for backward compatibility
class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ["id", "title", "slug", "body", "is_published", "created_at"]
        read_only_fields = ["id", "created_at"]
