# registrations/apps.py
from django.apps import AppConfig

class RegistrationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "registrations"

    def ready(self):
        from . import signals  # noqa: F401
