# accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.core.validators import RegexValidator
from django.conf import settings
import uuid


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user"""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
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
        extra_fields.setdefault('role', 'ADMIN')  # Set default role for superuser
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model with email-based authentication and RBAC"""
    
    # Role choices for backward compatibility
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrator"
        ORGANIZER = "ORGANIZER", "Event Organizer"
        ATHLETE = "ATHLETE", "Athlete"
        COACH = "COACH", "Coach"
        MANAGER = "MANAGER", "Team Manager"
        SPECTATOR = "SPECTATOR", "Spectator"
        VOLUNTEER = "VOLUNTEER", "Volunteer"
        REFEREE = "REFEREE", "Referee"
        MEDICAL = "MEDICAL", "Medical Staff"
        SUPPORT = "SUPPORT", "Support Staff"
    
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=80, blank=True)
    last_name = models.CharField(max_length=80, blank=True)
    
    # User Status
    is_active = models.BooleanField(default=True, db_index=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False, db_index=True)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(default=timezone.now)
    
    # Legacy role field for backward compatibility
    role = models.CharField(max_length=12, choices=Role.choices, default=Role.SPECTATOR)
    
    # Profile Information
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    
    # Address Information
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default='Australia')
    
    # Profile Media
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    bio = models.TextField(blank=True, max_length=500)
    website = models.URLField(blank=True)
    
    # Social Media & Preferences
    social_media = models.JSONField(default=dict, blank=True)
    preferences = models.JSONField(default=dict, blank=True)
    
    # Stripe Integration
    stripe_customer_id = models.CharField(max_length=255, blank=True, db_index=True)
    
    # Timestamps - make these optional for existing data
    created_at = models.DateTimeField(auto_now_add=True, db_index=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    # Audit Fields - make these optional for existing data
    created_by = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='created_users'
    )
    updated_by = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='updated_users'
    )
    
    objects = UserManager()
    
    # Use email for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        db_table = 'accounts_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['is_active']),
            models.Index(fields=['email_verified']),
            models.Index(fields=['created_at']),
            models.Index(fields=['stripe_customer_id']),
        ]
    
    def __str__(self):
        return self.email
    
    def save(self, *args, **kwargs):
        """Override save to set timestamps for existing records"""
        if not self.created_at:
            self.created_at = timezone.now()
        super().save(*args, **kwargs)
    
    @property
    def full_name(self):
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def display_name(self):
        """Get user's display name (full name or email)"""
        return self.full_name if self.full_name else self.email
    
    @property
    def is_verified(self):
        """Check if user's email is verified"""
        return self.email_verified
    
    def verify_email(self):
        """Mark user's email as verified"""
        self.email_verified = True
        self.email_verified_at = timezone.now()
        self.save(update_fields=['email_verified', 'email_verified_at'])
    
    def primary_role_display(self):
        """Get the display label for the user's primary role.
        Uses legacy `role` field first; falls back to `UserRole` entries.
        """
        if self.role:
            # Use Django auto-generated display for the legacy choice field
            return self.get_role_display()
        primary_role = self.roles.filter(is_primary=True, is_active=True).first()
        if primary_role:
            return primary_role.get_display_name()
        return "User"


