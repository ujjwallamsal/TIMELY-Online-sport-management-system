# fixtures/models.py
from __future__ import annotations

from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

from events.models import Event
from venues.models import Venue
from teams.models import Team

User = get_user_model()


class Fixture(models.Model):
    """Fixture model for tournament scheduling"""
    
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        COMPLETED = "completed", "Completed"

    # Core relationships
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="fixtures", help_text="Event this fixture belongs to")
    round_no = models.PositiveIntegerField(default=1, help_text="Round number in tournament")
    
    # Scheduling
    starts_at = models.DateTimeField(help_text="Fixture start time")
    ends_at = models.DateTimeField(help_text="Fixture end time")
    venue = models.ForeignKey(Venue, on_delete=models.SET_NULL, null=True, blank=True, related_name="fixtures", help_text="Fixture venue")
    
    # Status and metadata
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["event", "starts_at", "round_no"]
        indexes = [
            models.Index(fields=["event", "starts_at"]),
            models.Index(fields=["event", "round_no"]),
            models.Index(fields=["venue", "starts_at"]),
            models.Index(fields=["status"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(ends_at__gt=models.F('starts_at')),
                name='fixture_ends_after_starts'
            ),
        ]

    def __str__(self) -> str:
        return f"R{self.round_no}: {self.starts_at} - {self.ends_at}"

    def clean(self):
        """Validate fixture data"""
        super().clean()
        
        if self.ends_at <= self.starts_at:
            raise ValidationError({'ends_at': 'End time must be after start time'})

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    @property
    def home_entry(self):
        """Get home fixture entry"""
        return self.entries.filter(side=FixtureEntry.Side.HOME).first()

    @property
    def away_entry(self):
        """Get away fixture entry"""
        return self.entries.filter(side=FixtureEntry.Side.AWAY).first()

    @property
    def home_team(self):
        """Get home team"""
        home_entry = self.home_entry
        return home_entry.team if home_entry else None

    @property
    def away_team(self):
        """Get away team"""
        away_entry = self.away_entry
        return away_entry.team if away_entry else None

    @property
    def home_participant(self):
        """Get home participant"""
        home_entry = self.home_entry
        return home_entry.participant if home_entry else None

    @property
    def away_participant(self):
        """Get away participant"""
        away_entry = self.away_entry
        return away_entry.participant if away_entry else None

    def can_be_deleted(self):
        """Check if fixture can be deleted"""
        return self.status == self.Status.DRAFT

    def can_be_published(self):
        """Check if fixture can be published"""
        return self.status == self.Status.DRAFT and self.entries.count() >= 2

    def can_be_unpublished(self):
        """Check if fixture can be unpublished"""
        return self.status == self.Status.PUBLISHED and self.status != self.Status.COMPLETED


class FixtureEntry(models.Model):
    """Fixture entry for teams or individual participants"""
    
    class Side(models.TextChoices):
        HOME = "home", "Home"
        AWAY = "away", "Away"

    fixture = models.ForeignKey(Fixture, on_delete=models.CASCADE, related_name="entries", help_text="Fixture this entry belongs to")
    side = models.CharField(max_length=10, choices=Side.choices, help_text="Home or away side")
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name="fixture_entries", help_text="Team (if team-based)")
    participant = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="fixture_entries", help_text="Individual participant (if individual-based)")
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["fixture", "side"]
        indexes = [
            models.Index(fields=["fixture", "side"]),
            models.Index(fields=["team"]),
            models.Index(fields=["participant"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['fixture', 'side'],
                name='unique_fixture_side'
            ),
            models.CheckConstraint(
                check=(
                    models.Q(team__isnull=False, participant__isnull=True) |
                    models.Q(team__isnull=True, participant__isnull=False)
                ),
                name='fixture_entry_team_or_participant'
            ),
        ]

    def __str__(self) -> str:
        name = str(self.team) if self.team else str(self.participant)
        return f"{self.fixture} - {self.side}: {name}"

    def clean(self):
        """Validate fixture entry data"""
        super().clean()
        
        # Must have either team or participant, but not both
        if not (self.team or self.participant):
            raise ValidationError("Must specify either team or participant")
        
        if self.team and self.participant:
            raise ValidationError("Cannot specify both team and participant")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    @property
    def name(self):
        """Get display name for the entry"""
        return str(self.team) if self.team else str(self.participant)