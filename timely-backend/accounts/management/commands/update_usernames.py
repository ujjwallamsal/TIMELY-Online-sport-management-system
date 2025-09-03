"""
Management command to update existing users with usernames.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Update existing users with usernames generated from their emails"
    
    def handle(self, *args, **options):
        users_updated = 0
        
        for user in User.objects.filter(username__isnull=True):
            # Generate username from email
            username = user.email.split('@')[0]
            
            # Ensure username is unique
            counter = 1
            original_username = username
            while User.objects.filter(username=username).exclude(id=user.id).exists():
                username = f"{original_username}{counter}"
                counter += 1
            
            user.username = username
            user.save(update_fields=['username'])
            users_updated += 1
            
            self.stdout.write(
                self.style.SUCCESS(
                    f"Updated user {user.email} with username: {username}"
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Updated {users_updated} users with usernames"
            )
        )
