from django.apps import AppConfig


class EventsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'events'
    verbose_name = 'Events Management'
    
    def ready(self):
        """Import signals when app is ready"""
        import events.signals