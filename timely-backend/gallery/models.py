from django.db import models
from django.conf import settings

from events.models import Event
from fixtures.models import Fixture

class Album(models.Model):
    """
    Logical grouping of media for an Event (optionally a specific Match).
    """
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="albums")
    fixture = models.ForeignKey(Fixture, on_delete=models.SET_NULL, related_name="albums",
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
    class MediaType(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="media")
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    file = models.FileField(upload_to="gallery/")
    media_type = models.CharField(max_length=10, choices=MediaType.choices)
    caption = models.CharField(max_length=255, blank=True)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.media_type} - {self.event.name}"
