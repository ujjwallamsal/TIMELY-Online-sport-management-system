# events/announcements.py
"""
Announcement system for real-time event updates.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


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
        'Event',
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
        User,
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
