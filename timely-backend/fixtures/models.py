# fixtures/models.py
from __future__ import annotations

from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db.models import Q

from events.models import Event, Division
from venues.models import Venue
from teams.models import Team
from registrations.models import Registration


class Fixture(models.Model):
    """Tournament fixture containing multiple matches"""
    class TournamentType(models.TextChoices):
        ROUND_ROBIN = "ROUND_ROBIN", "Round Robin"
        KNOCKOUT = "KNOCKOUT", "Knockout"
        GROUP_STAGE = "GROUP_STAGE", "Group Stage + Knockout"
        SWISS = "SWISS", "Swiss System"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PROPOSED = "PROPOSED", "Proposed"
        PUBLISHED = "PUBLISHED", "Published"
        CANCELLED = "CANCELLED", "Cancelled"

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="fixtures")
    division = models.ForeignKey(Division, on_delete=models.CASCADE, related_name="fixtures")
    
    name = models.CharField(max_length=100, help_text="Fixture name (e.g., 'Group A', 'Quarter Finals')")
    tournament_type = models.CharField(max_length=20, choices=TournamentType.choices, default=TournamentType.ROUND_ROBIN)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    
    # Tournament configuration
    rounds = models.PositiveIntegerField(default=1, help_text="Number of rounds")
    teams_per_match = models.PositiveIntegerField(default=2, help_text="Teams per match (2 for standard, 4 for doubles)")
    
    # Scheduling constraints
    start_date = models.DateField()
    end_date = models.DateField()
    match_duration_minutes = models.PositiveIntegerField(default=90, help_text="Duration of each match in minutes")
    break_between_matches_minutes = models.PositiveIntegerField(default=30, help_text="Break between consecutive matches")
    
    # Venue constraints
    venues = models.ManyToManyField(Venue, related_name="fixtures", blank=True)
    max_matches_per_venue_per_day = models.PositiveIntegerField(default=8, help_text="Maximum matches per venue per day")
    
    # Time constraints
    earliest_start_time = models.TimeField(default="09:00:00", help_text="Earliest match start time")
    latest_end_time = models.TimeField(default="22:00:00", help_text="Latest match end time")
    
    # Generation metadata
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name="generated_fixtures")
    generation_notes = models.TextField(blank=True, help_text="Notes about fixture generation")
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["event", "start_date", "name"]
        indexes = [
            models.Index(fields=["event", "status"]),
            models.Index(fields=["division", "status"]),
            models.Index(fields=["start_date", "end_date"]),
            models.Index(fields=["tournament_type", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.event.name} - {self.division.name} - {self.name}"

    def clean(self):
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError("Start date cannot be after end date")
        
        if self.earliest_start_time and self.latest_end_time and self.earliest_start_time >= self.latest_end_time:
            raise ValidationError("Earliest start time must be before latest end time")

    @property
    def total_matches(self):
        """Calculate total number of matches in this fixture"""
        return self.matches.count()

    @property
    def is_generatable(self):
        """Check if fixture can be generated (has teams and venues)"""
        return (
            self.division.registrations.filter(status='CONFIRMED').count() >= 2 and
            self.venues.count() > 0
        )

    def get_available_teams(self):
        """Get confirmed teams for this fixture"""
        return self.division.registrations.filter(
            status='CONFIRMED',
            registration_type='TEAM'
        ).select_related('team')

    def get_available_individuals(self):
        """Get confirmed individual participants for this fixture"""
        return self.division.registrations.filter(
            status='CONFIRMED',
            registration_type='INDIVIDUAL'
        )


class MatchEntry(models.Model):
    """Individual match entry within a fixture"""
    class EntryType(models.TextChoices):
        TEAM = "TEAM", "Team"
        INDIVIDUAL = "INDIVIDUAL", "Individual"
        BYE = "BYE", "Bye (No opponent)"

    fixture = models.ForeignKey(Fixture, on_delete=models.CASCADE, related_name="match_entries")
    match = models.ForeignKey('Match', on_delete=models.CASCADE, related_name="entries")
    
    # Participant information
    entry_type = models.CharField(max_length=20, choices=EntryType.choices)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name="match_entries")
    individual_registration = models.ForeignKey(Registration, on_delete=models.SET_NULL, null=True, blank=True, related_name="match_entries")
    
    # Match position
    position = models.CharField(max_length=10, choices=[
        ('HOME', 'Home'),
        ('AWAY', 'Away'),
        ('PLAYER1', 'Player 1'),
        ('PLAYER2', 'Player 2'),
        ('PLAYER3', 'Player 3'),
        ('PLAYER4', 'Player 4'),
    ])
    
    # Seeding and progression
    seed = models.PositiveIntegerField(null=True, blank=True, help_text="Tournament seed number")
    previous_match = models.ForeignKey('Match', on_delete=models.SET_NULL, null=True, blank=True, related_name="next_matches", help_text="Match that this entry came from")
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["match", "position"]
        indexes = [
            models.Index(fields=["fixture", "match"]),
            models.Index(fields=["team", "entry_type"]),
            models.Index(fields=["seed"]),
        ]

    def __str__(self) -> str:
        if self.entry_type == self.EntryType.TEAM:
            return f"{self.team.name} ({self.position})"
        elif self.entry_type == self.EntryType.INDIVIDUAL:
            return f"{self.individual_registration.user.get_full_name()} ({self.position})"
        else:
            return f"Bye ({self.position})"

    def clean(self):
        if self.entry_type == self.EntryType.TEAM and not self.team:
            raise ValidationError("Team entry type requires a team")
        elif self.entry_type == self.EntryType.INDIVIDUAL and not self.individual_registration:
            raise ValidationError("Individual entry type requires an individual registration")
        elif self.entry_type == self.EntryType.BYE and (self.team or self.individual_registration):
            raise ValidationError("Bye entry type cannot have a team or individual")


class Match(models.Model):
    class Status(models.TextChoices):
        SCHEDULED  = "SCHEDULED", "Scheduled"
        LIVE       = "LIVE", "Live"
        COMPLETED  = "COMPLETED", "Completed"
        CANCELLED  = "CANCELLED", "Cancelled"
        POSTPONED  = "POSTPONED", "Postponed"

    fixture = models.ForeignKey(Fixture, on_delete=models.CASCADE, related_name="matches", null=True, blank=True)
    round_number = models.PositiveIntegerField(default=1, help_text="Round number in the tournament")
    match_number = models.PositiveIntegerField(default=1, help_text="Match number within the round")
    
    venue = models.ForeignKey(Venue, on_delete=models.SET_NULL, null=True, blank=True, related_name="matches")
    scheduled_at = models.DateTimeField(help_text="Scheduled start time", null=True, blank=True)
    
    # Match details
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.SCHEDULED, db_index=True)
    is_published = models.BooleanField(default=False, help_text="Whether match is visible to participants")
    
    # Match results (for knockout progression)
    winner = models.ForeignKey(MatchEntry, on_delete=models.SET_NULL, null=True, blank=True, related_name="won_matches")
    score_home = models.PositiveIntegerField(null=True, blank=True)
    score_away = models.PositiveIntegerField(null=True)
    
    notes = models.TextField(blank=True, default="")
    
    # Conflict resolution
    original_scheduled_at = models.DateTimeField(null=True, blank=True, help_text="Original scheduled time before rescheduling")
    rescheduled_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name="rescheduled_matches")
    reschedule_reason = models.TextField(blank=True, help_text="Reason for rescheduling")

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["fixture", "round_number", "match_number", "scheduled_at"]
        indexes = [
            models.Index(fields=["fixture", "round_number"]),
            models.Index(fields=["venue", "scheduled_at"]),
            models.Index(fields=["status", "is_published"]),
            models.Index(fields=["scheduled_at"]),
        ]
        unique_together = [["fixture", "round_number", "match_number"]]

    def __str__(self) -> str:
        entries = self.entries.all()
        if entries.count() >= 2:
            home = entries.filter(position__in=['HOME', 'PLAYER1']).first()
            away = entries.filter(position__in=['AWAY', 'PLAYER2']).first()
            home_name = str(home) if home else "TBD"
            away_name = str(away) if away else "TBD"
            return f"R{self.round_number} M{self.match_number}: {home_name} vs {away_name}"
        return f"R{self.round_number} M{self.match_number}: TBD vs TBD"

    def clean(self):
        if self.scheduled_at and self.venue:
            # Check for venue conflicts
            conflicting_matches = Match.objects.filter(
                venue=self.venue,
                scheduled_at__lt=self.scheduled_at + timezone.timedelta(minutes=self.fixture.match_duration_minutes),
                scheduled_at__gt=self.scheduled_at - timezone.timedelta(minutes=self.fixture.break_between_matches_minutes),
                status__in=[Match.Status.SCHEDULED, Match.Status.LIVE],
                id__ne=self.id
            )
            if conflicting_matches.exists():
                raise ValidationError("This match conflicts with another match at the same venue")

    @property
    def end_time(self):
        """Calculate match end time based on duration"""
        if self.scheduled_at:
            return self.scheduled_at + timezone.timedelta(minutes=self.fixture.match_duration_minutes)
        return None

    @property
    def has_conflicts(self):
        """Check if this match has scheduling conflicts"""
        if not self.scheduled_at or not self.venue:
            return False
        
        conflicting_matches = Match.objects.filter(
            venue=self.venue,
            scheduled_at__lt=self.end_time,
            scheduled_at__gt=self.scheduled_at - timezone.timedelta(minutes=self.fixture.break_between_matches_minutes),
            status__in=[Match.Status.SCHEDULED, Match.Status.LIVE],
            id__ne=self.id
        )
        return conflicting_matches.exists()

    def reschedule(self, new_time, user, reason=""):
        """Reschedule this match with conflict checking"""
        if self.status == Match.Status.COMPLETED:
            raise ValidationError("Cannot reschedule completed matches")
        
        # Store original time
        if not self.original_scheduled_at:
            self.original_scheduled_at = self.scheduled_at
        
        self.scheduled_at = new_time
        self.rescheduled_by = user
        self.reschedule_reason = reason
        
        # Check for conflicts
        if self.has_conflicts:
            raise ValidationError("New time conflicts with existing matches")
        
        self.save()
        return True
