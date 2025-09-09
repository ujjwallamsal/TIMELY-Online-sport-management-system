# reports/apps.py
from django.apps import AppConfig


class ReportsConfig(AppConfig):
    """Reports app configuration"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'reports'
    verbose_name = 'Reports'
    
    def ready(self):
        """Import signals when app is ready"""
        try:
            import reports.signals
        except ImportError:
            pass