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
    """Enhanced result model with status tracking and verification"""
    
    class Status(models.TextChoices):
        PROVISIONAL = "provisional", "Provisional"
        FINAL = "final", "Final"
        VERIFIED = "verified", "Verified"
        PUBLISHED = "published", "Published"
    
    # Core relationships
    fixture = models.OneToOneField(Fixture, on_delete=models.CASCADE, related_name="result")
    
    # Scores
    score_home = models.PositiveIntegerField(default=0, help_text="Home team score")
    score_away = models.PositiveIntegerField(default=0, help_text="Away team score")
    
    # Status and verification
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.PROVISIONAL,
        db_index=True,
        help_text="Result status (provisional or final)"
    )
    published = models.BooleanField(
        default=False, 
        db_index=True,
        help_text="Whether result is published to public"
    )
    winner = models.ForeignKey(
        Team, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="won_results",
        help_text="Winning team (null for draws)"
    )
    
    # Verification tracking
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
    
    # Additional data
    notes = models.TextField(blank=True, default="", help_text="Additional result notes")
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["published"]),
            models.Index(fields=["verified_at"]),
        ]

    def __str__(self):
        home_team = self.fixture.home_team.name if self.fixture.home_team else "TBD"
        away_team = self.fixture.away_team.name if self.fixture.away_team else "TBD"
        status_indicator = "✓" if self.status == self.Status.FINAL else "~"
        return f"{status_indicator} {home_team} {self.score_home}–{self.score_away} {away_team}"

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
    def is_verified(self):
        """Check if result is verified"""
        return self.verified_at is not None

    @property
    def can_be_published(self):
        """Check if result can be published"""
        return self.status == self.Status.FINAL and self.is_verified

    def finalize(self, user=None):
        """Finalize the result"""
        self.status = self.Status.FINAL
        self.verified_by = user
        self.verified_at = timezone.now()
        self.save()

    def verify(self, user):
        """Verify the result"""
        self.status = self.Status.VERIFIED
        self.verified_by = user
        self.verified_at = timezone.now()
        self.save()

    def publish(self):
        """Publish the result"""
        if self.can_be_published:
            self.status = self.Status.PUBLISHED
            self.published = True
            self.save()

    def unpublish(self):
        """Unpublish the result"""
        self.published = False
        self.status = self.Status.VERIFIED
        self.save()

    def invalidate(self):
        """Invalidate the result (reset to provisional)"""
        self.status = self.Status.PROVISIONAL
        self.published = False
        self.verified_by = None
        self.verified_at = None
        self.save()


class LeaderboardEntry(models.Model):
    """Leaderboard entry for teams in an event"""
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="leaderboard_entries")
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="leaderboard_entries")
    
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
    
    # Position
    position = models.PositiveIntegerField(default=1, help_text="Current position in leaderboard")
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["event", "position", "-points", "-goal_difference", "-goals_for"]
        indexes = [
            models.Index(fields=["event", "position"]),
            models.Index(fields=["event", "points"]),
            models.Index(fields=["team", "event"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['event', 'team'],
                name='unique_event_team_leaderboard'
            ),
        ]

    def __str__(self):
        return f"{self.event.name} - {self.team.name} (#{self.position})"

    def save(self, *args, **kwargs):
        # Calculate goal difference
        self.goal_difference = self.goals_for - self.goals_against
        super().save(*args, **kwargs)

    @property
    def win_percentage(self):
        """Calculate win percentage"""
        if self.matches_played == 0:
            return 0.0
        return (self.wins / self.matches_played) * 100

    @property
    def points_per_match(self):
        """Calculate points per match"""
        if self.matches_played == 0:
            return 0.0
        return self.points / self.matches_played


class AthleteStat(models.Model):
    """Athlete statistics for individual sports (JSONB for flexibility)"""
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="athlete_stats")
    athlete = models.ForeignKey(User, on_delete=models.CASCADE, related_name="athlete_stats")
    
    # Sport-agnostic metrics stored as JSONB
    metrics = models.JSONField(
        default=dict,
        help_text="Sport-specific metrics (e.g., time, distance, score)"
    )
    
    # Common fields
    position = models.PositiveIntegerField(default=1, help_text="Final position/ranking")
    points = models.PositiveIntegerField(default=0, help_text="Points awarded")
    
    # Verification
    verified = models.BooleanField(default=False, help_text="Whether stats are verified")
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_athlete_stats",
        help_text="User who verified these stats"
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["event", "position", "points"]
        indexes = [
            models.Index(fields=["event", "position"]),
            models.Index(fields=["athlete", "event"]),
            models.Index(fields=["verified"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['event', 'athlete'],
                name='unique_event_athlete_stats'
            ),
        ]

    def __str__(self):
        return f"{self.event.name} - {self.athlete.get_full_name()} (#{self.position})"

    def verify(self, user):
        """Verify athlete stats"""
        self.verified = True
        self.verified_by = user
        self.verified_at = timezone.now()
        self.save()
