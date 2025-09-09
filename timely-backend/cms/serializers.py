from rest_framework import serializers
from .models import Page, News, Banner


class PageSerializer(serializers.ModelSerializer):
    """Admin serializer for Page CRUD operations"""
    is_published = serializers.ReadOnlyField()
    
    class Meta:
        model = Page
        fields = [
            'id', 'slug', 'title', 'body', 'published', 'publish_at',
            'seo_title', 'seo_description', 'is_published', 'updated_at', 'created_at'
        ]


class PagePublicSerializer(serializers.ModelSerializer):
    """Public serializer for published pages only"""
    
    class Meta:
        model = Page
        fields = ['slug', 'title', 'body', 'seo_title', 'seo_description', 'updated_at']


class NewsSerializer(serializers.ModelSerializer):
    """Admin serializer for News CRUD operations"""
    is_published = serializers.ReadOnlyField()
    
    class Meta:
        model = News
        fields = [
            'id', 'title', 'body', 'published', 'publish_at',
            'seo_title', 'seo_description', 'is_published', 'created_at', 'updated_at'
        ]


class NewsPublicSerializer(serializers.ModelSerializer):
    """Public serializer for published news only"""
    
    class Meta:
        model = News
        fields = ['id', 'title', 'body', 'seo_title', 'seo_description', 'created_at']


class BannerSerializer(serializers.ModelSerializer):
    """Admin serializer for Banner CRUD operations"""
    is_active = serializers.ReadOnlyField()
    
    class Meta:
        model = Banner
        fields = [
            'id', 'title', 'image', 'link_url', 'active',
            'starts_at', 'ends_at', 'is_active', 'created_at'
        ]


class BannerPublicSerializer(serializers.ModelSerializer):
    """Public serializer for active banners only"""
    
    class Meta:
        model = Banner
        fields = ['id', 'title', 'image', 'link_url']
