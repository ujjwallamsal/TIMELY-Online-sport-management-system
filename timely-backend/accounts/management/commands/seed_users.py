import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed demo users with different roles'

    def handle(self, *args, **options):
        if os.environ.get("ALLOW_DEMO_SEED") != "1":
            self.stdout.write(self.style.WARNING("Skipping demo user seeding (set ALLOW_DEMO_SEED=1 to enable)."))
            return
        with transaction.atomic():
            # Create demo users if they don't exist
            users_data = [
                {
                    'email': 'admin@timely.local',
                    'password': 'admin123',
                    'first_name': 'Admin',
                    'last_name': 'User',
                    'role': User.Role.ADMIN,
                    'is_staff': True,
                    'is_superuser': True,
                    'email_verified': True
                },
                {
                    'email': 'organizer@timely.local',
                    'password': 'org123',
                    'first_name': 'Event',
                    'last_name': 'Organizer',
                    'role': User.Role.ORGANIZER,
                    'email_verified': True
                },
                {
                    'email': 'athlete@timely.local',
                    'password': 'ath123',
                    'first_name': 'John',
                    'last_name': 'Athlete',
                    'role': User.Role.ATHLETE,
                    'email_verified': True
                },
                {
                    'email': 'coach@timely.local',
                    'password': 'coach123',
                    'first_name': 'Sarah',
                    'last_name': 'Coach',
                    'role': User.Role.COACH,
                    'email_verified': True
                },
                {
                    'email': 'spectator@timely.local',
                    'password': 'spec123',
                    'first_name': 'Mike',
                    'last_name': 'Spectator',
                    'role': User.Role.SPECTATOR,
                    'email_verified': True
                }
            ]

            created_count = 0
            for user_data in users_data:
                user, created = User.objects.get_or_create(
                    email=user_data['email'],
                    defaults={
                        'first_name': user_data['first_name'],
                        'last_name': user_data['last_name'],
                        'role': user_data['role'],
                        'is_staff': user_data.get('is_staff', False),
                        'is_superuser': user_data.get('is_superuser', False),
                        'email_verified': user_data.get('email_verified', False)
                    }
                )
                
                if created:
                    user.set_password(user_data['password'])
                    user.save()
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Created user: {user.email} ({user.role})'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'User already exists: {user.email}'
                        )
                    )

            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully seeded {created_count} new users'
                )
            )
