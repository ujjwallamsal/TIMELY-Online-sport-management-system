# fixtures/models.py
from __future__ import annotations

from django.db import models
from django.utils import timezone

from events.models import Event
from venues.models import Venue
from teams.models import Team


class Match(models.Model):
    class Status(models.TextChoices):
        SCHEDULED  = "SCHEDULED", "Scheduled"
        LIVE       = "LIVE", "Live"
        COMPLETED  = "COMPLETED", "Completed"
        CANCELLED  = "CANCELLED", "Cancelled"

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="matches")
    venue = models.ForeignKey(Venue, on_delete=models.SET_NULL, null=True, blank=True, related_name="matches")

    team_a = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name="home_matches")
    team_b = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name="away_matches")

    start_time = models.DateTimeField()
    end_time   = models.DateTimeField(null=True, blank=True)

    status = models.CharField(max_length=12, choices=Status.choices, default=Status.SCHEDULED, db_index=True)
    is_published = models.BooleanField(default=False)

    notes = models.TextField(blank=True, default="")

    # audit
    created_at = models.DateTimeField(auto_now_add=True)  # << already migrated in your setup
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_time"]
        indexes = [
            models.Index(fields=["event", "start_time"]),
            models.Index(fields=["status"]),
            models.Index(fields=["is_published"]),
        ]

    def __str__(self) -> str:
        a = self.team_a.name if self.team_a else "TBD"
        b = self.team_b.name if self.team_b else "TBD"
        return f"{self.event.name} · {a} vs {b} · {self.start_time:%Y-%m-%d %H:%M}"
