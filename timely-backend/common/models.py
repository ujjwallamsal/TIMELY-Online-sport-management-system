# common/models.py
from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from accounts.models import User


class AuditLog(models.Model):
    """Audit log for tracking admin changes and important actions"""
    
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('APPROVE', 'Approve'),
        ('REJECT', 'Reject'),
        ('CANCEL', 'Cancel'),
        ('LOCK', 'Lock'),
        ('UNLOCK', 'Unlock'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('PASSWORD_CHANGE', 'Password Change'),
        ('ROLE_CHANGE', 'Role Change'),
        ('BULK_ACTION', 'Bulk Action'),
    ]
    
    actor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='audit_actions',
        help_text="User who performed the action"
    )
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        help_text="Type of action performed"
    )
    target_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='common_audit_logs',
        help_text="Type of object that was acted upon"
    )
    target_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="ID of the object that was acted upon"
    )
    target = GenericForeignKey('target_type', 'target_id')
    target_description = models.CharField(
        max_length=255,
        blank=True,
        help_text="Human-readable description of the target object"
    )
    details = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional details about the action (changes, metadata, etc.)"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of the actor"
    )
    user_agent = models.TextField(
        blank=True,
        help_text="User agent string"
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text="When the action was performed"
    )
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['actor', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['target_type', 'target_id']),
            models.Index(fields=['timestamp']),
        ]
        verbose_name = "Audit Log Entry"
        verbose_name_plural = "Audit Log Entries"
    
    def __str__(self):
        return f"{self.actor.email} {self.action} {self.target_description} at {self.timestamp}"
    
    @classmethod
    def log_action(cls, actor, action, target=None, target_description="", details=None, request=None):
        """Helper method to log an action"""
        if details is None:
            details = {}
        
        ip_address = None
        user_agent = ""
        if request:
            ip_address = cls._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]  # Limit length
        
        return cls.objects.create(
            actor=actor,
            action=action,
            target=target,
            target_description=target_description,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def _get_client_ip(request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SystemSettings(models.Model):
    """System-wide settings and configuration"""
    
    key = models.CharField(
        max_length=100,
        unique=True,
        help_text="Setting key"
    )
    value = models.JSONField(
        help_text="Setting value (can be any JSON-serializable type)"
    )
    description = models.TextField(
        blank=True,
        help_text="Description of what this setting does"
    )
    is_public = models.BooleanField(
        default=False,
        help_text="Whether this setting can be accessed by non-admin users"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "System Setting"
        verbose_name_plural = "System Settings"
    
    def __str__(self):
        return f"{self.key}: {self.value}"
    
    @classmethod
    def get_setting(cls, key, default=None):
        """Get a setting value by key"""
        try:
            setting = cls.objects.get(key=key)
            return setting.value
        except cls.DoesNotExist:
            return default
    
    @classmethod
    def set_setting(cls, key, value, description="", is_public=False):
        """Set a setting value by key"""
        setting, created = cls.objects.get_or_create(
            key=key,
            defaults={
                'value': value,
                'description': description,
                'is_public': is_public
            }
        )
        if not created:
            setting.value = value
            setting.description = description
            setting.is_public = is_public
            setting.save()
        return setting
