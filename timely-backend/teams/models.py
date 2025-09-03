from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


class Team(models.Model):
    """Team model for sports teams"""
    name = models.CharField(max_length=255, unique=True)
    sport = models.CharField(max_length=100, help_text="Sport this team plays")
    description = models.TextField(blank=True)
    
    # Team Management
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='managed_teams',
        help_text="Team manager"
    )
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='coached_teams',
        help_text="Team coach (optional)"
    )
    contact_email = models.EmailField(help_text="Team contact email")
    contact_phone = models.CharField(max_length=20, blank=True, help_text="Team contact phone")
    
    # Team Details
    founded_date = models.DateField(null=True, blank=True)
    home_venue = models.ForeignKey('venues.Venue', on_delete=models.SET_NULL, null=True, blank=True, related_name='home_teams')
    logo = models.ImageField(upload_to='team_logos/', null=True, blank=True)
    
    # Team Status
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True)
    
    # Team Statistics
    total_matches = models.PositiveIntegerField(default=0)
    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)
    draws = models.PositiveIntegerField(default=0)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='created_teams')
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['sport', 'name']),
            models.Index(fields=['manager']),
            models.Index(fields=['coach']),
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def win_percentage(self):
        """Calculate team's win percentage"""
        if self.total_matches == 0:
            return 0.0
        return (self.wins / self.total_matches) * 100
    
    @property
    def points(self):
        """Calculate team's total points (3 for win, 1 for draw)"""
        return (self.wins * 3) + self.draws
    
    def update_stats(self, match_result):
        """Update team statistics based on match result"""
        self.total_matches += 1
        if match_result == 'win':
            self.wins += 1
        elif match_result == 'loss':
            self.losses += 1
        elif match_result == 'draw':
            self.draws += 1
        self.save()


