from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from venues.models import Venue

class Division(models.Model):
    """Event divisions/categories (e.g., U18, Open, Masters)"""
    name = models.CharField(max_length=80, unique=True)
    description = models.TextField(blank=True)
    min_age = models.PositiveIntegerField(null=True, blank=True)
    max_age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(
        max_length=20,
        choices=[
            ('MALE', 'Male'),
            ('FEMALE', 'Female'),
            ('MIXED', 'Mixed'),
            ('OPEN', 'Open')
        ],
        default='OPEN'
    )
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']

class Event(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PUBLISHED = "PUBLISHED", "Published"
        UPCOMING = "UPCOMING", "Upcoming"
        ONGOING = "ONGOING", "Ongoing"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    # Basic Information
    name = models.CharField(max_length=140)
    sport_type = models.CharField(max_length=80)
    description = models.TextField(blank=True)
    
    # Dates and Times
    start_date = models.DateField(db_index=True)
    end_date = models.DateField(db_index=True)
    registration_open = models.DateTimeField(null=True, blank=True)
    registration_close = models.DateTimeField(null=True, blank=True)
    
    # Venue and Capacity
    venue = models.ForeignKey(Venue, on_delete=models.PROTECT, related_name="events")
    capacity = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10000)],
        default=100
    )
    
    # Financial
    fee_cents = models.PositiveIntegerField(default=0, help_text="Fee in cents")
    
    # Status and Metadata
    status = models.CharField(
        max_length=12, 
        choices=Status.choices, 
        default=Status.DRAFT,
        db_index=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="created_events"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional Information
    divisions = models.ManyToManyField(Division, blank=True, related_name="events")
    eligibility_notes = models.TextField(blank=True)
    rules_and_regulations = models.TextField(blank=True)
    
    # Calculated fields
    @property
    def fee_dollars(self):
        return self.fee_cents / 100
    
    @property
    def is_registration_open(self):
        now = timezone.now()
        if not self.registration_open or not self.registration_close:
            return False
        return self.registration_open <= now <= self.registration_close
    
    @property
    def is_published(self):
        return self.status == self.Status.PUBLISHED
    
    @property
    def is_draft(self):
        return self.status == self.Status.DRAFT
    
    @property
    def days_until_start(self):
        return (self.start_date - timezone.now().date()).days
    
    def clean(self):
        from django.core.exceptions import ValidationError
        
        # Validate dates
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError("End date must be after start date")
        
        if self.registration_close and self.start_date and self.registration_close.date() > self.start_date:
            raise ValidationError("Registration must close before event starts")
        
        # Validate capacity
        if self.capacity and self.capacity < 1:
            raise ValidationError("Capacity must be at least 1")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} ({self.sport_type}) - {self.get_status_display()}"
    
    class Meta:
        ordering = ['-start_date', '-created_at']
        indexes = [
            models.Index(fields=['start_date', 'status']),
            models.Index(fields=['status', 'start_date']),
            models.Index(fields=['sport_type', 'status']),
            models.Index(fields=['venue', 'start_date']),
        ]
