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
        PENDING = "pending", "Pending"
        WAITLISTED = "waitlisted", "Waitlisted"
        CONFIRMED = "confirmed", "Confirmed"
        REJECTED = "rejected", "Rejected"
        WITHDRAWN = "withdrawn", "Withdrawn"
    
    class RegistrationType(models.TextChoices):
        INDIVIDUAL = "individual", "Individual"
        TEAM = "team", "Team"
    
    class PaymentStatus(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
    
    # Basic Information
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='registrations')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    division = models.ForeignKey(Division, on_delete=models.CASCADE, related_name='registrations', null=True, blank=True)
    
    # Registration Type and Team Details
    type = models.CharField(
        max_length=12,
        choices=RegistrationType.choices,
        default=RegistrationType.INDIVIDUAL
    )
    team_name = models.CharField(max_length=100, blank=True, null=True)
    team_manager_name = models.CharField(max_length=100, blank=True, null=True)
    team_contact = models.CharField(max_length=100, blank=True, null=True)
    
    # Status and Payment
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    fee_cents = models.PositiveIntegerField(default=0, help_text="Registration fee in cents")
    payment_status = models.CharField(
        max_length=10,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
        db_index=True
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
        unique_together = [("user", "event")]
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['user', 'event']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_status']),
        ]
    
    def __str__(self):
        team_info = f" ({self.team_name})" if self.team_name else ""
        return f"{self.user.email} - {self.event.name}{team_info}"
    
    @property
    def fee_dollars(self):
        """Convert fee from cents to dollars"""
        return self.fee_cents / 100
    
    @property
    def is_team_registration(self):
        """Check if this is a team registration"""
        return self.type == self.RegistrationType.TEAM


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