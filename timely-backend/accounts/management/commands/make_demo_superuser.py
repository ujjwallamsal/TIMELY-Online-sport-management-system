"""
Management command to create a demo superuser without prompts.
Useful for development and testing.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = "Create a demo superuser without prompts"
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            required=True,
            help='Email for the superuser',
        )
        parser.add_argument(
            '--password',
            type=str,
            required=True,
            help='Password for the superuser',
        )
        parser.add_argument(
            '--first-name',
            type=str,
            default='Admin',
            help='First name (default: Admin)',
        )
        parser.add_argument(
            '--last-name',
            type=str,
            default='User',
            help='Last name (default: User)',
        )
    
    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f"User with email '{email}' already exists")
            )
            return
        
        try:
            with transaction.atomic():
                # Create superuser
                user = User.objects.create_superuser(
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                )
                
                # Set additional fields
                user.is_active = True
                user.email_verified = True
                user.role = 'ADMIN'
                user.save()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Superuser '{email}' created successfully!\n"
                        f"Email: {email}\n"
                        f"Password: {password}\n"
                        f"Role: {user.role}"
                    )
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error creating superuser: {e}")
            )
            raise
