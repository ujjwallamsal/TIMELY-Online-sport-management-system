# api/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone


class Sport(models.Model):
    """Sport model for the lean MVP"""
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return self.name


class Team(models.Model):
    """Team model for the lean MVP"""
    name = models.CharField(max_length=100)
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='managed_teams'
    )
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='teams'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        unique_together = [['name', 'event']]
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['manager']),
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.event.name})"


class TeamMember(models.Model):
    """Team member model for the lean MVP"""
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    athlete = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='team_memberships'
    )
    jersey_no = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['jersey_no']
        unique_together = [['team', 'athlete']]
        indexes = [
            models.Index(fields=['team']),
            models.Index(fields=['athlete']),
            models.Index(fields=['jersey_no']),
        ]
    
    def __str__(self):
        return f"{self.athlete.full_name} (#{self.jersey_no}) - {self.team.name}"


class Announcement(models.Model):
    """Announcement model for the lean MVP"""
    
    class Audience(models.TextChoices):
        ALL = "ALL", "All"
        PARTICIPANTS = "PARTICIPANTS", "Participants"
        OFFICIALS = "OFFICIALS", "Officials"
    
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='announcements'
    )
    subject = models.CharField(max_length=200)
    body = models.TextField()
    audience = models.CharField(
        max_length=20,
        choices=Audience.choices,
        default=Audience.ALL
    )
    sent_at = models.DateTimeField(auto_now_add=True)
    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_announcements'
    )
    
    class Meta:
        ordering = ['-sent_at']
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['sent_at']),
            models.Index(fields=['audience']),
            models.Index(fields=['sent_by']),
        ]
    
    def __str__(self):
        return f"{self.subject} - {self.event.name}"
