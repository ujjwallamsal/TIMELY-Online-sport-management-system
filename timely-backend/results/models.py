# results/models.py
from __future__ import annotations
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError
from fixtures.models import Fixture
from events.models import Event
from api.models import Team

User = get_user_model()


class Result(models.Model):
    """Result model for the lean MVP"""
    
    # Core relationships
    fixture = models.OneToOneField(Fixture, on_delete=models.CASCADE, related_name="result")
    
    # Scores
    home_score = models.PositiveIntegerField(default=0, help_text="Home team score")
    away_score = models.PositiveIntegerField(default=0, help_text="Away team score")
    
    # Winner and stats
    winner = models.ForeignKey(
        'api.Team', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="won_results",
        help_text="Winning team (null for draws)"
    )
    stats = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional statistics (JSON)"
    )
    
    # Verification
    entered_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="entered_results",
        help_text="User who entered this result"
    )
    finalized_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When result was finalized"
    )
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["finalized_at"]),
            models.Index(fields=["entered_by"]),
            models.Index(fields=["fixture"]),
            models.Index(fields=["winner"]),
        ]

    def __str__(self):
        home_team = self.fixture.home_team.name if self.fixture.home_team else "TBD"
        away_team = self.fixture.away_team.name if self.fixture.away_team else "TBD"
        return f"{home_team} {self.home_score}–{self.away_score} {away_team}"

    def clean(self):
        """Validate result data"""
        super().clean()
        
        # Validate winner matches one of the teams
        if self.winner and self.fixture:
            home_team = self.fixture.home_team
            away_team = self.fixture.away_team
            if self.winner not in [home_team, away_team]:
                raise ValidationError("Winner must be one of the teams in the fixture")
        
        # Validate winner for draws
        if self.is_draw and self.winner:
            raise ValidationError("Cannot have a winner for a draw")

    def save(self, *args, **kwargs):
        self.clean()
        
        # Auto-set winner based on scores
        if self.fixture and not self.is_draw:
            if self.home_score > self.away_score:
                self.winner = self.fixture.home_team
            elif self.away_score > self.home_score:
                self.winner = self.fixture.away_team
        elif self.is_draw:
            self.winner = None
        
        super().save(*args, **kwargs)

    @property
    def is_draw(self):
        """Check if result is a draw"""
        return self.home_score == self.away_score

    @property
    def is_finalized(self):
        """Check if result is finalized"""
        return self.finalized_at is not None

    def finalize(self, user=None):
        """Finalize the result"""
        self.entered_by = user
        self.finalized_at = timezone.now()
        self.save()

    def lock(self):
        """Lock the result (make it uneditable)"""
        if not self.finalized_at:
            self.finalized_at = timezone.now()
            self.save()


class LeaderboardEntry(models.Model):
    """Leaderboard entry for teams in an event"""
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="leaderboard_entries")
    team = models.ForeignKey('api.Team', on_delete=models.CASCADE, related_name="leaderboard_entries")
    
    # Points and standings
    pts = models.PositiveIntegerField(default=0, help_text="Total points (3 for win, 1 for draw)")
    w = models.PositiveIntegerField(default=0, help_text="Number of wins")
    d = models.PositiveIntegerField(default=0, help_text="Number of draws")
    l = models.PositiveIntegerField(default=0, help_text="Number of losses")
    
    # Goals
    gf = models.PositiveIntegerField(default=0, help_text="Goals scored")
    ga = models.PositiveIntegerField(default=0, help_text="Goals conceded")
    
    # Calculated fields
    gd = models.IntegerField(default=0, help_text="Goal difference (GF - GA)")
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["event", "-pts", "-gd", "-gf"]
        indexes = [
            models.Index(fields=["event", "pts"]),
            models.Index(fields=["team", "event"]),
            models.Index(fields=["event"]),
            models.Index(fields=["team"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['event', 'team'],
                name='unique_event_team_leaderboard'
            ),
        ]

    def __str__(self):
        return f"{self.event.name} - {self.team.name} ({self.pts} pts)"

    def save(self, *args, **kwargs):
        # Calculate goal difference
        self.gd = self.gf - self.ga
        super().save(*args, **kwargs)

    @property
    def matches_played(self):
        """Calculate total matches played"""
        return self.w + self.d + self.l

    @property
    def win_percentage(self):
        """Calculate win percentage"""
        if self.matches_played == 0:
            return 0.0
        return (self.w / self.matches_played) * 100

    @property
    def points_per_match(self):
        """Calculate points per match"""
        if self.matches_played == 0:
            return 0.0
        return self.pts / self.matches_played


