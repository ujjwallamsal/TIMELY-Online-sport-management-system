"""
Media Hub models for photo and video management.
Implements FR46-FR50: Media & Gallery functionality.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator
from django.utils import timezone

User = get_user_model()


class MediaItem(models.Model):
    """
    Media item (photo or video) linked to events or fixtures.
    Supports moderation workflow and public gallery display.
    """
    
    class Kind(models.TextChoices):
        PHOTO = 'photo', 'Photo'
        VIDEO = 'video', 'Video'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Review'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        HIDDEN = 'hidden', 'Hidden'
    
    # Core fields
    uploader = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='uploaded_media_items',
        help_text="User who uploaded this media"
    )
    
    # Linking to events/fixtures (at least one should be provided)
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='media_items',
        help_text="Event this media is associated with"
    )
    fixture = models.ForeignKey(
        'fixtures.Fixture',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='media_items',
        help_text="Fixture/match this media is associated with"
    )
    
    # Media type and files
    kind = models.CharField(
        max_length=10,
        choices=Kind.choices,
        help_text="Type of media (photo or video)"
    )
    
    file = models.FileField(
        upload_to='media/%Y/%m/%d/',
        validators=[
            FileExtensionValidator(
                allowed_extensions=['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm']
            )
        ],
        help_text="Media file (images: jpg/png/webp, videos: mp4/webm)"
    )
    
    thumbnail = models.ImageField(
        upload_to='media/thumbnails/%Y/%m/%d/',
        null=True,
        blank=True,
        help_text="Thumbnail for images (auto-generated)"
    )
    
    # Content
    title = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="Optional title for the media"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Optional description"
    )
    
    # Moderation
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        help_text="Moderation status"
    )
    featured = models.BooleanField(
        default=False,
        help_text="Whether this media is featured/pinned"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['event', 'status', '-created_at']),
            models.Index(fields=['fixture', 'status', '-created_at']),
            models.Index(fields=['uploader', 'status']),
            models.Index(fields=['featured', 'status', '-created_at']),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(event__isnull=False) | 
                    models.Q(fixture__isnull=False)
                ),
                name='media_must_link_to_event_or_fixture'
            )
        ]
    
    def __str__(self):
        return f"{self.get_kind_display()} by {self.uploader.email} ({self.get_status_display()})"
    
    @property
    def is_approved(self):
        """Check if media is approved and visible"""
        return self.status == self.Status.APPROVED
    
    @property
    def is_public(self):
        """Check if media is public (approved and not hidden)"""
        return self.status == self.Status.APPROVED and not self.is_hidden
    
    @property
    def is_hidden(self):
        """Check if media is hidden (soft-deleted)"""
        return self.status == self.Status.HIDDEN
    
    def can_edit(self, user):
        """Check if user can edit this media"""
        if not user.is_authenticated:
            return False
        
        # Uploader can edit while pending
        if self.uploader == user and self.status == self.Status.PENDING:
            return True
        
        # Moderators can edit
        return self.can_moderate(user)
    
    def can_moderate(self, user):
        """Check if user can moderate this media"""
        if not user.is_authenticated:
            return False
        
        # Admin can moderate all
        if user.is_staff:
            return True
        
        # Organizer can moderate their events
        if user.role == 'ORGANIZER' and self.event:
            return self.event.created_by == user
        
        return False
    
    def can_delete(self, user):
        """Check if user can delete this media"""
        if not user.is_authenticated:
            return False
        
        # Uploader can delete while pending
        if self.uploader == user and self.status == self.Status.PENDING:
            return True
        
        # Moderators can delete any
        return self.can_moderate(user)
    
    def get_share_url(self):
        """Get canonical share URL for this media"""
        from django.urls import reverse
        return reverse('media-share', kwargs={'pk': self.pk})
    
    def get_share_text(self):
        """Get suggested share text"""
        if self.title:
            return f"Check out this {self.get_kind_display().lower()}: {self.title}"
        return f"Check out this {self.get_kind_display().lower()} from the event!"