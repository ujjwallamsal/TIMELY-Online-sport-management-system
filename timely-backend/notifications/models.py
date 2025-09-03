from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class Notification(models.Model):
    """Notification model with SRS-compliant schema"""
    
    KIND_CHOICES = [
        ('info', 'Info'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('announcement', 'Announcement'),
    ]
    
    TOPIC_CHOICES = [
        ('registration', 'Registration'),
        ('schedule', 'Schedule'),
        ('results', 'Results'),
        ('ticket', 'Ticket'),
        ('payment', 'Payment'),
        ('system', 'System'),
        ('message', 'Message'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default='info')
    topic = models.CharField(max_length=20, choices=TOPIC_CHOICES, default='system')
    title = models.CharField(max_length=200)
    body = models.TextField()
    link_url = models.URLField(blank=True, null=True)
    delivered_email = models.BooleanField(default=False)
    delivered_sms = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'read_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    @property
    def is_read(self):
        return bool(self.read_at)
    
    def mark_read(self):
        if not self.read_at:
            self.read_at = timezone.now()
            self.save(update_fields=['read_at'])


class DeliveryAttempt(models.Model):
    """Track delivery attempts for notifications"""
    
    CHANNEL_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
    ]
    
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='delivery_attempts')
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='queued')
    provider_ref = models.CharField(max_length=100, blank=True, null=True)
    error = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.channel} delivery for {self.notification.title}"


class MessageThread(models.Model):
    """Message thread for internal messaging"""
    
    SCOPE_CHOICES = [
        ('event', 'Event'),
        ('team', 'Team'),
        ('registration', 'Registration'),
        ('direct', 'Direct'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES)
    scope_id = models.CharField(max_length=100, blank=True, null=True)  # UUID/INT for scoping
    title = models.CharField(max_length=200, blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_threads')
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=['scope', 'scope_id']),
        ]
    
    def __str__(self):
        return f"{self.get_scope_display()} thread: {self.title or 'Untitled'}"


class MessageParticipant(models.Model):
    """Participants in message threads"""
    
    ROLE_CHOICES = [
        ('organizer', 'Organizer'),
        ('participant', 'Participant'),
        ('admin', 'Admin'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='thread_participations')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='participant')
    last_read_at = models.DateTimeField(null=True, blank=True)
    joined_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ['thread', 'user']
        ordering = ["-joined_at"]
    
    def __str__(self):
        return f"{self.user.email} in {self.thread}"


class Message(models.Model):
    """Individual messages in threads"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    body = models.TextField(max_length=2000)
    created_at = models.DateTimeField(default=timezone.now)
    edited_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=['thread', 'created_at']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender.email} in {self.thread}"
    
    @property
    def is_deleted(self):
        return bool(self.deleted_at)
    
    def soft_delete(self):
        if not self.deleted_at:
            self.deleted_at = timezone.now()
            self.save(update_fields=['deleted_at'])