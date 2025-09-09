# cms/apps.py
from django.apps import AppConfig


class CmsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cms'
    verbose_name = 'Content Management System'
    
    def ready(self):
        """Import signals when app is ready."""
        try:
            import cms.signals
        except ImportError:
            pass