class TeamMember(models.Model):
    """Team membership model linking users to teams with roles"""
    class Role(models.TextChoices):
        PLAYER = "PLAYER", "Player"
        COACH = "COACH", "Coach"
        MANAGER = "MANAGER", "Manager"
        CAPTAIN = "CAPTAIN", "Captain"
        ASSISTANT_COACH = "ASSISTANT_COACH", "Assistant Coach"
        PHYSIO = "PHYSIO", "Physiotherapist"
        SUPPORT = "SUPPORT", "Support Staff"
    
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        SUSPENDED = "SUSPENDED", "Suspended"
        INJURED = "INJURED", "Injured"
    
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='team_memberships',
        null=True,
        blank=True,
        help_text="Linked user account (optional for standalone profiles)"
    )
    
    # Member Details
    full_name = models.CharField(max_length=255, help_text="Full name of the team member")
    date_of_birth = models.DateField(null=True, blank=True, help_text="Date of birth for age verification")
    position = models.CharField(max_length=100, blank=True, help_text="Player position (e.g., Forward, Defender)")
    jersey_number = models.PositiveIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(99)])
    
    # Role and Status
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PLAYER)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    
    # Dates
    joined_date = models.DateField(default=timezone.now)
    left_date = models.DateField(null=True, blank=True)
    
    # Permissions
    can_manage_team = models.BooleanField(default=False, help_text="Can manage team settings and roster")
    can_edit_results = models.BooleanField(default=False, help_text="Can edit match results")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['team', 'user']
        ordering = ['team', 'role', 'jersey_number']
        indexes = [
            models.Index(fields=['team', 'status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['role', 'status']),
        ]
    
    def __str__(self):
        name = self.user.get_full_name() if self.user else self.full_name
        return f"{name} - {self.team.name} ({self.get_role_display()})"
    
    @property
    def is_active_member(self):
        """Check if member is currently active"""
        return self.status == self.Status.ACTIVE and not self.left_date
    
    def leave_team(self, date=None):
        """Mark member as having left the team"""
        if date is None:
            date = timezone.now().date()
        self.left_date = date
        self.status = self.Status.INACTIVE
        self.save()


class AthleteProfile(models.Model):
    """Extended profile for athletes with sports-specific information"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='athlete_profile')
    
    # Physical Attributes
    height_cm = models.PositiveIntegerField(null=True, blank=True, help_text="Height in centimeters")
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Weight in kilograms")
    
    # Sports Information
    primary_sport = models.CharField(max_length=100, blank=True)
    secondary_sports = models.JSONField(default=list, blank=True, help_text="List of secondary sports")
    
    # Experience
    years_experience = models.PositiveIntegerField(default=0, help_text="Years of experience in primary sport")
    skill_level = models.CharField(max_length=20, choices=[
        ('BEGINNER', 'Beginner'),
        ('INTERMEDIATE', 'Intermediate'),
        ('ADVANCED', 'Advanced'),
        ('ELITE', 'Elite'),
        ('PROFESSIONAL', 'Professional'),
    ], default='INTERMEDIATE')
    
    # Achievements
    achievements = models.JSONField(default=list, blank=True, help_text="List of achievements and awards")
    
    # Medical Information
    medical_conditions = models.TextField(blank=True, help_text="Relevant medical conditions")
    emergency_contact = models.CharField(max_length=255, blank=True)
    emergency_phone = models.CharField(max_length=20, blank=True)
    
    # Preferences
    preferred_positions = models.JSONField(default=list, blank=True, help_text="Preferred playing positions")
    availability = models.JSONField(default=dict, blank=True, help_text="Weekly availability schedule")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['primary_sport', 'skill_level']),
            models.Index(fields=['years_experience']),
        ]
    
    def __str__(self):
        return f"Athlete Profile - {self.user.get_full_name()}"
    
    @property
    def is_complete(self):
        """Check if athlete profile is complete"""
        required_fields = ['primary_sport', 'emergency_contact', 'emergency_phone']
        return all(getattr(self, field) for field in required_fields)


class TeamInvitation(models.Model):
    """Team invitation system for adding new members"""
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        DECLINED = "DECLINED", "Declined"
        EXPIRED = "EXPIRED", "Expired"
    
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='invitations')
    invited_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='team_invitations')
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_invitations')
    
    # Invitation Details
    role = models.CharField(max_length=20, choices=TeamMember.Role.choices, default=TeamMember.Role.PLAYER)
    message = models.TextField(blank=True, help_text="Personal message with invitation")
    
    # Status and Expiry
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    expires_at = models.DateTimeField(help_text="When the invitation expires")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['team', 'invited_user']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['team', 'status']),
            models.Index(fields=['invited_user', 'status']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Invitation to {self.team.name} for {self.invited_user.get_full_name()}"
    
    @property
    def is_expired(self):
        """Check if invitation has expired"""
        return timezone.now() > self.expires_at
    
    def accept(self):
        """Accept the invitation and create team membership"""
        if self.status != self.Status.PENDING or self.is_expired:
            return False
        
        # Create team membership
        TeamMember.objects.create(
            team=self.team,
            user=self.invited_user,
            role=self.role,
            joined_date=timezone.now().date()
        )
        
        self.status = self.Status.ACCEPTED
        self.responded_at = timezone.now()
        self.save()
        return True
    
    def decline(self):
        """Decline the invitation"""
        if self.status != self.Status.PENDING:
            return False
        
        self.status = self.Status.DECLINED
        self.responded_at = timezone.now()
        self.save()
        return True


class TeamEventEntry(models.Model):
    """Team entry to events/divisions"""
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        WITHDRAWN = "withdrawn", "Withdrawn"
    
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='event_entries')
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name='team_entries')
    division = models.ForeignKey(
        'events.Division', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='team_entries',
        help_text="Specific division (optional)"
    )
    
    # Entry Status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    note = models.TextField(blank=True, help_text="Additional notes or comments")
    
    # Decision tracking
    decided_at = models.DateTimeField(null=True, blank=True, help_text="When the entry was decided")
    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='decided_team_entries',
        help_text="User who made the decision"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['team', 'event', 'division']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['team', 'event', 'status']),
            models.Index(fields=['event', 'status']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        division_str = f" - {self.division.name}" if self.division else ""
        return f"{self.team.name} → {self.event.name}{division_str} ({self.get_status_display()})"
    
    def approve(self, decided_by, note=""):
        """Approve the team entry"""
        if self.status not in [self.Status.PENDING]:
            return False
        
        self.status = self.Status.APPROVED
        self.decided_at = timezone.now()
        self.decided_by = decided_by
        if note:
            self.note = note
        self.save()
        return True
    
    def reject(self, decided_by, note=""):
        """Reject the team entry"""
        if self.status not in [self.Status.PENDING]:
            return False
        
        self.status = self.Status.REJECTED
        self.decided_at = timezone.now()
        self.decided_by = decided_by
        if note:
            self.note = note
        self.save()
        return True
    
    def withdraw(self, note=""):
        """Withdraw the team entry"""
        if self.status not in [self.Status.PENDING, self.Status.APPROVED]:
            return False
        
        self.status = self.Status.WITHDRAWN
        self.decided_at = timezone.now()
        if note:
            self.note = note
        self.save()
        return True