class UserRole(models.Model):
    """User role model for RBAC implementation"""
    
    class RoleType(models.TextChoices):
        ADMIN = "ADMIN", "Administrator"
        ORGANIZER = "ORGANIZER", "Event Organizer"
        ATHLETE = "ATHLETE", "Athlete"
        COACH = "COACH", "Coach"
        MANAGER = "MANAGER", "Team Manager"
        SPECTATOR = "SPECTATOR", "Spectator"
        VOLUNTEER = "VOLUNTEER", "Volunteer"
        REFEREE = "REFEREE", "Referee"
        MEDICAL = "MEDICAL", "Medical Staff"
        SUPPORT = "SUPPORT", "Support Staff"
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='roles')
    role_type = models.CharField(max_length=20, choices=RoleType.choices)
    is_primary = models.BooleanField(default=False, help_text="Primary role for this user")
    
    # Role-specific permissions
    can_manage_events = models.BooleanField(default=False)
    can_manage_teams = models.BooleanField(default=False)
    can_manage_users = models.BooleanField(default=False)
    can_manage_fixtures = models.BooleanField(default=False)
    can_manage_results = models.BooleanField(default=False)
    can_manage_payments = models.BooleanField(default=False)
    can_manage_content = models.BooleanField(default=False)
    can_view_reports = models.BooleanField(default=False)
    
    # Role context (e.g., specific event, team, or organization)
    context_type = models.CharField(max_length=50, blank=True, help_text="Type of context (event, team, organization)")
    context_id = models.PositiveIntegerField(null=True, blank=True, help_text="ID of the context object")
    
    # Role metadata
    assigned_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_roles'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'accounts_user_role'
        unique_together = [['user', 'role_type', 'context_type', 'context_id']]
        verbose_name = 'User Role'
        verbose_name_plural = 'User Roles'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['role_type', 'is_active']),
            models.Index(fields=['context_type', 'context_id']),
            models.Index(fields=['assigned_at']),
        ]
    
    def __str__(self):
        context = f" ({self.context_type}:{self.context_id})" if self.context_type and self.context_id else ""
        return f"{self.user.email} - {self.get_role_type_display()}{context}"
    
    def get_display_name(self):
        """Get role display name with context"""
        role_name = self.get_role_type_display()
        if self.context_type and self.context_id:
            return f"{role_name} ({self.context_type}:{self.context_id})"
        return role_name
    
    @property
    def is_expired(self):
        """Check if role has expired"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    def deactivate(self):
        """Deactivate this role"""
        self.is_active = False
        self.save(update_fields=['is_active', 'updated_at'])


class EmailVerificationToken(models.Model):
    """Email verification token model"""
    token = models.CharField(max_length=100, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verification_tokens')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'accounts_email_verification_token'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'is_used']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Email verification for {self.user.email}"
    
    @property
    def is_expired(self):
        """Check if token has expired"""
        return timezone.now() > self.expires_at
    
    def use_token(self):
        """Mark token as used"""
        self.is_used = True
        self.save(update_fields=['is_used'])


class PasswordResetToken(models.Model):
    """Password reset token model"""
    token = models.CharField(max_length=100, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'accounts_password_reset_token'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'is_used']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Password reset for {self.user.email}"
    
    @property
    def is_expired(self):
        """Check if token has expired"""
        return timezone.now() > self.expires_at
    
    def use_token(self):
        """Mark token as used"""
        self.is_used = True
        self.save(update_fields=['is_used'])


class AuditLog(models.Model):
    """Audit log for tracking sensitive operations"""
    
    class ActionType(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        LOGIN = "LOGIN", "Login"
        LOGOUT = "LOGOUT", "Logout"
        PASSWORD_CHANGE = "PASSWORD_CHANGE", "Password Change"
        ROLE_ASSIGNMENT = "ROLE_ASSIGNMENT", "Role Assignment"
        ROLE_REMOVAL = "ROLE_REMOVAL", "Role Removal"
        PERMISSION_CHANGE = "PERMISSION_CHANGE", "Permission Change"
        EMAIL_VERIFICATION = "EMAIL_VERIFICATION", "Email Verification"
        PAYMENT_PROCESSING = "PAYMENT_PROCESSING", "Payment Processing"
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=50, choices=ActionType.choices)
    resource_type = models.CharField(max_length=100, help_text="Type of resource being acted upon")
    resource_id = models.CharField(max_length=100, blank=True, help_text="ID of the resource")
    
    # Details
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'accounts_audit_log'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action', 'created_at']),
            models.Index(fields=['resource_type', 'resource_id']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.action} by {self.user.email if self.user else 'Anonymous'} at {self.created_at}"
    
    @classmethod
    def log_action(cls, user, action, resource_type, resource_id=None, details=None, ip_address=None, user_agent=None):
        """Log an audit action"""
        return cls.objects.create(
            user=user,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent
        )
