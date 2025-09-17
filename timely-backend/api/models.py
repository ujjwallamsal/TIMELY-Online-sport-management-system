# api/models.py - API Models
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

User = get_user_model()


class AuditLog(models.Model):
    """Audit log for tracking admin-sensitive actions"""
    
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('publish', 'Publish'),
        ('unpublish', 'Unpublish'),
        ('approve', 'Approve'),
        ('reject', 'Reject'),
        ('cancel', 'Cancel'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('role_change', 'Role Change'),
        ('permission_change', 'Permission Change'),
        ('data_export', 'Data Export'),
        ('data_deletion', 'Data Deletion'),
    ]
    
    actor = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='api_audit_actions',
        help_text="User who performed the action"
    )
    action = models.CharField(
        max_length=50, 
        choices=ACTION_CHOICES,
        help_text="Type of action performed"
    )
    target_type = models.ForeignKey(
        ContentType, 
        on_delete=models.CASCADE,
        null=True, 
        blank=True,
        help_text="Type of object that was acted upon"
    )
    target_id = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="ID of object that was acted upon"
    )
    target = GenericForeignKey('target_type', 'target_id')
    target_description = models.CharField(
        max_length=255, 
        blank=True,
        help_text="Human-readable description of the target"
    )
    details = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Additional details about the action"
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
        help_text="When the action occurred"
    )
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['actor', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['target_type', 'target_id']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.actor.email} {self.action} {self.target_description} at {self.timestamp}"
    
    @classmethod
    def log_action(cls, actor, action, target=None, target_description="", details=None, request=None):
        """Log an action to the audit log"""
        log_entry = cls(
            actor=actor,
            action=action,
            target_description=target_description,
            details=details or {}
        )
        
        if target:
            log_entry.target = target
            log_entry.target_type = ContentType.objects.get_for_model(target)
            log_entry.target_id = target.pk
        
        if request:
            log_entry.ip_address = cls._get_client_ip(request)
            log_entry.user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        log_entry.save()
        return log_entry
    
    @staticmethod
    def _get_client_ip(request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class APIMetrics(models.Model):
    """API usage metrics for monitoring"""
    
    endpoint = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    response_time_ms = models.PositiveIntegerField()
    status_code = models.PositiveIntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['endpoint', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['status_code', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.method} {self.endpoint} - {self.status_code} ({self.response_time_ms}ms)"


class RateLimit(models.Model):
    """Rate limiting configuration"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    endpoint = models.CharField(max_length=255)
    request_count = models.PositiveIntegerField(default=0)
    window_start = models.DateTimeField()
    blocked_until = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = [['user', 'endpoint', 'window_start'], ['ip_address', 'endpoint', 'window_start']]
        indexes = [
            models.Index(fields=['user', 'endpoint', 'window_start']),
            models.Index(fields=['ip_address', 'endpoint', 'window_start']),
        ]
    
    def __str__(self):
        identifier = self.user.email if self.user else self.ip_address
        return f"{identifier} - {self.endpoint} ({self.request_count} requests)"