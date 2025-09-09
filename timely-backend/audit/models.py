"""
Immutable audit log models for tracking sensitive operations
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone

User = get_user_model()


class AuditLog(models.Model):
    """
    Immutable audit log for tracking sensitive operations
    This model is append-only and does not allow updates or deletes
    """
    
    class ActionType(models.TextChoices):
        # User Management
        USER_CREATE = "USER_CREATE", "User Created"
        USER_UPDATE = "USER_UPDATE", "User Updated"
        USER_DELETE = "USER_DELETE", "User Deleted"
        LOGIN = "LOGIN", "User Login"
        LOGOUT = "LOGOUT", "User Logout"
        PASSWORD_CHANGE = "PASSWORD_CHANGE", "Password Changed"
        EMAIL_VERIFICATION = "EMAIL_VERIFICATION", "Email Verified"
        
        # Role Management
        ROLE_ASSIGNMENT = "ROLE_ASSIGNMENT", "Role Assigned"
        ROLE_REMOVAL = "ROLE_REMOVAL", "Role Removed"
        ROLE_REQUEST_APPROVED = "ROLE_REQUEST_APPROVED", "Role Request Approved"
        ROLE_REQUEST_REJECTED = "ROLE_REQUEST_REJECTED", "Role Request Rejected"
        
        # Registration Management
        REGISTRATION_CREATE = "REGISTRATION_CREATE", "Registration Created"
        REGISTRATION_APPROVE = "REGISTRATION_APPROVE", "Registration Approved"
        REGISTRATION_REJECT = "REGISTRATION_REJECT", "Registration Rejected"
        REGISTRATION_WITHDRAW = "REGISTRATION_WITHDRAW", "Registration Withdrawn"
        
        # Payment Management
        PAYMENT_CREATE = "PAYMENT_CREATE", "Payment Created"
        PAYMENT_SUCCESS = "PAYMENT_SUCCESS", "Payment Successful"
        PAYMENT_FAILED = "PAYMENT_FAILED", "Payment Failed"
        PAYMENT_REFUND = "PAYMENT_REFUND", "Payment Refunded"
        WEBHOOK_RECEIVED = "WEBHOOK_RECEIVED", "Webhook Received"
        
        # KYC Management
        KYC_SUBMIT = "KYC_SUBMIT", "KYC Submitted"
        KYC_APPROVE = "KYC_APPROVE", "KYC Approved"
        KYC_REJECT = "KYC_REJECT", "KYC Rejected"
        
        # Content Moderation
        CONTENT_CREATE = "CONTENT_CREATE", "Content Created"
        CONTENT_APPROVE = "CONTENT_APPROVE", "Content Approved"
        CONTENT_REJECT = "CONTENT_REJECT", "Content Rejected"
        CONTENT_DELETE = "CONTENT_DELETE", "Content Deleted"
        
        # System Operations
        SYSTEM_BACKUP = "SYSTEM_BACKUP", "System Backup"
        SYSTEM_RESTORE = "SYSTEM_RESTORE", "System Restore"
        ADMIN_ACTION = "ADMIN_ACTION", "Admin Action"
    
    # Core fields
    actor_id = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='audit_actions',
        help_text="User who performed the action"
    )
    action = models.CharField(
        max_length=50, 
        choices=ActionType.choices,
        help_text="Type of action performed"
    )
    target_type = models.CharField(
        max_length=100,
        help_text="Type of resource being acted upon"
    )
    target_id = models.CharField(
        max_length=100, 
        blank=True,
        help_text="ID of the target resource"
    )
    
    # Metadata
    meta = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Additional metadata about the action"
    )
    
    # Request context
    ip_address = models.GenericIPAddressField(
        null=True, 
        blank=True,
        help_text="IP address of the request"
    )
    user_agent = models.TextField(
        blank=True,
        help_text="User agent of the request"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        default=timezone.now,
        db_index=True,
        help_text="When the action was performed"
    )
    
    class Meta:
        db_table = 'audit_auditlog'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),  # (created_at DESC)
            models.Index(fields=['action']),      # (action)
            models.Index(fields=['actor_id', 'created_at']),  # (actor_id, created_at)
            models.Index(fields=['target_type', 'target_id']),
        ]
        # Prevent updates and deletes
        permissions = [
            ("can_view_audit", "Can view audit logs"),
            ("can_export_audit", "Can export audit logs"),
        ]
    
    def __str__(self):
        actor = self.actor_id.email if self.actor_id else "System"
        return f"{self.action} by {actor} on {self.target_type}:{self.target_id} at {self.created_at}"
    
    def save(self, *args, **kwargs):
        """Override save to prevent updates of existing records"""
        if self.pk and not kwargs.get('force_insert', False):
            raise ValidationError("AuditLog records are immutable and cannot be updated")
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """Override delete to prevent deletion of audit records"""
        raise ValidationError("AuditLog records are immutable and cannot be deleted")
    
    @classmethod
    def log_action(cls, actor, action, target_type, target_id=None, meta=None, ip_address=None, user_agent=None):
        """
        Create a new audit log entry
        
        Args:
            actor: User who performed the action (can be None for system actions)
            action: ActionType choice
            target_type: Type of resource being acted upon
            target_id: ID of the target resource
            meta: Additional metadata dict
            ip_address: IP address of the request
            user_agent: User agent of the request
        
        Returns:
            AuditLog instance
        """
        return cls.objects.create(
            actor_id=actor,
            action=action,
            target_type=target_type,
            target_id=target_id or '',
            meta=meta or {},
            ip_address=ip_address,
            user_agent=user_agent or ''
        )
    
    @property
    def actor_email(self):
        """Get actor email for display"""
        return self.actor_id.email if self.actor_id else "System"
    
    @property
    def target_display(self):
        """Get target display string"""
        if self.target_id:
            return f"{self.target_type}:{self.target_id}"
        return self.target_type
