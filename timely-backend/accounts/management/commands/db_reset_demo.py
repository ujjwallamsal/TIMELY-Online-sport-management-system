"""
Management command to reset the database for development.
WARNING: This will drop and recreate the database!
Only use in development environment.
"""

import os
import sys
from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings


class Command(BaseCommand):
    help = "Reset database for development (drops and recreates DB)"
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Skip confirmation prompt',
        )
    
    def handle(self, *args, **options):
        # Safety check
        if not settings.DEBUG:
            self.stdout.write(
                self.style.ERROR(
                    "This command can only run in DEBUG mode!"
                )
            )
            sys.exit(1)
        
        # Check environment variable
        if not os.environ.get('ALLOW_DB_DROP'):
            self.stdout.write(
                self.style.WARNING(
                    "Set ALLOW_DB_DROP=1 to allow database dropping"
                )
            )
            self.stdout.write(
                self.style.WARNING(
                    "Or use: dropdb timely_db && createdb timely_db"
                )
            )
            sys.exit(1)
        
        db_name = settings.DATABASES['default']['NAME']
        db_user = settings.DATABASES['default']['USER']
        db_host = settings.DATABASES['default']['HOST']
        db_port = settings.DATABASES['default']['PORT']
        
        self.stdout.write(
            self.style.WARNING(
                f"About to DROP database '{db_name}' on {db_host}:{db_port}"
            )
        )
        
        if not options['force']:
            confirm = input("Type 'YES' to confirm: ")
            if confirm != 'YES':
                self.stdout.write("Operation cancelled.")
                return
        
        try:
            # Connect to postgres database to drop/recreate
            with connection.cursor() as cursor:
                # Terminate connections to the target database
                cursor.execute(f"""
                    SELECT pg_terminate_backend(pid)
                    FROM pg_stat_activity
                    WHERE datname = '{db_name}'
                    AND pid <> pg_backend_pid();
                """)
                
                # Drop database
                cursor.execute(f'DROP DATABASE IF EXISTS "{db_name}";')
                self.stdout.write(
                    self.style.SUCCESS(f"Database '{db_name}' dropped")
                )
                
                # Create database
                cursor.execute(f'CREATE DATABASE "{db_name}";')
                self.stdout.write(
                    self.style.SUCCESS(f"Database '{db_name}' created")
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error: {e}")
            )
            self.stdout.write(
                self.style.WARNING(
                    "Try manual commands:\n"
                    f"dropdb {db_name}\n"
                    f"createdb {db_name}"
                )
            )
            sys.exit(1)
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Database '{db_name}' reset successfully!\n"
                "Now run:\n"
                "python manage.py makemigrations accounts\n"
                "python manage.py makemigrations\n"
                "python manage.py migrate"
            )
        )
