# sports/admin.py
from django.contrib import admin
from .models import Sport


@admin.register(Sport)
class SportAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    ordering = ['name']