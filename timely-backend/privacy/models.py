# privacy/models.py
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class DataExportRequest(models.Model):
    """Model for user data export requests"""
    
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        EXPIRED = "expired", "Expired"
    
    # Core fields
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='data_exports')
    request_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # Status and processing
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    
    # File information
    file_path = models.CharField(max_length=500, blank=True, help_text='Path to exported file')
    file_size = models.PositiveIntegerField(null=True, blank=True, help_text='File size in bytes')
    expires_at = models.DateTimeField(help_text='When the export file expires')
    
    # Processing information
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_exports'
    )
    
    # Error information
    error_message = models.TextField(blank=True, help_text='Error message if processing failed')
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f'Data Export {self.request_id} - {self.user.email} ({self.status})'
    
    def is_expired(self):
        """Check if the export has expired"""
        return timezone.now() > self.expires_at
    
    def can_download(self):
        """Check if the export can be downloaded"""
        return (
            self.status == self.Status.COMPLETED and
            not self.is_expired() and
            bool(self.file_path)
        )


class DataDeletionRequest(models.Model):
    """Model for user data deletion requests"""
    
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
    
    # Core fields
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='deletion_requests')
    request_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # Request details
    reason = models.TextField(help_text='Reason for deletion request')
    confirmation_text = models.CharField(
        max_length=100,
        help_text='User confirmation text (e.g., "DELETE MY DATA")'
    )
    
    # Status and processing
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    
    # Admin review
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_deletions'
    )
    admin_notes = models.TextField(blank=True, help_text='Admin notes about the request')
    
    # Processing information
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_deletions'
    )
    
    # Error information
    error_message = models.TextField(blank=True, help_text='Error message if processing failed')
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f'Deletion Request {self.request_id} - {self.user.email} ({self.status})'
    
    def can_be_approved(self):
        """Check if the request can be approved"""
        return self.status == self.Status.PENDING
    
    def can_be_rejected(self):
        """Check if the request can be rejected"""
        return self.status == self.Status.PENDING


class DataRetentionPolicy(models.Model):
    """Model for data retention policies"""
    
    class DataType(models.TextChoices):
        USER_ACCOUNT = "user_account", "User Account"
        REGISTRATION_DATA = "registration_data", "Registration Data"
        TICKET_DATA = "ticket_data", "Ticket Data"
        PAYMENT_DATA = "payment_data", "Payment Data"
        AUDIT_LOGS = "audit_logs", "Audit Logs"
        MEDIA_UPLOADS = "media_uploads", "Media Uploads"
        NOTIFICATIONS = "notifications", "Notifications"
    
    # Core fields
    data_type = models.CharField(
        max_length=50,
        choices=DataType.choices,
        unique=True,
        help_text='Type of data this policy applies to'
    )
    retention_period_days = models.PositiveIntegerField(
        help_text='Number of days to retain data'
    )
    description = models.TextField(help_text='Description of the retention policy')
    
    # Processing settings
    auto_delete = models.BooleanField(
        default=False,
        help_text='Automatically delete data after retention period'
    )
    anonymize_instead = models.BooleanField(
        default=True,
        help_text='Anonymize data instead of deleting'
    )
    
    # Legal requirements
    legal_basis = models.TextField(help_text='Legal basis for retention')
    compliance_notes = models.TextField(blank=True, help_text='Compliance notes')
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_retention_policies'
    )
    
    class Meta:
        ordering = ['data_type']
        verbose_name = 'Data Retention Policy'
        verbose_name_plural = 'Data Retention Policies'
    
    def __str__(self):
        return f'{self.get_data_type_display()} - {self.retention_period_days} days'
    
    def get_retention_date(self, reference_date=None):
        """Get the date when data should be retained until"""
        if reference_date is None:
            reference_date = timezone.now()
        return reference_date + timezone.timedelta(days=self.retention_period_days)
    
    def is_data_expired(self, data_date, reference_date=None):
        """Check if data is past its retention period"""
        if reference_date is None:
            reference_date = timezone.now()
        retention_date = self.get_retention_date(data_date)
        return reference_date > retention_date
