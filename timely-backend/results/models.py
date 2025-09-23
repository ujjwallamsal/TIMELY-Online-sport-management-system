# results/models.py
from __future__ import annotations
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError
from fixtures.models import Fixture
from events.models import Event
from teams.models import Team

User = get_user_model()


class Result(models.Model):
    """Result model for the lean MVP"""
    
    # Core relationships
    fixture = models.OneToOneField(Fixture, on_delete=models.CASCADE, related_name="result")
    
    # Scores
    score_home = models.PositiveIntegerField(default=0, help_text="Home team score")
    score_away = models.PositiveIntegerField(default=0, help_text="Away team score")
    
    # Winner
    winner = models.ForeignKey(
        'teams.Team', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="won_results",
        help_text="Winning team (null for draws)"
    )
    
    # Verification
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_results",
        help_text="User who verified this result"
    )
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When result was verified"
    )
    
    # Status and publication
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('VERIFIED', 'Verified'),
            ('FINALIZED', 'Finalized'),
        ],
        default='PENDING',
        help_text="Result status"
    )
    published = models.BooleanField(default=False, help_text="Whether result is published")
    notes = models.TextField(blank=True, help_text="Additional notes")
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["verified_at"]),
            models.Index(fields=["verified_by"]),
            models.Index(fields=["fixture"]),
            models.Index(fields=["winner"]),
        ]

    def __str__(self):
        home_team = self.fixture.home_team.name if self.fixture.home_team else "TBD"
        away_team = self.fixture.away_team.name if self.fixture.away_team else "TBD"
        return f"{home_team} {self.score_home}–{self.score_away} {away_team}"

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
            if self.score_home > self.score_away:
                self.winner = self.fixture.home_team
            elif self.score_away > self.score_home:
                self.winner = self.fixture.away_team
        elif self.is_draw:
            self.winner = None
        
        super().save(*args, **kwargs)

    @property
    def is_draw(self):
        """Check if result is a draw"""
        return self.score_home == self.score_away

    @property
    def is_finalized(self):
        """Check if result is finalized"""
        return self.status == 'FINALIZED'

    def finalize(self, user=None):
        """Finalize the result"""
        self.verified_by = user
        self.verified_at = timezone.now()
        self.status = 'FINALIZED'
        self.save()

    def lock(self):
        """Lock the result (make it uneditable)"""
        if not self.verified_at:
            self.verified_at = timezone.now()
            self.status = 'FINALIZED'
            self.save()


class LeaderboardEntry(models.Model):
    """Leaderboard entry for teams in an event"""
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="leaderboard_entries")
    team = models.ForeignKey('teams.Team', on_delete=models.CASCADE, related_name="leaderboard_entries")
    
    # Points and standings
    points = models.PositiveIntegerField(default=0, help_text="Total points (3 for win, 1 for draw)")
    matches_played = models.PositiveIntegerField(default=0, help_text="Number of matches played")
    wins = models.PositiveIntegerField(default=0, help_text="Number of wins")
    draws = models.PositiveIntegerField(default=0, help_text="Number of draws")
    losses = models.PositiveIntegerField(default=0, help_text="Number of losses")
    
    # Goals
    goals_for = models.PositiveIntegerField(default=0, help_text="Goals scored")
    goals_against = models.PositiveIntegerField(default=0, help_text="Goals conceded")
    
    # Calculated fields
    goal_difference = models.IntegerField(default=0, help_text="Goal difference (GF - GA)")
    position = models.PositiveIntegerField(default=0, help_text="Current position in leaderboard")
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["event", "-points", "-goal_difference", "-goals_for"]
        indexes = [
            models.Index(fields=["event", "-points"]),
            models.Index(fields=["team"]),
        ]
        unique_together = [["event", "team"]]

    def __str__(self):
        return f"{self.team.name} - {self.points} pts"

    def save(self, *args, **kwargs):
        # Auto-calculate goal difference
        self.goal_difference = self.goals_for - self.goals_against
        super().save(*args, **kwargs)