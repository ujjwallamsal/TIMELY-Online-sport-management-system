# content/apps.py
from django.apps import AppConfig

class ContentConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "content"
    verbose_name = "Content Management"
    
    def ready(self):
        """Import signals when app is ready."""
        import content.signals