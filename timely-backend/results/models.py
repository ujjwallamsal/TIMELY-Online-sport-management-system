# results/models.py
from __future__ import annotations
from django.db import models
from fixtures.models import Fixture

class Result(models.Model):
    fixture = models.OneToOneField(Fixture, on_delete=models.CASCADE, related_name="result")
    score_home = models.PositiveIntegerField(default=0)
    score_away = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        home_team = self.fixture.home_team.name if self.fixture.home_team else "TBD"
        away_team = self.fixture.away_team.name if self.fixture.away_team else "TBD"
        return f"{home_team} {self.score_home}–{self.score_away} {away_team}"
