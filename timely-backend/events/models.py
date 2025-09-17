from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.core.exceptions import ValidationError


class Event(models.Model):
    """Event model for sports events management"""
    
    class Status(models.TextChoices):
        UPCOMING = "UPCOMING", "Upcoming"
        ONGOING = "ONGOING", "Ongoing"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
    
    # Basic Information
    name = models.CharField(max_length=200, help_text="Event name")
    sport = models.ForeignKey(
        'sports.Sport',
        on_delete=models.CASCADE,
        related_name='events',
        help_text="Sport type"
    )
    description = models.TextField(blank=True, help_text="Event description")
    
    # Dates and Times
    start_date = models.DateTimeField(help_text="Event start date and time")
    end_date = models.DateTimeField(help_text="Event end date and time")
    
    # Location and Capacity
    venue = models.ForeignKey(
        'venues.Venue',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
        help_text="Associated venue (optional)"
    )
    
    # Eligibility and Status
    eligibility = models.JSONField(
        default=dict,
        blank=True,
        help_text="Eligibility criteria (JSON)"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UPCOMING,
        db_index=True,
        help_text="Event status"
    )
    visibility = models.CharField(
        max_length=20,
        choices=[
            ('PUBLIC', 'Public'),
            ('PRIVATE', 'Private'),
        ],
        default='PUBLIC',
        db_index=True,
        help_text="Event visibility"
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
        
        if self.status == self.Status.COMPLETED:
            return "completed"
        
        if now < self.start_date:
            return "upcoming"
        elif now >= self.start_date and now <= self.end_date:
            return "ongoing"
        else:
            return "completed"
    
    def clean(self):
        """Validate event data"""
        super().clean()
        
        # Validate datetime order
        if self.start_date and self.end_date:
            if self.start_date >= self.end_date:
                raise ValidationError("End date must be after start date")
    
    def save(self, *args, **kwargs):
        """Save with validation"""
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} ({self.sport.name})"
    
    class Meta:
        ordering = ['start_date', 'created_at']
        indexes = [
            models.Index(fields=['start_date']),
            models.Index(fields=['status']),
            models.Index(fields=['status', 'start_date']),
            models.Index(fields=['sport']),
            models.Index(fields=['venue']),
            models.Index(fields=['created_by']),
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


