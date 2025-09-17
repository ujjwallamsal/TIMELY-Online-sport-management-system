# fixtures/apps.py
from django.apps import AppConfig


class FixturesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'fixtures'
    verbose_name = 'Fixtures'

    def ready(self):
        """Import signals when app is ready"""
        # import fixtures.signals  # Temporarily commented out for migration
        pass