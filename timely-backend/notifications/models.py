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


class NotificationUnread(models.Model):
    """Track unread notification counts per user for efficient counting"""
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_unread'
    )
    count = models.PositiveIntegerField(default=0, help_text="Number of unread notifications")
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Notification Unread Count'
        verbose_name_plural = 'Notification Unread Counts'
        indexes = [
            models.Index(fields=['user', 'count']),
        ]
    
    def __str__(self):
        return f"{self.user.email}: {self.count} unread"
    
    @classmethod
    def get_or_create_for_user(cls, user):
        """Get or create unread count for user"""
        unread, created = cls.objects.get_or_create(user=user)
        return unread
    
    @classmethod
    def update_count_for_user(cls, user):
        """Update unread count for a user based on actual notifications"""
        count = Notification.objects.filter(
            user=user,
            read_at__isnull=True
        ).count()
        
        unread, _ = cls.objects.get_or_create(user=user)
        unread.count = count
        unread.save(update_fields=['count', 'last_updated'])
        return unread
    
    @classmethod
    def increment_for_user(cls, user):
        """Increment unread count for user"""
        unread, created = cls.get_or_create_for_user(user)
        if not created:  # Don't increment if just created (count is already accurate)
            unread.count += 1
            unread.save(update_fields=['count', 'last_updated'])
        return unread
    
    @classmethod
    def decrement_for_user(cls, user):
        """Decrement unread count for user"""
        unread, created = cls.get_or_create_for_user(user)
        if not created and unread.count > 0:
            unread.count -= 1
            unread.save(update_fields=['count', 'last_updated'])
        return unread


class NotificationTemplate(models.Model):
    """Templates for different types of notifications"""
    
    TEMPLATE_TYPE_CHOICES = [
        ('role_approval', 'Role Approval'),
        ('role_rejection', 'Role Rejection'),
        ('event_reminder', 'Event Reminder'),
        ('registration_confirmed', 'Registration Confirmed'),
        ('payment_success', 'Payment Success'),
        ('payment_failed', 'Payment Failed'),
        ('fixture_updated', 'Fixture Updated'),
        ('result_published', 'Result Published'),
        ('system_maintenance', 'System Maintenance'),
        ('announcement', 'Announcement'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    template_type = models.CharField(max_length=50, choices=TEMPLATE_TYPE_CHOICES)
    subject_template = models.CharField(max_length=200, help_text="Email subject template")
    body_template = models.TextField(help_text="Notification body template")
    variables = models.JSONField(default=list, help_text="Available template variables")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['template_type', 'is_active']),
        ]
    
    def __str__(self):
        return self.name


class Broadcast(models.Model):
    """System-wide broadcasts to users"""
    
    TARGET_TYPE_CHOICES = [
        ('all', 'All Users'),
        ('role', 'By Role'),
        ('event', 'Event Participants'),
        ('custom', 'Custom Query'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('sending', 'Sending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    target_type = models.CharField(max_length=20, choices=TARGET_TYPE_CHOICES)
    target_criteria = models.JSONField(default=dict, help_text="Criteria for targeting users")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    total_recipients = models.PositiveIntegerField(default=0)
    sent_count = models.PositiveIntegerField(default=0)
    failed_count = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_broadcasts'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'scheduled_at']),
            models.Index(fields=['created_by', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"