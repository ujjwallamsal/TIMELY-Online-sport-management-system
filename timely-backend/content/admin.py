# content/admin.py
from django.contrib import admin
from .models import Page, News, Banner, Announcement


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "published", "publish_at", "created_at")
    list_filter = ("published", "publish_at")
    search_fields = ("title", "body", "seo_title", "seo_description")
    prepopulated_fields = {"slug": ("title",)}
    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'body')
        }),
        ('Publishing', {
            'fields': ('published', 'publish_at'),
            'classes': ('collapse',)
        }),
        ('SEO', {
            'fields': ('seo_title', 'seo_description'),
            'classes': ('collapse',)
        }),
    )


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ("title", "published", "publish_at", "author", "created_at")
    list_filter = ("published", "publish_at", "author")
    search_fields = ("title", "body", "seo_title", "seo_description")
    fieldsets = (
        (None, {
            'fields': ('title', 'body', 'author')
        }),
        ('Publishing', {
            'fields': ('published', 'publish_at'),
            'classes': ('collapse',)
        }),
        ('SEO', {
            'fields': ('seo_title', 'seo_description'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("title", "active", "starts_at", "ends_at", "created_at")
    list_filter = ("active", "starts_at", "ends_at")
    search_fields = ("title",)
    fieldsets = (
        (None, {
            'fields': ('title', 'image', 'link_url')
        }),
        ('Scheduling', {
            'fields': ('active', 'starts_at', 'ends_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "is_published", "created_at", "author")
    list_filter = ("is_published", "author")
    search_fields = ("title", "body")
    prepopulated_fields = {"slug": ("title",)}
