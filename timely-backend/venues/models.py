# venues/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
import json

User = get_user_model()


class Venue(models.Model):
    """Venue model for event locations"""
    
    name = models.CharField(max_length=200, unique=True, help_text="Unique venue name")
    address = models.TextField(help_text="Full venue address")
    capacity = models.IntegerField(null=True, blank=True, help_text="Maximum capacity (leave blank if unknown; 0 for unlimited)")
    facilities = models.JSONField(null=True, blank=True, help_text="Available facilities (JSON)")
    timezone = models.CharField(max_length=50, default='UTC', help_text="Venue timezone")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_venues", help_text="User who created this venue")
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['capacity']),
            models.Index(fields=['created_by']),
        ]

    def __str__(self):
        return self.name

    def clean(self):
        """Validate venue data"""
        if self.capacity is not None:
            if self.capacity < 0:
                raise ValidationError({'capacity': 'Capacity must be non-negative'})
        
        if self.facilities:
            try:
                if isinstance(self.facilities, str):
                    json.loads(self.facilities)
            except (json.JSONDecodeError, TypeError):
                raise ValidationError({'facilities': 'Facilities must be valid JSON'})

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class VenueSlot(models.Model):
    """Time slot for venue availability"""
    
    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        BLOCKED = "blocked", "Blocked"

    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name="slots", help_text="Venue this slot belongs to")
    starts_at = models.DateTimeField(help_text="Slot start time")
    ends_at = models.DateTimeField(help_text="Slot end time")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE, help_text="Slot availability status")
    reason = models.TextField(null=True, blank=True, help_text="Reason for blocking (if applicable)")
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['venue', 'starts_at']
        indexes = [
            models.Index(fields=['venue', 'starts_at']),
            models.Index(fields=['venue', 'status']),
            models.Index(fields=['starts_at', 'ends_at']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(ends_at__gt=models.F('starts_at')),
                name='venue_slot_ends_after_starts'
            ),
        ]

    def __str__(self):
        return f"{self.venue.name} - {self.starts_at} to {self.ends_at} ({self.status})"

    def clean(self):
        """Validate slot data"""
        if self.starts_at is None:
            raise ValidationError({'starts_at': 'Start time is required'})
        
        if self.ends_at is None:
            raise ValidationError({'ends_at': 'End time is required'})
        
        if self.ends_at <= self.starts_at:
            raise ValidationError({'ends_at': 'End time must be after start time'})
        
        if self.status == self.Status.BLOCKED and not self.reason:
            raise ValidationError({'reason': 'Blocked slots must have a reason'})

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    @property
    def duration_minutes(self):
        """Get slot duration in minutes"""
        if self.starts_at and self.ends_at:
            delta = self.ends_at - self.starts_at
            return int(delta.total_seconds() / 60)
        return 0

    def overlaps_with(self, other_slot):
        """Check if this slot overlaps with another slot"""
        return (self.starts_at < other_slot.ends_at and 
                self.ends_at > other_slot.starts_at)