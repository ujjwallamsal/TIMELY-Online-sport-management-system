from django.apps import AppConfig


class TimelyConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'timely'

    def ready(self):
        """Configure admin branding after apps are loaded"""
        try:
            from django.contrib import admin
            admin.site.site_header = "Timely Sports Management Admin"
            admin.site.site_title = "Timely Admin"
            admin.site.index_title = "Welcome to Timely Sports Management"
        except Exception:
            # Ignore errors during startup
            pass
