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
    
    class Meta:
        verbose_name = 'News'
        verbose_name_plural = 'News'
    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(3)],
        help_text="News article title"
    )
    slug = models.SlugField(
        max_length=200, 
        unique=True,
        help_text="URL-friendly identifier (e.g., 'championship-2024')"
    )
    excerpt = models.TextField(
        max_length=500,
        blank=True,
        help_text="Short excerpt/summary of the article"
    )
    body = models.TextField(
        help_text="Article content in Markdown format"
    )
    image = models.ImageField(
        upload_to='news/',
        blank=True,
        null=True,
        help_text="Featured image for the article"
    )
    is_published = models.BooleanField(
        default=False,
        help_text="Whether this article is published"
    )
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the article was published"
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
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['is_published', 'published_at']),
            models.Index(fields=['slug']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        
        # Set published_at when is_published becomes True
        if self.is_published and not self.published_at:
            self.published_at = timezone.now()
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({'Published' if self.is_published_now() else 'Draft'})"

    def is_published_now(self):
        """Check if article should be visible based on published status and publish_at."""
        if not self.is_published:
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


class FooterLink(models.Model):
    """Footer links management for site navigation"""
    
    class LinkType(models.TextChoices):
        INTERNAL = "internal", "Internal Page"
        EXTERNAL = "external", "External URL"
        EMAIL = "email", "Email Address"
        PHONE = "phone", "Phone Number"
    
    class Section(models.TextChoices):
        HELP = "help", "Help & Support"
        LEGAL = "legal", "Legal & Policies"
        COMPANY = "company", "Company"
        CONTACT = "contact", "Contact"
        SOCIAL = "social", "Social"
    
    title = models.CharField(max_length=100, help_text="Link display text")
    url = models.URLField(blank=True, help_text="External URL or internal page slug")
    link_type = models.CharField(max_length=20, choices=LinkType.choices, default=LinkType.INTERNAL)
    section = models.CharField(max_length=20, choices=Section.choices, default=Section.HELP)
    sort_order = models.PositiveIntegerField(default=0, help_text="Display order (0 = first)")
    is_active = models.BooleanField(default=True, help_text="Whether link is active")
    opens_in_new_tab = models.BooleanField(default=False, help_text="Open in new tab (external links)")
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['section', 'sort_order', 'title']
        indexes = [
            models.Index(fields=['section', 'is_active']),
            models.Index(fields=['sort_order']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_section_display()})"


class SocialProfile(models.Model):
    """Social media profiles management"""
    
    class Platform(models.TextChoices):
        TWITTER = "twitter", "Twitter/X"
        FACEBOOK = "facebook", "Facebook"
        INSTAGRAM = "instagram", "Instagram"
        LINKEDIN = "linkedin", "LinkedIn"
        YOUTUBE = "youtube", "YouTube"
        TIKTOK = "tiktok", "TikTok"
        DISCORD = "discord", "Discord"
        TWITCH = "twitch", "Twitch"
    
    platform = models.CharField(max_length=20, choices=Platform.choices, unique=True)
    url = models.URLField(help_text="Full URL to the social media profile")
    username = models.CharField(max_length=100, blank=True, help_text="Username/handle (without @)")
    display_name = models.CharField(max_length=100, blank=True, help_text="Custom display name")
    is_active = models.BooleanField(default=True, help_text="Whether profile is active")
    sort_order = models.PositiveIntegerField(default=0, help_text="Display order (0 = first)")
    
    # Icons and styling
    icon_class = models.CharField(max_length=50, blank=True, help_text="CSS icon class (e.g., 'fab fa-twitter')")
    color = models.CharField(max_length=7, blank=True, help_text="Hex color code (e.g., '#1DA1F2')")
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['sort_order', 'platform']
        indexes = [
            models.Index(fields=['is_active', 'sort_order']),
        ]
    
    def __str__(self):
        return f"{self.get_platform_display()} ({self.username or self.url})"
    
    def get_display_name(self):
        """Get display name, falling back to platform name"""
        return self.display_name or self.get_platform_display()
    
    def get_icon_class(self):
        """Get icon class with fallbacks"""
        if self.icon_class:
            return self.icon_class
        
        # Default icon classes for common platforms
        defaults = {
            'twitter': 'fab fa-twitter',
            'facebook': 'fab fa-facebook',
            'instagram': 'fab fa-instagram',
            'linkedin': 'fab fa-linkedin',
            'youtube': 'fab fa-youtube',
            'tiktok': 'fab fa-tiktok',
            'discord': 'fab fa-discord',
            'twitch': 'fab fa-twitch',
        }
        return defaults.get(self.platform, 'fas fa-link')
    
    def get_color(self):
        """Get color with fallbacks"""
        if self.color:
            return self.color
        
        # Default colors for common platforms
        defaults = {
            'twitter': '#1DA1F2',
            'facebook': '#1877F2',
            'instagram': '#E4405F',
            'linkedin': '#0077B5',
            'youtube': '#FF0000',
            'tiktok': '#000000',
            'discord': '#5865F2',
            'twitch': '#9146FF',
        }
        return defaults.get(self.platform, '#666666')
