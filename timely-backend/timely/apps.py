from django.apps import AppConfig


class TimelyConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'timely'

    def ready(self):
        """Configure app after apps are loaded"""
        from django.contrib import admin
        admin.site.site_header = "Timely Sports Management"
        admin.site.site_title = "Timely Admin"
        admin.site.index_title = "Administration"
