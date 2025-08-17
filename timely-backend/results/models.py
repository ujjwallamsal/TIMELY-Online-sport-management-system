# results/models.py
from __future__ import annotations
from django.db import models
from fixtures.models import Match

class Result(models.Model):
    match = models.OneToOneField(Match, on_delete=models.CASCADE, related_name="result")
    score_a = models.PositiveIntegerField(default=0)
    score_b = models.PositiveIntegerField(default=0)
    notes   = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        a = self.match.team_a.name if self.match.team_a else "TBD"
        b = self.match.team_b.name if self.match.team_b else "TBD"
        return f"{a} {self.score_a}–{self.score_b} {b}"
