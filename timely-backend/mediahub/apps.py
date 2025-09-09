from django.apps import AppConfig


class MediahubConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'mediahub'
    verbose_name = 'Media Hub'
    
    def ready(self):
        """Import signals when app is ready"""
        try:
            import mediahub.signals
        except ImportError:
            pass