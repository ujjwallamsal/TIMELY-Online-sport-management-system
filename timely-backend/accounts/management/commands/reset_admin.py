from __future__ import annotations

import os
from typing import Optional

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Safely reset superusers and seed roles; creates a fresh superuser from env or prompt."

    def add_arguments(self, parser):
        parser.add_argument("--email", dest="email", help="Superuser email (overrides env)")
        parser.add_argument("--password", dest="password", help="Superuser password (overrides env)")
        parser.add_argument("--first_name", dest="first_name", default="Admin")
        parser.add_argument("--last_name", dest="last_name", default="User")

    def handle(self, *args, **options):
        # 1) Ensure DB is migrated so missing tables don't explode later
        self.stdout.write("Running migrations...")
        call_command("migrate", interactive=False, verbosity=1)

        User = get_user_model()

        # 2) Demote then delete existing superusers
        with transaction.atomic():
            qs = User.objects.filter(is_superuser=True)
            count = qs.count()
            if count:
                self.stdout.write(self.style.WARNING(f"Demoting {count} superuser(s)..."))
                qs.update(is_superuser=False, is_staff=False)
                ids = list(qs.values_list("id", flat=True))
                self.stdout.write(self.style.WARNING(f"Deleting {len(ids)} demoted superuser(s)..."))
                User.objects.filter(id__in=ids).delete()

        # 3) Create a fresh superuser from env or args
        email: Optional[str] = options.get("email") or os.getenv("DJANGO_SUPERUSER_EMAIL")
        password: Optional[str] = options.get("password") or os.getenv("DJANGO_SUPERUSER_PASSWORD")

        if not email:
            email = input("Enter superuser email: ").strip()
        if not password:
            password = input("Enter superuser password: ").strip()

        first_name = options.get("first_name")
        last_name = options.get("last_name")

        with transaction.atomic():
            su = User.objects.create_superuser(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
            )
            # Legacy role field present; ensure ADMIN
            if hasattr(su, "role") and su.role != "ADMIN":
                su.role = "ADMIN"
                su.save(update_fields=["role"])

        # 4) Seed roles if using the UserRole model (no-op if not present)
        try:
            from accounts.models import UserRole
            self.stdout.write("Ensuring role seeds exist (choices-based, no global rows required)")
            # Nothing to insert globally; ensure the superuser has an admin role row if desired
            if hasattr(UserRole, "RoleType"):
                UserRole.objects.get_or_create(
                    user=su,
                    role_type=UserRole.RoleType.ADMIN,
                    defaults={"is_primary": True, "assigned_by": su},
                )
        except Exception:
            # If roles app/relations differ, skip silently
            pass

        self.stdout.write(self.style.SUCCESS(f"Created superuser: email={email}"))


