# content/admin.py
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils.html import format_html
from django.urls import reverse
from django.contrib import messages
from .models import Page, News, Banner, Announcement, FooterLink, SocialProfile
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


@admin.register(FooterLink)
class FooterLinkAdmin(admin.ModelAdmin):
    """Enhanced admin for Footer Links management"""
    list_display = [
        'title', 'section_badge', 'link_type_badge', 'url_preview', 
        'sort_order', 'is_active_badge', 'created_at'
    ]
    list_filter = ['section', 'link_type', 'is_active', 'created_at']
    search_fields = ['title', 'url']
    ordering = ['section', 'sort_order', 'title']
    actions = ['activate_links', 'deactivate_links', 'export_footer_links']
    
    fieldsets = (
        ('Link Information', {
            'fields': ('title', 'url', 'link_type', 'section')
        }),
        ('Display Settings', {
            'fields': ('sort_order', 'is_active', 'opens_in_new_tab')
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def section_badge(self, obj):
        """Display section with color coding"""
        colors = {
            'help': 'blue',
            'legal': 'red',
            'company': 'green',
            'contact': 'orange',
            'social': 'purple'
        }
        color = colors.get(obj.section, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_section_display()
        )
    section_badge.short_description = 'Section'
    
    def link_type_badge(self, obj):
        """Display link type with badge"""
        colors = {
            'internal': 'green',
            'external': 'blue',
            'email': 'orange',
            'phone': 'purple'
        }
        color = colors.get(obj.link_type, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_link_type_display()
        )
    link_type_badge.short_description = 'Type'
    
    def url_preview(self, obj):
        """Display URL with truncation"""
        if obj.url:
            truncated = obj.url[:50] + '...' if len(obj.url) > 50 else obj.url
            return format_html('<code>{}</code>', truncated)
        return 'No URL'
    url_preview.short_description = 'URL'
    
    def is_active_badge(self, obj):
        """Display active status"""
        if obj.is_active:
            return format_html('<span style="color: green;">✅ Active</span>')
        else:
            return format_html('<span style="color: red;">❌ Inactive</span>')
    is_active_badge.short_description = 'Status'
    
    def activate_links(self, request, queryset):
        """Activate selected links"""
        updated = queryset.update(is_active=True)
        self.message_user(
            request,
            f'Activated {updated} footer links.',
            level=messages.SUCCESS
        )
    activate_links.short_description = "Activate selected links"
    
    def deactivate_links(self, request, queryset):
        """Deactivate selected links"""
        updated = queryset.update(is_active=False)
        self.message_user(
            request,
            f'Deactivated {updated} footer links.',
            level=messages.SUCCESS
        )
    deactivate_links.short_description = "Deactivate selected links"
    
    def export_footer_links(self, request, queryset):
        """Export footer links to CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="footer_links.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Title', 'Section', 'Link Type', 'URL', 'Sort Order', 'Active', 'Opens in New Tab'
        ])
        
        for link in queryset:
            writer.writerow([
                link.title,
                link.get_section_display(),
                link.get_link_type_display(),
                link.url,
                link.sort_order,
                'Yes' if link.is_active else 'No',
                'Yes' if link.opens_in_new_tab else 'No'
            ])
        
        return response
    export_footer_links.short_description = "Export footer links to CSV"


@admin.register(SocialProfile)
class SocialProfileAdmin(admin.ModelAdmin):
    """Enhanced admin for Social Profiles management"""
    list_display = [
        'platform_badge', 'username_display', 'url_preview', 
        'sort_order', 'is_active_badge', 'created_at'
    ]
    list_filter = ['platform', 'is_active', 'created_at']
    search_fields = ['platform', 'username', 'url', 'display_name']
    ordering = ['sort_order', 'platform']
    actions = ['activate_profiles', 'deactivate_profiles', 'export_social_profiles']
    
    fieldsets = (
        ('Profile Information', {
            'fields': ('platform', 'url', 'username', 'display_name')
        }),
        ('Display Settings', {
            'fields': ('sort_order', 'is_active', 'icon_class', 'color')
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def platform_badge(self, obj):
        """Display platform with color coding"""
        color = obj.get_color()
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_platform_display()
        )
    platform_badge.short_description = 'Platform'
    
    def username_display(self, obj):
        """Display username with @ symbol"""
        if obj.username:
            return f"@{obj.username}"
        return 'No username'
    username_display.short_description = 'Username'
    
    def url_preview(self, obj):
        """Display URL with truncation"""
        if obj.url:
            truncated = obj.url[:40] + '...' if len(obj.url) > 40 else obj.url
            return format_html('<code>{}</code>', truncated)
        return 'No URL'
    url_preview.short_description = 'URL'
    
    def is_active_badge(self, obj):
        """Display active status"""
        if obj.is_active:
            return format_html('<span style="color: green;">✅ Active</span>')
        else:
            return format_html('<span style="color: red;">❌ Inactive</span>')
    is_active_badge.short_description = 'Status'
    
    def activate_profiles(self, request, queryset):
        """Activate selected profiles"""
        updated = queryset.update(is_active=True)
        self.message_user(
            request,
            f'Activated {updated} social profiles.',
            level=messages.SUCCESS
        )
    activate_profiles.short_description = "Activate selected profiles"
    
    def deactivate_profiles(self, request, queryset):
        """Deactivate selected profiles"""
        updated = queryset.update(is_active=False)
        self.message_user(
            request,
            f'Deactivated {updated} social profiles.',
            level=messages.SUCCESS
        )
    deactivate_profiles.short_description = "Deactivate selected profiles"
    
    def export_social_profiles(self, request, queryset):
        """Export social profiles to CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="social_profiles.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Platform', 'Username', 'URL', 'Display Name', 'Sort Order', 'Active', 'Icon Class', 'Color'
        ])
        
        for profile in queryset:
            writer.writerow([
                profile.get_platform_display(),
                profile.username,
                profile.url,
                profile.display_name,
                profile.sort_order,
                'Yes' if profile.is_active else 'No',
                profile.icon_class,
                profile.color
            ])
        
        return response
    export_social_profiles.short_description = "Export social profiles to CSV"
