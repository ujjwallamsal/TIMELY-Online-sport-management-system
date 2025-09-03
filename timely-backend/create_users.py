from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test users for development'

    def handle(self, *args, **options):
        # Create admin user
        admin_user, created = User.objects.get_or_create(
            email='admin@gmail.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'User',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'email_verified': True
            }
        )
        if created:
            admin_user.set_password('Ujjwal@@123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Created admin user: {admin_user.email}'))
        else:
            self.stdout.write(f'ℹ️  Admin user already exists: {admin_user.email}')

        # Create coach user
        coach_user, created = User.objects.get_or_create(
            email='coach@gmail.com',
            defaults={
                'first_name': 'Coach',
                'last_name': 'User',
                'role': User.Role.COACH,
                'email_verified': True
            }
        )
        if created:
            coach_user.set_password('Ujjwal@@123')
            coach_user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Created coach user: {coach_user.email}'))
        else:
            self.stdout.write(f'ℹ️  Coach user already exists: {coach_user.email}')

        # Create athlete user
        athlete_user, created = User.objects.get_or_create(
            email='athlete@gmail.com',
            defaults={
                'first_name': 'Athlete',
                'last_name': 'User',
                'role': User.Role.ATHLETE,
                'email_verified': True
            }
        )
        if created:
            athlete_user.set_password('Ujjwal@@123')
            athlete_user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Created athlete user: {athlete_user.email}'))
        else:
            self.stdout.write(f'ℹ️  Athlete user already exists: {athlete_user.email}')

        # Create spectator user
        spectator_user, created = User.objects.get_or_create(
            email='spectator@gmail.com',
            defaults={
                'first_name': 'Spectator',
                'last_name': 'User',
                'role': User.Role.SPECTATOR,
                'email_verified': True
            }
        )
        if created:
            spectator_user.set_password('Ujjwal@@123')
            spectator_user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Created spectator user: {spectator_user.email}'))
        else:
            self.stdout.write(f'ℹ️  Spectator user already exists: {spectator_user.email}')

        self.stdout.write(self.style.SUCCESS('\n🎯 Test Users Available:'))
        self.stdout.write('Admin: admin@gmail.com / Ujjwal@@123')
        self.stdout.write('Coach: coach@gmail.com / Ujjwal@@123')
        self.stdout.write('Athlete: athlete@gmail.com / Ujjwal@@123')
        self.stdout.write('Spectator: spectator@gmail.com / Ujjwal@@123')
