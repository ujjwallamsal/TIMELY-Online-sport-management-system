# content/models.py
from __future__ import annotations
from django.db import models
from django.utils.text import slugify
from django.utils import timezone
from django.core.validators import MinLengthValidator
from accounts.models import User  # If announcements can have authors

class Page(models.Model):
    """
    Static CMS-style pages (About, Terms, etc.) with scheduled publishing and SEO.
    """
    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(3)],
        help_text="Page title"
    )
    slug = models.SlugField(
        max_length=200, 
        unique=True,
        help_text="URL-friendly identifier (e.g., 'about', 'faq')"
    )
    body = models.TextField(
        help_text="Page content in Markdown format"
    )
    published = models.BooleanField(
        default=False,
        help_text="Whether this page is published"
    )
    publish_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Schedule publication for future date/time"
    )
    seo_title = models.CharField(
        max_length=60,
        blank=True,
        help_text="SEO title (defaults to title if empty)"
    )
    seo_description = models.CharField(
        max_length=160,
        blank=True,
        help_text="SEO description (defaults to body excerpt if empty)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['published', 'publish_at']),
            models.Index(fields=['slug']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.slug})"

    def is_published_now(self):
        """Check if page should be visible based on published status and publish_at."""
        if not self.published:
            return False
        if self.publish_at and self.publish_at > timezone.now():
            return False
        return True

    def get_seo_title(self):
        """Return SEO title or fallback to title."""
        return self.seo_title or self.title

    def get_seo_description(self):
        """Return SEO description or fallback to body excerpt."""
        if self.seo_description:
            return self.seo_description
        # Simple excerpt from body (first 150 chars)
        return self.body[:150].strip() + "..." if len(self.body) > 150 else self.body


class News(models.Model):
    """
    News articles and announcements with scheduled publishing and SEO.
    """
    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(3)],
        help_text="News article title"
    )
    body = models.TextField(
        help_text="Article content in Markdown format"
    )
    published = models.BooleanField(
        default=False,
        help_text="Whether this article is published"
    )
    publish_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Schedule publication for future date/time"
    )
    seo_title = models.CharField(
        max_length=60,
        blank=True,
        help_text="SEO title (defaults to title if empty)"
    )
    seo_description = models.CharField(
        max_length=160,
        blank=True,
        help_text="SEO description (defaults to body excerpt if empty)"
    )
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-publish_at', '-created_at']
        indexes = [
            models.Index(fields=['published', 'publish_at']),
        ]

    def __str__(self):
        return f"{self.title} ({'Published' if self.is_published_now() else 'Draft'})"

    def is_published_now(self):
        """Check if article should be visible based on published status and publish_at."""
        if not self.published:
            return False
        if self.publish_at and self.publish_at > timezone.now():
            return False
        return True

    def get_seo_title(self):
        """Return SEO title or fallback to title."""
        return self.seo_title or self.title

    def get_seo_description(self):
        """Return SEO description or fallback to body excerpt."""
        if self.seo_description:
            return self.seo_description
        # Simple excerpt from body (first 150 chars)
        return self.body[:150].strip() + "..." if len(self.body) > 150 else self.body


class Banner(models.Model):
    """Promotional banners with time-based activation."""
    
    title = models.CharField(
        max_length=100,
        help_text="Banner title for admin reference"
    )
    image = models.ImageField(
        upload_to='banners/',
        help_text="Banner image"
    )
    link_url = models.URLField(
        blank=True,
        help_text="Optional link URL when banner is clicked"
    )
    active = models.BooleanField(
        default=True,
        help_text="Whether this banner is active"
    )
    starts_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When to start showing this banner"
    )
    ends_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When to stop showing this banner"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['active', 'starts_at', 'ends_at']),
        ]

    def __str__(self):
        return f"{self.title} ({'Active' if self.is_active_now() else 'Inactive'})"

    def is_active_now(self):
        """Check if banner should be shown based on active status and time window."""
        if not self.active:
            return False
        
        now = timezone.now()
        
        if self.starts_at and self.starts_at > now:
            return False
        
        if self.ends_at and self.ends_at < now:
            return False
        
        return True


# Keep Announcement for backward compatibility, but mark as deprecated
class Announcement(models.Model):
    """
    News / Announcements for events or general updates.
    DEPRECATED: Use News model instead for new content.
    """
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    body = models.TextField(blank=True)
    is_published = models.BooleanField(default=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
