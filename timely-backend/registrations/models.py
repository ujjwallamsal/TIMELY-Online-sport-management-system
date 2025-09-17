import uuid
import os
from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.utils import timezone
from events.models import Event, Division


def document_upload_path(instance, filename):
    """Generate secure upload path for documents"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('documents', str(instance.registration.id), filename)


class Registration(models.Model):
    """Registration model for event participants"""
    
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
    
    class Type(models.TextChoices):
        TEAM = "TEAM", "Team"
        ATHLETE = "ATHLETE", "Athlete"
    
    # Basic Information
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='registrations',
        null=True,
        blank=True
    )
    team = models.ForeignKey(
        'teams.Team',
        on_delete=models.CASCADE,
        related_name='registrations',
        null=True,
        blank=True
    )
    
    # Registration Type and Status
    type = models.CharField(
        max_length=10,
        choices=Type.choices,
        default=Type.ATHLETE
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    
    # Documentation
    docs = models.JSONField(
        default=dict,
        blank=True,
        help_text="Registration documents (JSON)"
    )
    
    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='decided_registrations'
    )
    reason = models.TextField(blank=True, help_text="Reason for rejection or other notes")
    
    class Meta:
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['status']),
            models.Index(fields=['event', 'status']),
            models.Index(fields=['applicant']),
            models.Index(fields=['team']),
            models.Index(fields=['type']),
            models.Index(fields=['submitted_at']),
            models.Index(fields=['status', 'submitted_at']),  # Required index
        ]
    
    def __str__(self):
        if self.type == self.Type.TEAM and self.team:
            return f"{self.team.name} - {self.event.name}"
        elif self.applicant:
            return f"{self.applicant.email} - {self.event.name}"
        return f"Registration - {self.event.name}"
    
    @property
    def applicant_name(self):
        """Get applicant name"""
        if self.type == self.Type.TEAM and self.team:
            return self.team.name
        elif self.applicant:
            return self.applicant.full_name
        return "Unknown"


class RegistrationDocument(models.Model):
    """Document uploaded for registration"""
    
    class DocumentType(models.TextChoices):
        ID_CARD = "id_card", "ID Card"
        MEDICAL_CLEARANCE = "medical_clearance", "Medical Clearance"
        OTHER = "other", "Other"
    
    # Relationships
    registration = models.ForeignKey(Registration, on_delete=models.CASCADE, related_name='documents')
    
    # Document Details
    doc_type = models.CharField(max_length=20, choices=DocumentType.choices)
    file = models.FileField(
        upload_to=document_upload_path,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
            )
        ]
    )
    
    # Review Information
    uploaded_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_documents'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    note = models.TextField(blank=True, help_text="Notes about the document")
    
    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['registration']),
            models.Index(fields=['doc_type']),
        ]
    
    def __str__(self):
        return f"{self.get_doc_type_display()} - {self.registration}"


class RegistrationPaymentLog(models.Model):
    """Payment log for registrations"""
    
    class Provider(models.TextChoices):
        STRIPE = "stripe", "Stripe"
    
    class Kind(models.TextChoices):
        INTENT = "intent", "Payment Intent"
        CONFIRM = "confirm", "Payment Confirmation"
        REFUND = "refund", "Refund"
    
    # Relationships
    registration = models.ForeignKey(Registration, on_delete=models.CASCADE, related_name='payment_logs')
    
    # Payment Details
    provider = models.CharField(max_length=10, choices=Provider.choices)
    provider_ref = models.CharField(max_length=255, help_text="Provider reference (e.g., Stripe payment intent ID)")
    kind = models.CharField(max_length=10, choices=Kind.choices)
    amount_cents = models.PositiveIntegerField()
    status = models.CharField(max_length=20, help_text="Payment status from provider")
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['registration']),
            models.Index(fields=['provider_ref']),
        ]
    
    def __str__(self):
        return f"{self.get_provider_display()} {self.get_kind_display()} - {self.registration}"