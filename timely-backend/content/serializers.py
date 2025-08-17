from rest_framework import serializers
from .models import Page, Announcement


class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = ["id", "title", "slug", "body", "is_published", "created_at"]
        read_only_fields = ["id", "created_at"]


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ["id", "title", "body", "is_published", "created_at"]
        read_only_fields = ["id", "created_at"]
