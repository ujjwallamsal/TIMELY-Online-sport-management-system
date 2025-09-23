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
    
    class Phase(models.TextChoices):
        RR = "RR", "Round Robin"
        KO = "KO", "Knockout"
    
    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        LIVE = "LIVE", "Live"
        FINAL = "FINAL", "Final"

    # Core relationships
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="fixtures", help_text="Event this fixture belongs to")
    round = models.PositiveIntegerField(default=1, help_text="Round number in tournament")
    phase = models.CharField(
        max_length=10,
        choices=Phase.choices,
        default=Phase.RR,
        help_text="Tournament phase"
    )
    
    # Teams
    home = models.ForeignKey(
        'teams.Team',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="home_fixtures",
        help_text="Home team"
    )
    away = models.ForeignKey(
        'teams.Team',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="away_fixtures",
        help_text="Away team"
    )
    
    # Scheduling
    venue = models.ForeignKey(Venue, on_delete=models.SET_NULL, null=True, blank=True, related_name="fixtures", help_text="Fixture venue")
    start_at = models.DateTimeField(help_text="Fixture start time")
    
    # Status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED, db_index=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["event", "start_at", "round"]
        indexes = [
            models.Index(fields=["event", "start_at"]),
            models.Index(fields=["event", "round"]),
            models.Index(fields=["venue", "start_at"]),
            models.Index(fields=["status"]),
            models.Index(fields=["phase"]),
            models.Index(fields=["home"]),
            models.Index(fields=["away"]),
            models.Index(fields=["status", "start_at"]),  # Required index
        ]

    def __str__(self) -> str:
        home_name = self.home.name if self.home else "TBD"
        away_name = self.away.name if self.away else "TBD"
        return f"R{self.round}: {home_name} vs {away_name}"

    def clean(self):
        """Validate fixture data"""
        super().clean()
        
        if self.home and self.away and self.home == self.away:
            raise ValidationError({'away': 'Home and away teams cannot be the same'})
        
        # Check for venue conflicts
        if self.venue and self.start_at:
            from .services.conflicts import check_venue_availability
            exclude_id = self.id if self.pk else None
            if not check_venue_availability(self.venue.id, self.start_at, exclude_fixture_id=exclude_id):
                raise ValidationError({
                    'venue': f'Venue {self.venue.name} is already booked at {self.start_at}',
                    'start_at': 'This time slot conflicts with an existing booking'
                })

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    @property
    def home_team(self):
        """Get home team"""
        return self.home

    @property
    def away_team(self):
        """Get away team"""
        return self.away

    def can_be_deleted(self):
        """Check if fixture can be deleted"""
        return self.status == self.Status.SCHEDULED

    def can_be_published(self):
        """Check if fixture can be published"""
        return self.status == self.Status.SCHEDULED and self.home and self.away

    def can_be_unpublished(self):
        """Check if fixture can be unpublished"""
        return self.status == self.Status.SCHEDULED

