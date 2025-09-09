"""
Audit app configuration
"""
from django.apps import AppConfig


class AuditConfig(AppConfig):
    """Configuration for the audit app"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'audit'
    verbose_name = 'Audit Logging'
    
    def ready(self):
        """Initialize audit app when Django starts"""
        # Import signal handlers here to avoid circular imports
        pass
