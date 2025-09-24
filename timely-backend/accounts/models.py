from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.core.exceptions import ValidationError


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user"""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        
        # Ensure role is always SPECTATOR for new users
        extra_fields.setdefault('role', 'SPECTATOR')
        
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('email_verified', True)
        extra_fields.setdefault('role', 'ADMIN')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model with email-based authentication and RBAC"""
    
    class Roles(models.TextChoices):
        SPECTATOR = "SPECTATOR", "Spectator"
        ORGANIZER = "ORGANIZER", "Organizer"
        COACH = "COACH", "Coach"
        ATHLETE = "ATHLETE", "Athlete"
        ADMIN = "ADMIN", "Admin"
    
    # Core fields
    email = models.EmailField(unique=True, db_index=True)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    
    # Status fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    
    # Role field - users never set this at registration
    role = models.CharField(
        max_length=20, 
        choices=Roles.choices, 
        default=Roles.SPECTATOR, 
        db_index=True
    )
    
    # Timestamps
    date_joined = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        db_table = 'accounts_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['is_active']),
            models.Index(fields=['email_verified']),
        ]
    
    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def display_name(self):
        """Get user's display name (full name or email)"""
        return self.full_name if self.full_name else self.email
    
    def clean(self):
        """Validate user data"""
        super().clean()
        if self.role not in [choice[0] for choice in self.Roles.choices]:
            raise ValidationError({'role': 'Invalid role choice'})
    
    def save(self, *args, **kwargs):
        """Override save to ensure role is always valid"""
        self.clean()
        super().save(*args, **kwargs)


class OrganizerApplication(models.Model):
    """Model for organizer role applications"""
    
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='organizer_applications',
        unique=True  # One active application per user
    )
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.PENDING,
        db_index=True
    )
    reason = models.TextField(blank=True, help_text="Reason for application")
    reviewed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_applications',
        limit_choices_to={'is_staff': True}
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'accounts_organizer_application'
        verbose_name = 'Organizer Application'
        verbose_name_plural = 'Organizer Applications'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.get_status_display()}"
    
    def approve(self, reviewer):
        """Approve the application and upgrade user role"""
        if self.status == self.Status.APPROVED:
            return self  # Idempotent - already approved
        
        self.status = self.Status.APPROVED
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'updated_at'])
        
        # Upgrade user role to ORGANIZER
        self.user.role = User.Roles.ORGANIZER
        self.user.is_staff = False  # Organizer is not admin
        self.user.save(update_fields=['role', 'is_staff', 'updated_at'])
        
        # Send email notification
        try:
            from .emails import send_organizer_application_status
            send_organizer_application_status(self.user, 'APPROVED')
        except Exception:
            # Don't fail the approval if email fails
            pass
        
        return self
    
    def reject(self, reviewer, reason=""):
        """Reject the application"""
        if self.status == self.Status.REJECTED:
            return self  # Idempotent - already rejected
        
        self.status = self.Status.REJECTED
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        if reason:
            self.reason = reason
        self.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'reason', 'updated_at'])
        
        # Send email notification
        try:
            from .emails import send_organizer_application_status
            send_organizer_application_status(self.user, 'REJECTED', reason)
        except Exception:
            # Don't fail the rejection if email fails
            pass
        
        return self
    
    def clean(self):
        """Validate application data"""
        super().clean()
        if self.status not in [choice[0] for choice in self.Status.choices]:
            raise ValidationError({'status': 'Invalid status choice'})
    
    def save(self, *args, **kwargs):
        """Override save to ensure data integrity"""
        self.clean()
        super().save(*args, **kwargs)