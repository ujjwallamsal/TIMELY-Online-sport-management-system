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
    # Store sport as a simple string (legacy-compatible); API can map ids to names
    sport = models.CharField(
        max_length=100,
        help_text="Sport type"
    )
    description = models.TextField(blank=True, help_text="Event description")
    
    # Dates and Times
    start_datetime = models.DateTimeField(help_text="Event start date and time")
    end_datetime = models.DateTimeField(default=timezone.now, help_text="Event end date and time")
    registration_open_at = models.DateTimeField(null=True, blank=True, help_text="Registration open date")
    registration_close_at = models.DateTimeField(null=True, blank=True, help_text="Registration close date")
    
    # Location and Capacity
    location = models.CharField(max_length=200, blank=True, help_text="Event location")
    capacity = models.PositiveIntegerField(null=True, blank=True, help_text="Maximum capacity")
    fee_cents = models.PositiveIntegerField(default=0, help_text="Registration fee in cents")
    venue = models.ForeignKey(
        'venues.Venue',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
        help_text="Associated venue (optional)"
    )
    
    # Eligibility and Status
    # eligibility = models.JSONField(
    #     default=dict,
    #     blank=True,
    #     help_text="Eligibility criteria (JSON)"
    # )
    requires_approval = models.BooleanField(
        default=False,
        help_text="Whether ticket purchases require approval"
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
        
        # Handle missing datetimes gracefully (during admin add form rendering)
        if not self.start_datetime:
            return "upcoming"
        if not self.end_datetime:
            return "ongoing" if now >= self.start_datetime else "upcoming"

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
                raise ValidationError("End date must be after start date")
    
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
            models.Index(fields=['status']),
            models.Index(fields=['status', 'start_datetime']),
            models.Index(fields=['sport']),
            models.Index(fields=['venue']),
            models.Index(fields=['created_by']),
            models.Index(fields=['visibility', 'status']),  # Required index for public events
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


class Announcement(models.Model):
    """Announcement model for event updates"""
    
    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        NORMAL = "NORMAL", "Normal"
        HIGH = "HIGH", "High"
        URGENT = "URGENT", "Urgent"
    
    class Type(models.TextChoices):
        GENERAL = "GENERAL", "General"
        SCHEDULE = "SCHEDULE", "Schedule Change"
        RESULT = "RESULT", "Result Update"
        WEATHER = "WEATHER", "Weather Alert"
        EMERGENCY = "EMERGENCY", "Emergency"
    
    # Core fields
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='announcements',
        help_text="Event this announcement belongs to"
    )
    title = models.CharField(max_length=200, help_text="Announcement title")
    message = models.TextField(help_text="Announcement message")
    
    # Classification
    type = models.CharField(
        max_length=20,
        choices=Type.choices,
        default=Type.GENERAL,
        help_text="Type of announcement"
    )
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.NORMAL,
        help_text="Announcement priority"
    )
    
    # Visibility and targeting
    is_public = models.BooleanField(
        default=True,
        help_text="Whether announcement is visible to all event participants"
    )
    target_teams = models.ManyToManyField(
        'teams.Team',
        blank=True,
        related_name='announcements',
        help_text="Specific teams to target (empty = all teams)"
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether announcement is currently active"
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When announcement expires (null = never)"
    )
    
    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_announcements',
        help_text="User who created this announcement"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-priority', '-created_at']
        indexes = [
            models.Index(fields=['event', 'is_active']),
            models.Index(fields=['event', 'priority']),
            models.Index(fields=['created_at']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.event.name} - {self.title}"
    
    def clean(self):
        """Validate announcement data"""
        super().clean()
        
        # Check if announcement has expired
        if self.expires_at and self.expires_at <= timezone.now():
            self.is_active = False
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        """Check if announcement has expired"""
        if self.expires_at:
            return self.expires_at <= timezone.now()
        return False
    
    def broadcast(self):
        """Broadcast this announcement to relevant channels"""
        from .realtime_service import realtime_service
        
        announcement_data = {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'priority': self.priority,
            'is_public': self.is_public,
            'created_by': {
                'id': self.created_by.id,
                'name': self.created_by.get_full_name() or self.created_by.username
            },
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }
        
        # Broadcast to event announcements group
        realtime_service.broadcast_announcement(self.event.id, announcement_data)
        
        # If targeting specific teams, also broadcast to team groups
        if self.target_teams.exists():
            for team in self.target_teams.all():
                realtime_service._broadcast_to_group(
                    f'team_{team.id}_announcements',
                    'announcement_update',
                    {
                        'team_id': team.id,
                        'announcement': announcement_data,
                        'timestamp': timezone.now().isoformat()
                    }
                )


