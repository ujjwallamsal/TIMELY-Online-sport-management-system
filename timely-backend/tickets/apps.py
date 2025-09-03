from django.apps import AppConfig


class TicketsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tickets'
    verbose_name = 'Ticketing System'
    
    def ready(self):
        """Import signals when app is ready"""
        try:
            import tickets.signals
        except ImportError:
            pass
