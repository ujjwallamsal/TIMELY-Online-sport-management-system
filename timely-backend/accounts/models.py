# accounts/models.py
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("role", User.Role.ADMIN)
        # superusers should be verified by default
        extra.setdefault("email_verified", True)
        return self.create_user(email, password, **extra)

class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ATHLETE = "ATHLETE", "Athlete"
        COACH = "COACH", "Coach"
        SPECTATOR = "SPECTATOR", "Spectator"
        ORGANIZER = "ORGANIZER", "Organizer"
        ADMIN = "ADMIN", "Admin"

    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=80, blank=True)
    last_name = models.CharField(max_length=80, blank=True)
    role = models.CharField(max_length=12, choices=Role.choices, default=Role.SPECTATOR)

    # verification fields
    email_verified = models.BooleanField(default=False)  # ← ADD THIS
    email_token = models.CharField(max_length=64, blank=True, null=True, db_index=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
