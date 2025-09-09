# content/apps.py
from django.apps import AppConfig

class ContentConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "content"
    
    def ready(self):
        """Import signals when app is ready."""
        import content.signals