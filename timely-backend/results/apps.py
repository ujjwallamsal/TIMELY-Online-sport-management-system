from django.apps import AppConfig


class ResultsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'results'
    
    def ready(self):
        """Import signals when app is ready"""
        from . import signals  # noqa