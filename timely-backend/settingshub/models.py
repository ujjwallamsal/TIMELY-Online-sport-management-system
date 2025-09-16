# settingshub/models.py
from django.db import models
from django.core.validators import RegexValidator


class SiteSetting(models.Model):
    """
    Singleton model for site-wide settings
    """
    
    # Site branding
    site_name = models.CharField(
        max_length=200,
        default='Timely Events',
        help_text='Site name displayed in header and emails'
    )
    site_logo = models.ImageField(
        upload_to='settings/',
        null=True,
        blank=True,
        help_text='Site logo (PNG/JPG, recommended 200x60px)'
    )
    site_favicon = models.ImageField(
        upload_to='settings/',
        null=True,
        blank=True,
        help_text='Site favicon (PNG/ICO, recommended 32x32px)'
    )
    
    # Brand colors
    primary_color = models.CharField(
        max_length=7,
        default='#007bff',
        validators=[RegexValidator(
            regex=r'^#[0-9A-Fa-f]{6}$',
            message='Enter a valid hex color code (e.g., #007bff)'
        )],
        help_text='Primary brand color (hex code)'
    )
    secondary_color = models.CharField(
        max_length=7,
        default='#6c757d',
        validators=[RegexValidator(
            regex=r'^#[0-9A-Fa-f]{6}$',
            message='Enter a valid hex color code (e.g., #6c757d)'
        )],
        help_text='Secondary brand color (hex code)'
    )
    
    # Contact information
    support_email = models.EmailField(
        default='support@timelyevents.com',
        help_text='Support email address'
    )
    support_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text='Support phone number'
    )
    contact_address = models.TextField(
        blank=True,
        help_text='Contact address'
    )
    
    # Feature flags
    allow_spectator_uploads = models.BooleanField(
        default=True,
        help_text='Allow spectators to upload media'
    )
    require_email_verification = models.BooleanField(
        default=True,
        help_text='Require email verification for new accounts'
    )
    allow_public_registration = models.BooleanField(
        default=True,
        help_text='Allow public registration for events'
    )
    
    # Maintenance mode
    maintenance_mode = models.BooleanField(
        default=False,
        help_text='Enable maintenance mode (blocks non-admin access)'
    )
    maintenance_banner = models.TextField(
        blank=True,
        help_text='Maintenance message displayed to users'
    )
    
    # Social media
    facebook_url = models.URLField(
        blank=True,
        help_text='Facebook page URL'
    )
    twitter_url = models.URLField(
        blank=True,
        help_text='Twitter profile URL'
    )
    instagram_url = models.URLField(
        blank=True,
        help_text='Instagram profile URL'
    )
    linkedin_url = models.URLField(
        blank=True,
        help_text='LinkedIn page URL'
    )
    
    # Analytics
    google_analytics_id = models.CharField(
        max_length=20,
        blank=True,
        help_text='Google Analytics tracking ID'
    )
    google_tag_manager_id = models.CharField(
        max_length=20,
        blank=True,
        help_text='Google Tag Manager container ID'
    )
    
    # Email settings
    from_email = models.EmailField(
        default='noreply@timelyevents.com',
        help_text='Default from email address'
    )
    email_signature = models.TextField(
        blank=True,
        help_text='Email signature for automated emails'
    )
    
    # File upload limits
    max_file_size_mb = models.PositiveIntegerField(
        default=10,
        help_text='Maximum file upload size in MB'
    )
    allowed_file_types = models.CharField(
        max_length=500,
        default='jpg,jpeg,png,gif,pdf,doc,docx',
        help_text='Comma-separated list of allowed file extensions'
    )
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_settings'
    )
    
    class Meta:
        verbose_name = 'Site Setting'
        verbose_name_plural = 'Site Settings'
    
    def __str__(self):
        return f'Site Settings ({self.site_name})'
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and SiteSetting.objects.exists():
            raise ValueError('Only one SiteSetting instance is allowed')
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Get the singleton settings instance"""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings
    
    @property
    def allowed_file_types_list(self):
        """Get allowed file types as a list"""
        return [ext.strip().lower() for ext in self.allowed_file_types.split(',')]
    
    @property
    def max_file_size_bytes(self):
        """Get max file size in bytes"""
        return self.max_file_size_mb * 1024 * 1024
    
    def is_maintenance_mode(self):
        """Check if maintenance mode is active"""
        return self.maintenance_mode
    
    def get_maintenance_message(self):
        """Get maintenance message or default"""
        return self.maintenance_banner or 'The site is currently under maintenance. Please check back later.'


class FeatureFlag(models.Model):
    """
    Feature flags for enabling/disabling features
    """
    
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text='Feature flag name (e.g., "enable_payments")'
    )
    description = models.TextField(
        blank=True,
        help_text='Description of what this feature flag controls'
    )
    enabled = models.BooleanField(
        default=False,
        help_text='Whether this feature is enabled'
    )
    enabled_for_all = models.BooleanField(
        default=False,
        help_text='Enable for all users (overrides user-specific settings)'
    )
    
    # Targeting
    enabled_for_roles = models.JSONField(
        default=list,
        blank=True,
        help_text='List of roles this feature is enabled for'
    )
    enabled_for_users = models.ManyToManyField(
        'accounts.User',
        blank=True,
        help_text='Specific users this feature is enabled for'
    )
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_feature_flags'
    )
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f'{self.name} ({"enabled" if self.enabled else "disabled"})'
    
    def is_enabled_for_user(self, user):
        """Check if feature is enabled for a specific user"""
        if not self.enabled:
            return False
        
        if self.enabled_for_all:
            return True
        
        # Check role-based access
        if hasattr(user, 'role') and user.role in self.enabled_for_roles:
            return True
        
        # Check user-specific access
        if self.enabled_for_users.filter(id=user.id).exists():
            return True
        
        return False
