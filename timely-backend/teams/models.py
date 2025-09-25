# teams/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError


class Team(models.Model):
    """Team model for the lean MVP"""
    name = models.CharField(max_length=100, help_text="Team name")
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='managed_teams',
        help_text="Team manager"
    )
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='coached_teams',
        help_text="Team coach"
    )
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='teams',
        help_text="Event this team participates in"
    )
    sport = models.CharField(max_length=100, default="General", help_text="Sport type")
    description = models.TextField(blank=True, help_text="Team description")
    is_active = models.BooleanField(default=True, help_text="Whether team is active")
    is_public = models.BooleanField(default=True, help_text="Whether team is public")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        unique_together = [['name', 'event']]
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['manager']),
            models.Index(fields=['coach']),
            models.Index(fields=['name']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = 'Team'
        verbose_name_plural = 'Teams'
    
    def __str__(self):
        return f"{self.name} ({self.event.name})"
    
    def clean(self):
        """Validate team data"""
        super().clean()
        
        # Check for duplicate names within the same event
        if self.event_id and self.name:
            existing = Team.objects.filter(
                event=self.event,
                name=self.name
            ).exclude(pk=self.pk)
            if existing.exists():
                raise ValidationError(f"Team '{self.name}' already exists for this event")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class TeamMember(models.Model):
    """Team member model for the lean MVP"""
    ROLE_CHOICES = (
        ('player', 'Player'),
        ('captain', 'Captain'),
        ('coach', 'Coach'),
        ('manager', 'Manager'),
    )
    team = models.ForeignKey(
        Team, 
        on_delete=models.CASCADE, 
        related_name='members',
        help_text="Team this member belongs to"
    )
    athlete = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='team_memberships',
        help_text="Athlete user"
    )
    jersey_no = models.PositiveIntegerField(
        help_text="Jersey number"
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='player',
        help_text="Role of the team member",
    )
    position = models.CharField(
        max_length=50,
        blank=True,
        help_text="Player position"
    )
    is_captain = models.BooleanField(
        default=False,
        help_text="Whether this member is the team captain"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['jersey_no']
        unique_together = [
            ['team', 'athlete'],  # Athlete can only be in a team once
            ['team', 'jersey_no'],  # Jersey number must be unique within team
        ]
        indexes = [
            models.Index(fields=['team']),
            models.Index(fields=['athlete']),
            models.Index(fields=['jersey_no']),
            models.Index(fields=['is_captain']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = 'Team Member'
        verbose_name_plural = 'Team Members'
    
    def __str__(self):
        return f"{self.athlete.full_name} (#{self.jersey_no}) - {self.team.name}"
    
    def clean(self):
        """Validate team member data"""
        super().clean()
        
        # Check jersey number uniqueness within team
        if self.team_id and self.jersey_no:
            existing = TeamMember.objects.filter(
                team=self.team,
                jersey_no=self.jersey_no
            ).exclude(pk=self.pk)
            if existing.exists():
                raise ValidationError(f"Jersey number {self.jersey_no} is already taken in this team")
        
        # Ensure only one captain per team
        if self.is_captain and self.team_id:
            existing_captain = TeamMember.objects.filter(
                team=self.team,
                is_captain=True
            ).exclude(pk=self.pk)
            if existing_captain.exists():
                raise ValidationError("Team already has a captain")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)