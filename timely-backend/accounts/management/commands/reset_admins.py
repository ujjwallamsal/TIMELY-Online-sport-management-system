from __future__ import annotations

import os
from typing import Optional

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Safely demote or delete all admins/superusers and create a fresh superuser in one step."

    def add_arguments(self, parser):
        parser.add_argument(
            "--mode", 
            choices=["demote", "delete"], 
            default="demote",
            help="Mode: 'demote' (safer) or 'delete' (removes users completely). Default: demote"
        )
        parser.add_argument(
            "--create-email", 
            dest="create_email", 
            help="Email for new superuser (overrides env DJANGO_SUPERUSER_EMAIL)"
        )
        parser.add_argument(
            "--create-username", 
            dest="create_username", 
            default="admin",
            help="Username for new superuser. Default: admin"
        )
        parser.add_argument(
            "--create-password", 
            dest="create_password", 
            help="Password for new superuser (overrides env DJANGO_SUPERUSER_PASSWORD)"
        )

    def handle(self, *args, **options):
        mode = options.get("mode", "demote")
        create_email = options.get("create_email") or os.getenv("DJANGO_SUPERUSER_EMAIL")
        create_username = options.get("create_username", "admin")
        create_password = options.get("create_password") or os.getenv("DJANGO_SUPERUSER_PASSWORD")

        # 1) Ensure DB is migrated
        self.stdout.write("Running migrations...")
        call_command("migrate", interactive=False, verbosity=1)

        User = get_user_model()

        # 2) Handle existing superusers and staff
        with transaction.atomic():
            # Count affected users
            superusers_qs = User.objects.filter(is_superuser=True)
            staff_qs = User.objects.filter(is_staff=True, is_superuser=False)
            
            superuser_count = superusers_qs.count()
            staff_count = staff_qs.count()
            
            self.stdout.write(f"Found {superuser_count} superuser(s) and {staff_count} staff user(s)")

            if mode == "demote":
                # Demote superusers and staff to regular users
                if superuser_count > 0:
                    self.stdout.write(self.style.WARNING(f"Demoting {superuser_count} superuser(s)..."))
                    superusers_qs.update(is_superuser=False, is_staff=False)
                
                if staff_count > 0:
                    self.stdout.write(self.style.WARNING(f"Demoting {staff_count} staff user(s)..."))
                    staff_qs.update(is_staff=False)
                    
                self.stdout.write(self.style.SUCCESS(f"Demoted {superuser_count + staff_count} admin user(s)"))
                
            elif mode == "delete":
                # Delete superusers and staff completely
                if superuser_count > 0:
                    self.stdout.write(self.style.WARNING(f"Deleting {superuser_count} superuser(s)..."))
                    superusers_qs.delete()
                
                if staff_count > 0:
                    self.stdout.write(self.style.WARNING(f"Deleting {staff_count} staff user(s)..."))
                    staff_qs.delete()
                    
                self.stdout.write(self.style.SUCCESS(f"Deleted {superuser_count + staff_count} admin user(s)"))

        # 3) Get credentials for new superuser
        if not create_email:
            create_email = input("Enter superuser email: ").strip()
        if not create_password:
            create_password = input("Enter superuser password: ").strip()

        # 4) Create new superuser
        with transaction.atomic():
            try:
                # Check if user already exists
                existing_user = User.objects.filter(email=create_email).first()
                if existing_user:
                    self.stdout.write(self.style.WARNING(f"User with email {create_email} already exists. Updating to superuser..."))
                    existing_user.is_superuser = True
                    existing_user.is_staff = True
                    existing_user.username = create_username
                    existing_user.set_password(create_password)
                    existing_user.save()
                    new_superuser = existing_user
                else:
                    new_superuser = User.objects.create_superuser(
                        email=create_email,
                        username=create_username,
                        password=create_password,
                        first_name="Admin",
                        last_name="User",
                    )

                # Ensure ADMIN role if using role system
                if hasattr(new_superuser, "role") and new_superuser.role != "ADMIN":
                    new_superuser.role = "ADMIN"
                    new_superuser.save(update_fields=["role"])

                # Create UserRole if using role system
                try:
                    from accounts.models import UserRole
                    if hasattr(UserRole, "RoleType"):
                        UserRole.objects.get_or_create(
                            user=new_superuser,
                            role_type=UserRole.RoleType.ADMIN,
                            defaults={"is_primary": True, "assigned_by": new_superuser},
                        )
                except Exception:
                    # If roles app/relations differ, skip silently
                    pass

                self.stdout.write(self.style.SUCCESS(f"Created/updated superuser: {create_email} (username: {create_username})"))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed to create superuser: {str(e)}"))
                return

        # 5) Summary
        self.stdout.write("\n" + "="*50)
        self.stdout.write("RESET ADMINS SUMMARY")
        self.stdout.write("="*50)
        self.stdout.write(f"Mode: {mode}")
        self.stdout.write(f"Superusers affected: {superuser_count}")
        self.stdout.write(f"Staff users affected: {staff_count}")
        self.stdout.write(f"New superuser: {create_email}")
        self.stdout.write(f"New username: {create_username}")
        self.stdout.write("="*50)
