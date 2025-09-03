#!/usr/bin/env python
"""
Script to create test users for development/testing
Run with: python manage.py shell < create_test_users.py
"""

from accounts.models import User

def create_test_users():
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
        print(f"✅ Created admin user: {admin_user.email}")
    else:
        print(f"ℹ️  Admin user already exists: {admin_user.email}")

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
        print(f"✅ Created coach user: {coach_user.email}")
    else:
        print(f"ℹ️  Coach user already exists: {coach_user.email}")

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
        print(f"✅ Created athlete user: {athlete_user.email}")
    else:
        print(f"ℹ️  Athlete user already exists: {athlete_user.email}")

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
        print(f"✅ Created spectator user: {spectator_user.email}")
    else:
        print(f"ℹ️  Spectator user already exists: {spectator_user.email}")

    print("\n🎯 Test Users Created:")
    print("Admin: admin@gmail.com / Ujjwal@@123")
    print("Coach: coach@gmail.com / Ujjwal@@123")
    print("Athlete: athlete@gmail.com / Ujjwal@@123")
    print("Spectator: spectator@gmail.com / Ujjwal@@123")

if __name__ == '__main__':
    create_test_users()
