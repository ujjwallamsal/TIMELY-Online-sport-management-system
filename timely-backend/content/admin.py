# content/admin.py
from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Page, News, Banner, Announcement
from notifications.services.notification_service import NotificationService


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
    list_display = ("title", "author", "is_published", "publish_at", "created_at")
    list_filter = ("is_published", "publish_at", "author")
    search_fields = ("title", "slug", "body", "seo_title", "seo_description")
    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'excerpt', 'body', 'image', 'author')
        }),
        ('Publishing', {
            'fields': ('is_published', 'publish_at')
        }),
        ('SEO', {
            'fields': ('seo_title', 'seo_description'),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        return bool(request.user and request.user.is_superuser)

    def has_change_permission(self, request, obj=None):
        return bool(request.user and request.user.is_superuser)

    def has_delete_permission(self, request, obj=None):
        return bool(request.user and request.user.is_superuser)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # Notify staff when admin updates news
        if request.user and request.user.is_superuser:
            User = get_user_model()
            staff_users = User.objects.filter(is_staff=True)
            title = "Admin updated news" if change else "Admin created news"
            message = f"{obj.title}"
            for u in staff_users:
                NotificationService.send_notification(
                    user=u,
                    title=title,
                    message=message,
                    notification_type='announcement',
                    topic='system',
                    link_url=f"/news/{obj.slug}"
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
