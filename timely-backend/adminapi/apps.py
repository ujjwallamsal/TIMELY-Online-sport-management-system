from django.apps import AppConfig


class AdminapiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'adminapi'
    verbose_name = 'Admin API'
    
    def ready(self):
        """Initialize adminapi app"""
        pass