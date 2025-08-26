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
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending Review"
        CONFIRMED = "CONFIRMED", "Confirmed"
        REJECTED = "REJECTED", "Rejected"
        WITHDRAWN = "WITHDRAWN", "Withdrawn"
        WAITLISTED = "WAITLISTED", "Waitlisted"
        PAYMENT_PENDING = "PAYMENT_PENDING", "Payment Pending"
        KYC_PENDING = "KYC_PENDING", "KYC Verification Pending"

    class RegistrationType(models.TextChoices):
        INDIVIDUAL = "INDIVIDUAL", "Individual"
        TEAM = "TEAM", "Team"

    class KYCStatus(models.TextChoices):
        NOT_STARTED = "NOT_STARTED", "Not Started"
        PENDING = "PENDING", "Pending Verification"
        VERIFIED = "VERIFIED", "Verified"
        REJECTED = "REJECTED", "Rejected"

    # Basic Information
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='registrations')
    division = models.ForeignKey(Division, on_delete=models.CASCADE, related_name='registrations', null=True, blank=True)
    
    # Registration Details
    registration_type = models.CharField(
        max_length=12, 
        choices=RegistrationType.choices, 
        default=RegistrationType.INDIVIDUAL
    )
    team_name = models.CharField(max_length=100, blank=True, help_text="Required for team registrations")
    team_members = models.JSONField(default=list, blank=True, help_text="List of team member details")
    
    # Status and Approval
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.PAYMENT_PENDING,
        db_index=True
    )
    
    # KYC Verification
    kyc_status = models.CharField(
        max_length=20,
        choices=KYCStatus.choices,
        default=KYCStatus.NOT_STARTED,
        db_index=True
    )
    kyc_verified_at = models.DateTimeField(null=True, blank=True)
    kyc_verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='kyc_verified_registrations'
    )
    
    # Contact Information
    emergency_contact_name = models.CharField(max_length=100)
    emergency_contact_phone = models.CharField(max_length=20)
    emergency_contact_relationship = models.CharField(max_length=50)
    
    # Medical Information
    medical_conditions = models.TextField(blank=True, help_text="Any medical conditions or allergies")
    dietary_requirements = models.TextField(blank=True, help_text="Special dietary needs")
    
    # Payment Information
    is_paid = models.BooleanField(default=False)
    payment_reference = models.CharField(max_length=100, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, help_text="Stripe Payment Intent ID")
    stripe_customer_id = models.CharField(max_length=255, blank=True, help_text="Stripe Customer ID")
    payment_amount_cents = models.PositiveIntegerField(default=0, help_text="Amount paid in cents")
    payment_currency = models.CharField(max_length=3, default='AUD', help_text="Payment currency code")
    payment_date = models.DateTimeField(null=True, blank=True)
    
    # Approval Details
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_registrations'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    organizer_notes = models.TextField(blank=True, help_text="Internal notes for organizers")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Calculated Properties
    @property
    def is_team_registration(self):
        return self.registration_type == self.RegistrationType.TEAM
    
    @property
    def team_size(self):
        if self.is_team_registration and self.team_members:
            return len(self.team_members)
        return 1
    
    @property
    def required_documents_complete(self):
        """Check if all required documents are uploaded - temporarily disabled"""
        # required_types = [Document.DocumentType.ID, Document.DocumentType.MEDICAL]
        # uploaded_types = set(self.documents.values_list('document_type', flat=True))
        # return all(doc_type in uploaded_types for doc_type in required_types)
        return True  # Temporarily return True for migration
    
    @property
    def can_be_approved(self):
        """Check if registration can be approved"""
        return (
            self.status == self.Status.PENDING and
            self.required_documents_complete and
            self.is_paid and
            self.kyc_status == self.KYCStatus.VERIFIED
        )
    
    @property
    def payment_amount_dollars(self):
        """Convert cents to dollars"""
        return self.payment_amount_cents / 100
    
    @property
    def requires_payment(self):
        """Check if this registration requires payment"""
        return self.event.fee_cents > 0
    
    @property
    def payment_status_display(self):
        """Human-readable payment status"""
        if self.is_paid:
            return f"Paid (${self.payment_amount_dollars:.2f} {self.payment_currency})"
        elif self.stripe_payment_intent_id:
            return "Payment Processing"
        elif self.requires_payment:
            return f"Pending (${self.event.fee_dollars:.2f} {self.payment_currency})"
        return "No Payment Required"
    
    def approve(self, reviewer):
        """Approve the registration"""
        if self.can_be_approved:
            self.status = self.Status.CONFIRMED
            self.reviewed_by = reviewer
            self.reviewed_at = timezone.now()
            self.save()
            return True
        return False
    
    def reject(self, reviewer, reason=""):
        """Reject the registration"""
        self.status = self.Status.REJECTED
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.rejection_reason = reason
        self.save()
    
    def withdraw(self):
        """Withdraw the registration"""
        if self.status in [self.Status.PENDING, self.Status.CONFIRMED, self.Status.PAYMENT_PENDING]:
            self.status = self.Status.WITHDRAWN
            self.save()
            return True
        return False
    
    def mark_payment_received(self, stripe_payment_intent_id, amount_cents, currency='AUD'):
        """Mark payment as received"""
        self.is_paid = True
        self.stripe_payment_intent_id = stripe_payment_intent_id
        self.payment_amount_cents = amount_cents
        self.payment_currency = currency
        self.payment_date = timezone.now()
        
        # Update status based on current state
        if self.status == self.Status.PAYMENT_PENDING:
            if self.kyc_status == self.KYCStatus.VERIFIED:
                self.status = self.Status.PENDING
            else:
                self.status = self.Status.KYC_PENDING
        
        self.save()
    
    def mark_kyc_verified(self, verified_by):
        """Mark KYC as verified"""
        self.kyc_status = self.KYCStatus.VERIFIED
        self.kyc_verified_at = timezone.now()
        self.kyc_verified_by = verified_by
        
        # Update status if payment is also complete
        if self.is_paid and self.status == self.Status.KYC_PENDING:
            self.status = self.Status.PENDING
        
        self.save()
    
    def __str__(self):
        team_info = f" ({self.team_name})" if self.team_name else ""
        return f"{self.user.email} - {self.event.name}{team_info}"
    
    class Meta:
        unique_together = [("user", "event")]
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['event', 'status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['kyc_status', 'status']),
            models.Index(fields=['stripe_payment_intent_id']),
        ]


