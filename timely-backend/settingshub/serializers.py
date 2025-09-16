# settingshub/serializers.py
from rest_framework import serializers
from .models import SiteSetting, FeatureFlag


class SiteSettingSerializer(serializers.ModelSerializer):
    """Serializer for site settings"""
    
    class Meta:
        model = SiteSetting
        fields = [
            'site_name', 'site_logo', 'site_favicon',
            'primary_color', 'secondary_color',
            'support_email', 'support_phone', 'contact_address',
            'allow_spectator_uploads', 'require_email_verification', 'allow_public_registration',
            'maintenance_mode', 'maintenance_banner',
            'facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url',
            'google_analytics_id', 'google_tag_manager_id',
            'from_email', 'email_signature',
            'max_file_size_mb', 'allowed_file_types',
            'created_at', 'updated_at', 'updated_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'updated_by']
    
    def validate_primary_color(self, value):
        """Validate primary color format"""
        if not value.startswith('#'):
            raise serializers.ValidationError('Color must start with #')
        if len(value) != 7:
            raise serializers.ValidationError('Color must be 7 characters long (#RRGGBB)')
        return value
    
    def validate_secondary_color(self, value):
        """Validate secondary color format"""
        if not value.startswith('#'):
            raise serializers.ValidationError('Color must start with #')
        if len(value) != 7:
            raise serializers.ValidationError('Color must be 7 characters long (#RRGGBB)')
        return value
    
    def validate_max_file_size_mb(self, value):
        """Validate file size limit"""
        if value < 1:
            raise serializers.ValidationError('File size must be at least 1 MB')
        if value > 100:
            raise serializers.ValidationError('File size cannot exceed 100 MB')
        return value


class SiteSettingUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating site settings"""
    
    class Meta:
        model = SiteSetting
        fields = [
            'site_name', 'site_logo', 'site_favicon',
            'primary_color', 'secondary_color',
            'support_email', 'support_phone', 'contact_address',
            'allow_spectator_uploads', 'require_email_verification', 'allow_public_registration',
            'maintenance_mode', 'maintenance_banner',
            'facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url',
            'google_analytics_id', 'google_tag_manager_id',
            'from_email', 'email_signature',
            'max_file_size_mb', 'allowed_file_types'
        ]
    
    def validate_primary_color(self, value):
        """Validate primary color format"""
        if not value.startswith('#'):
            raise serializers.ValidationError('Color must start with #')
        if len(value) != 7:
            raise serializers.ValidationError('Color must be 7 characters long (#RRGGBB)')
        return value
    
    def validate_secondary_color(self, value):
        """Validate secondary color format"""
        if not value.startswith('#'):
            raise serializers.ValidationError('Color must start with #')
        if len(value) != 7:
            raise serializers.ValidationError('Color must be 7 characters long (#RRGGBB)')
        return value


class FeatureFlagSerializer(serializers.ModelSerializer):
    """Serializer for feature flags"""
    
    enabled_for_users_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FeatureFlag
        fields = [
            'id', 'name', 'description', 'enabled', 'enabled_for_all',
            'enabled_for_roles', 'enabled_for_users', 'enabled_for_users_count',
            'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def get_enabled_for_users_count(self, obj):
        """Get count of users this feature is enabled for"""
        return obj.enabled_for_users.count()
    
    def validate_name(self, value):
        """Validate feature flag name"""
        if not value.replace('_', '').isalnum():
            raise serializers.ValidationError('Name must contain only letters, numbers, and underscores')
        return value.lower()


class FeatureFlagUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating feature flags"""
    
    class Meta:
        model = FeatureFlag
        fields = [
            'name', 'description', 'enabled', 'enabled_for_all',
            'enabled_for_roles', 'enabled_for_users'
        ]
    
    def validate_name(self, value):
        """Validate feature flag name"""
        if not value.replace('_', '').isalnum():
            raise serializers.ValidationError('Name must contain only letters, numbers, and underscores')
        return value.lower()


class PublicSiteSettingSerializer(serializers.ModelSerializer):
    """Serializer for public site settings (no sensitive data)"""
    
    class Meta:
        model = SiteSetting
        fields = [
            'site_name', 'site_logo', 'site_favicon',
            'primary_color', 'secondary_color',
            'support_email', 'support_phone', 'contact_address',
            'facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url',
            'maintenance_mode', 'maintenance_banner'
        ]
        read_only_fields = fields
