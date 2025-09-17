# api/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone


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