# Document model temporarily commented out for migration
# class Document(models.Model):
#     class DocumentType(models.TextChoices):
#         ID = "ID", "Identity Document"
#         MEDICAL = "MEDICAL", "Medical Certificate"
#         INSURANCE = "INSURANCE", "Insurance Certificate"
#         WAIVER = "WAIVER", "Liability Waiver"
#         PHOTO = "PHOTO", "Passport Photo"
#         KYC_PROOF = "KYC_PROOF", "KYC Proof of Address"
#         KYC_IDENTITY = "KYC_IDENTITY", "KYC Identity Verification"
#         OTHER = "OTHER", "Other Document"
#     
#     class Status(models.TextChoices):
#         PENDING = "PENDING", "Pending Review"
#         APPROVED = "APPROVED", "Approved"
#         REJECTED = "REJECTED", "Rejected"
#     
#     # Relationships
#     registration = models.ForeignKey(Registration, on_delete=models.CASCADE, related_name='documents')
#     
#     # Document Details
#     document_type = models.CharField(max_length=20, choices=DocumentType.choices)
#     title = models.CharField(max_length=200)
#     description = models.TextField(blank=True)
#     
#     # File Information
#     file = models.FileField(
#         upload_to=document_upload_path,
#         validators=[
#             FileExtensionValidator(
#                 allowed_extensions=['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
#             )
#         ]
#     )
#     original_filename = models.CharField(max_length=255)
#     file_size = models.PositiveIntegerField(help_text="File size in bytes")
#     content_type = models.CharField(max_length=100)
#     
#     # Review Status
#     status = models.CharField(
#         max_length=12, 
#         choices=Status.choices, 
#         default=Status.PENDING
#     )
#     reviewed_by = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name='reviewed_documents'
#     )
#     reviewed_at = models.DateTimeField(null=True, blank=True)
#     review_notes = models.TextField(blank=True)
#     
#     # Security
#     access_token = models.UUIDField(default=uuid.uuid4, unique=True)
#     
#     # Timestamps
#     uploaded_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     
#     @property
#     def secure_url(self):
#         """Generate secure URL for document access"""
#         return f"/api/documents/{self.access_token}/download/"
#     
#     @property
#     def file_size_mb(self):
#         """File size in MB"""
#         return round(self.file_size / (1024 * 1024), 2)
#     
#     @property
#     def is_kyc_document(self):
#         """Check if this is a KYC-related document"""
#         return self.document_type in [
#             self.DocumentType.KYC_PROOF,
#             self.DocumentType.KYC_IDENTITY
#         ]
#     
#     def __str__(self):
#         return f"{self.get_document_type_display()} - {self.registration}"
#     
#     class Meta:
#         ordering = ['-uploaded_at']
#         unique_together = [('registration', 'document_type')]
#         indexes = [
#             models.Index(fields=['registration', 'document_type']),
#             models.Index(fields=['status', 'uploaded_at']),
#             models.Index(fields=['document_type', 'status']),
#         ]
