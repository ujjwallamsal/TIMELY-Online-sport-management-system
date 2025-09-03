from django.apps import AppConfig
from django.db import connection
from django.core.management import call_command


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'
    
    def ready(self):
        """Post-migrate signal to verify accounts.User table exists"""
        try:
            # Only run in production or when explicitly called
            if not self.apps.is_installed('django.contrib.admin'):
                return
                
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'accounts_user'
                    );
                """)
                table_exists = cursor.fetchone()[0]
                
                if not table_exists:
                    print("WARNING: accounts_user table does not exist!")
                    print("This indicates a migration issue.")
                    print("Run: python manage.py migrate accounts")
                else:
                    print("✓ accounts_user table exists")
                    
        except Exception as e:
            print(f"Error checking accounts_user table: {e}")
