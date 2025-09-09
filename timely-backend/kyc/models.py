# kyc/models.py
from django.db import models
from django.utils import timezone
from django.conf import settings
from accounts.models import User


class KycProfile(models.Model):
    """KYC (Know Your Customer) profile for user verification"""
    
    class Status(models.TextChoices):
        UNVERIFIED = "unverified", "Unverified"
        PENDING = "pending", "Pending Review"
        VERIFIED = "verified", "Verified"
        WAIVED = "waived", "Waived"
        REJECTED = "rejected", "Rejected"
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='kyc_profile',
        primary_key=True
    )
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.UNVERIFIED,
        db_index=True
    )
    
    # Personal Information
    full_name = models.CharField(max_length=200, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)
    
    # Document Information
    document_type = models.CharField(max_length=50, blank=True)  # passport, driver_license, national_id
    document_number = models.CharField(max_length=100, blank=True)
    document_issuer = models.CharField(max_length=100, blank=True)
    document_expiry = models.DateField(null=True, blank=True)
    
    # Review Information
    reviewed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_kyc_profiles'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'kyc_profile'
        verbose_name = 'KYC Profile'
        verbose_name_plural = 'KYC Profiles'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['reviewed_at']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"KYC Profile for {self.user.email} - {self.get_status_display()}"
    
    @property
    def is_verified_or_waived(self):
        """Check if KYC is verified or waived"""
        return self.status in [self.Status.VERIFIED, self.Status.WAIVED]
    
    def submit_for_review(self):
        """Submit KYC profile for admin review"""
        self.status = self.Status.PENDING
        self.submitted_at = timezone.now()
        self.save(update_fields=['status', 'submitted_at', 'updated_at'])
    
    def approve(self, reviewer, notes=""):
        """Approve KYC profile"""
        self.status = self.Status.VERIFIED
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.review_notes = notes
        self.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'review_notes', 'updated_at'])
    
    def waive(self, reviewer, notes=""):
        """Waive KYC requirement"""
        self.status = self.Status.WAIVED
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.review_notes = notes
        self.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'review_notes', 'updated_at'])
    
    def reject(self, reviewer, reason=""):
        """Reject KYC profile"""
        self.status = self.Status.REJECTED
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.rejection_reason = reason
        self.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'rejection_reason', 'updated_at'])


class KycDocument(models.Model):
    """KYC document uploads"""
    
    class DocumentType(models.TextChoices):
        ID_FRONT = "id_front", "ID Front"
        ID_BACK = "id_back", "ID Back"
        SELFIE = "selfie", "Selfie"
        PASSPORT = "passport", "Passport"
        DRIVER_LICENSE = "driver_license", "Driver License"
        NATIONAL_ID = "national_id", "National ID"
        PROOF_OF_ADDRESS = "proof_of_address", "Proof of Address"
    
    kyc_profile = models.ForeignKey(
        KycProfile, 
        on_delete=models.CASCADE, 
        related_name='documents'
    )
    document_type = models.CharField(max_length=20, choices=DocumentType.choices)
    file = models.FileField(upload_to='kyc_documents/%Y/%m/%d/')
    file_name = models.CharField(max_length=255, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    mime_type = models.CharField(max_length=100, blank=True)
    
    # Verification status
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='verified_kyc_documents'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'kyc_document'
        verbose_name = 'KYC Document'
        verbose_name_plural = 'KYC Documents'
        indexes = [
            models.Index(fields=['kyc_profile', 'document_type']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_document_type_display()} for {self.kyc_profile.user.email}"
    
    def save(self, *args, **kwargs):
        """Override save to extract file metadata"""
        if self.file and not self.file_name:
            self.file_name = self.file.name
            self.file_size = self.file.size
            self.mime_type = getattr(self.file, 'content_type', '')
        super().save(*args, **kwargs)
    
    def verify(self, verifier, notes=""):
        """Mark document as verified"""
        self.is_verified = True
        self.verified_by = verifier
        self.verified_at = timezone.now()
        self.verification_notes = notes
        self.save(update_fields=['is_verified', 'verified_by', 'verified_at', 'verification_notes', 'updated_at'])