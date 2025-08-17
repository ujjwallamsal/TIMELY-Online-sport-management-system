# content/admin.py
from django.contrib import admin
from .models import Page, Announcement


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "is_published", "created_at")
    list_filter = ("is_published",)
    search_fields = ("title", "body")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "is_published", "created_at", "author")
    list_filter = ("is_published", "author")
    search_fields = ("title", "body")
    prepopulated_fields = {"slug": ("title",)}
