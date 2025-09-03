"""
Management command to create a test user for development/testing.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Create a test user for development/testing"
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='test@example.com',
            help='Email for the test user',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='testpass123',
            help='Password for the test user',
        )
        parser.add_argument(
            '--role',
            type=str,
            default='SPECTATOR',
            help='Role for the test user',
        )
    
    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        role = options['role']
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f"User with email '{email}' already exists")
            )
            return
        
        try:
            # Create user
            user = User.objects.create_user(
                email=email,
                password=password,
                first_name='Test',
                last_name='User',
                role=role,
                email_verified=True
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f"Test user created successfully!\n"
                    f"Email: {email}\n"
                    f"Password: {password}\n"
                    f"Role: {user.role}\n"
                    f"Username: {user.username}"
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error creating test user: {e}")
            )
            raise
