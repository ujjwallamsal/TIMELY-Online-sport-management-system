from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.core.exceptions import ValidationError


class Event(models.Model):
    """Event model for sports events management"""
    
    class LifecycleStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        CANCELLED = "cancelled", "Cancelled"
    
    # Basic Information
    name = models.CharField(max_length=200, help_text="Event name")
    sport = models.CharField(max_length=100, help_text="Sport type")
    description = models.TextField(blank=True, help_text="Event description")
    
    # Dates and Times
    start_datetime = models.DateTimeField(help_text="Event start date and time")
    end_datetime = models.DateTimeField(help_text="Event end date and time")
    registration_open_at = models.DateTimeField(
        null=True, blank=True, 
        help_text="When registration opens"
    )
    registration_close_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When registration closes"
    )
    
    # Location and Capacity
    location = models.CharField(max_length=200, help_text="Event location")
    venue = models.ForeignKey(
        'venues.Venue',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
        help_text="Associated venue (optional)"
    )
    capacity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Maximum participants"
    )
    
    # Financial
    fee_cents = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Registration fee in cents"
    )
    
    # Lifecycle
    lifecycle_status = models.CharField(
        max_length=20,
        choices=LifecycleStatus.choices,
        default=LifecycleStatus.DRAFT,
        db_index=True,
        help_text="Event lifecycle status"
    )
    
    # Audit fields
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_events",
        help_text="User who created this event"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Computed phase property
    @property
    def phase(self) -> str:
        """Compute event phase based on current time and event dates"""
        now = timezone.now()
        
        if self.lifecycle_status == self.LifecycleStatus.CANCELLED:
            return "cancelled"
        
        if now < self.start_datetime:
            return "upcoming"
        elif now >= self.start_datetime and now <= self.end_datetime:
            return "ongoing"
        else:
            return "completed"
    
    def clean(self):
        """Validate event data"""
        super().clean()
        
        # Validate datetime order
        if self.start_datetime and self.end_datetime:
            if self.start_datetime >= self.end_datetime:
                raise ValidationError("End datetime must be after start datetime")
        
        # Validate registration windows
        if self.registration_open_at and self.registration_close_at:
            if self.registration_open_at >= self.registration_close_at:
                raise ValidationError("Registration close must be after registration open")
            
            # Registration should close before event starts (not after event ends)
            if self.start_datetime and self.end_datetime:
                if self.registration_close_at > self.start_datetime:
                    raise ValidationError("Registration must close before event starts")
    
    def save(self, *args, **kwargs):
        """Save with validation"""
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} ({self.sport})"
    
    class Meta:
        ordering = ['start_datetime', 'created_at']
        indexes = [
            models.Index(fields=['start_datetime']),
            models.Index(fields=['lifecycle_status']),
            models.Index(fields=['lifecycle_status', 'start_datetime']),
        ]


class Division(models.Model):
    """Event divisions/categories"""
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="divisions",
        help_text="Parent event"
    )
    name = models.CharField(max_length=100, help_text="Division name")
    sort_order = models.PositiveIntegerField(
        default=0,
        help_text="Sort order for display"
    )
    
    def clean(self):
        """Validate division data"""
        super().clean()
        
        # Check for duplicate names within the same event
        if self.event_id:
            existing = Division.objects.filter(
                event=self.event,
                name=self.name
            ).exclude(pk=self.pk)
            if existing.exists():
                raise ValidationError(f"Division '{self.name}' already exists for this event")
    
    def save(self, *args, **kwargs):
        """Save with validation"""
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.event.name} - {self.name}"
    
    class Meta:
        ordering = ['sort_order', 'name']
        unique_together = [['event', 'name']]
        indexes = [
            models.Index(fields=['event', 'sort_order']),
        ]


