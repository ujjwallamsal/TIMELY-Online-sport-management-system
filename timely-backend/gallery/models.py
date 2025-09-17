from django.db import models
from django.conf import settings

# from events.models import Event
# from fixtures.models import Fixture

class Album(models.Model):
    """
    Logical grouping of media for an Event (optionally a specific Match).
    """
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name="albums")
    fixture = models.ForeignKey('fixtures.Fixture', on_delete=models.SET_NULL, related_name="albums",
                                null=True, blank=True)
    title = models.CharField(max_length=140)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                   related_name="created_albums")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.event.name})"


def media_upload_path(instance: "MediaAsset", filename: str) -> str:
    # /media/events/<event_id>/<album_id>/<filename>
    event_id = instance.album.event_id if instance.album_id else "misc"
    album_id = instance.album_id or "misc"
    return f"events/{event_id}/albums/{album_id}/{filename}"


class MediaAsset(models.Model):
    """
    Photo or video linked to an Event/Match.
    """
    PHOTO = "PHOTO"
    VIDEO = "VIDEO"
    KIND_CHOICES = [(PHOTO, "Photo"), (VIDEO, "Video")]

    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name="assets")
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default=PHOTO)

    # Either upload a file or store an external URL (for videos hosted elsewhere).
    file = models.FileField(upload_to=media_upload_path, blank=True, null=True)
    external_url = models.URLField(blank=True)

    caption = models.CharField(max_length=200, blank=True)
    is_public = models.BooleanField(default=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                    related_name="uploaded_media")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self) -> str:
        return self.caption or f"{self.kind} in {self.album}"


class Media(models.Model):
    """Media files linked to events/fixtures with moderation workflow"""
    
    class MediaType(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"
        DOCUMENT = "document", "Document"
        AUDIO = "audio", "Audio"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    def media_upload_path(instance, filename):
        """Generate upload path for media files"""
        event_id = instance.event_id if instance.event_id else "misc"
        fixture_id = instance.fixture_id if instance.fixture_id else "general"
        return f"media/events/{event_id}/fixtures/{fixture_id}/{filename}"

    # Core fields
    file = models.FileField(upload_to=media_upload_path, help_text="Media file")
    type = models.CharField(max_length=20, choices=MediaType.choices, help_text="Type of media")
    
    # Relationships
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name="media", help_text="Associated event")
    fixture = models.ForeignKey('fixtures.Fixture', on_delete=models.SET_NULL, null=True, blank=True, 
                               related_name="media", help_text="Associated fixture (optional)")
    
    # Moderation
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, 
                             help_text="Moderation status")
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                                   null=True, blank=True, related_name="uploaded_media_files",
                                   help_text="User who uploaded the media")
    
    # Metadata
    title = models.CharField(max_length=255, blank=True, help_text="Media title")
    description = models.TextField(blank=True, help_text="Media description")
    file_size = models.PositiveIntegerField(null=True, blank=True, help_text="File size in bytes")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True, help_text="When media was approved")

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event', 'status']),
            models.Index(fields=['fixture', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['uploaded_by', 'created_at']),
        ]

    def __str__(self):
        return f"{self.type} - {self.title or self.file.name} ({self.status})"

    def save(self, *args, **kwargs):
        # Set file size if not already set
        if self.file and not self.file_size:
            try:
                self.file_size = self.file.size
            except (OSError, ValueError):
                pass
        
        # Set approved_at when status changes to APPROVED
        if self.status == self.Status.APPROVED and not self.approved_at:
            from django.utils import timezone
            self.approved_at = timezone.now()
        
        super().save(*args, **kwargs)

    @property
    def is_public(self):
        """Check if media is approved and can be shown publicly"""
        return self.status == self.Status.APPROVED

    @property
    def file_url(self):
        """Get the URL for the media file"""
        if self.file:
            return self.file.url
        return None
