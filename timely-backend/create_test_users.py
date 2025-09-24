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
            'role': User.Roles.ADMIN,
            'is_staff': True,
            'is_superuser': True,
            'email_verified': True
        }
    )
    if created or not admin_user.check_password('Ujjwal@@123'):
        admin_user.set_password('Ujjwal@@123')
        admin_user.save()
        action = "Created" if created else "Updated password for"
        print(f"✅ {action} admin user: {admin_user.email}")
    else:
        print(f"ℹ️  Admin user already exists with expected password: {admin_user.email}")

    # Create coach user
    coach_user, created = User.objects.get_or_create(
        email='coach@gmail.com',
        defaults={
            'first_name': 'Coach',
            'last_name': 'User',
            'role': User.Roles.COACH,
            'email_verified': True
        }
    )
    if created or not coach_user.check_password('Ujjwal@@123'):
        coach_user.set_password('Ujjwal@@123')
        coach_user.save()
        action = "Created" if created else "Updated password for"
        print(f"✅ {action} coach user: {coach_user.email}")
    else:
        print(f"ℹ️  Coach user already exists with expected password: {coach_user.email}")

    # Create athlete user
    athlete_user, created = User.objects.get_or_create(
        email='athlete@gmail.com',
        defaults={
            'first_name': 'Athlete',
            'last_name': 'User',
            'role': User.Roles.ATHLETE,
            'email_verified': True
        }
    )
    if created or not athlete_user.check_password('Ujjwal@@123'):
        athlete_user.set_password('Ujjwal@@123')
        athlete_user.save()
        action = "Created" if created else "Updated password for"
        print(f"✅ {action} athlete user: {athlete_user.email}")
    else:
        print(f"ℹ️  Athlete user already exists with expected password: {athlete_user.email}")

    # Create spectator user
    spectator_user, created = User.objects.get_or_create(
        email='spectator@gmail.com',
        defaults={
            'first_name': 'Spectator',
            'last_name': 'User',
            'role': User.Roles.SPECTATOR,
            'email_verified': True
        }
    )
    if created or not spectator_user.check_password('Ujjwal@@123'):
        spectator_user.set_password('Ujjwal@@123')
        spectator_user.save()
        action = "Created" if created else "Updated password for"
        print(f"✅ {action} spectator user: {spectator_user.email}")
    else:
        print(f"ℹ️  Spectator user already exists with expected password: {spectator_user.email}")

    print("\n🎯 Test Users Created:")
    print("Admin: admin@gmail.com / Ujjwal@@123")
    print("Coach: coach@gmail.com / Ujjwal@@123")
    print("Athlete: athlete@gmail.com / Ujjwal@@123")
    print("Spectator: spectator@gmail.com / Ujjwal@@123")

if __name__ == '__main__':
    create_test_users()
