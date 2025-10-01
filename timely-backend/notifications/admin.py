# notifications/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from django.db.models import Count
from .models import (
    Notification, DeliveryAttempt, MessageThread, MessageParticipant, 
    Message, NotificationUnread, NotificationTemplate, Broadcast
)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin configuration for Notification model"""
    list_display = [
        'title', 'user_email', 'kind', 'topic', 'is_read', 'created_at'
    ]
    list_filter = [
        'kind', 'topic', 'read_at', 'created_at'
    ]
    search_fields = ['title', 'body', 'user__email']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at']
    
    fieldsets = (
        (None, {
            'fields': ('user', 'title', 'body', 'kind', 'topic')
        }),
        ('Delivery', {
            'fields': ('link_url', 'delivered_email', 'delivered_sms'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('read_at',)
        }),
        ('Audit', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_email(self, obj):
        """Display user email with link"""
        url = reverse('admin:accounts_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_email.short_description = 'User'
    
    def is_read(self, obj):
        """Display read status with color"""
        if obj.read_at:
            return format_html('<span style="color: green;">✓ Read</span>')
        return format_html('<span style="color: red;">● Unread</span>')
    is_read.short_description = 'Status'


@admin.register(NotificationUnread)
class NotificationUnreadAdmin(admin.ModelAdmin):
    """Admin configuration for NotificationUnread model"""
    list_display = [
        'user_email', 'count', 'last_updated'
    ]
    list_filter = ['last_updated']
    search_fields = ['user__email']
    ordering = ['-count', '-last_updated']
    readonly_fields = ['last_updated']
    actions = ['recalculate_counts']
    
    def user_email(self, obj):
        """Display user email with link"""
        url = reverse('admin:accounts_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_email.short_description = 'User'
    
    def recalculate_counts(self, request, queryset):
        """Recalculate unread counts for selected users"""
        updated = 0
        for unread in queryset:
            NotificationUnread.update_count_for_user(unread.user)
            updated += 1
        
        self.message_user(
            request,
            f"Recalculated unread counts for {updated} user(s)."
        )
    recalculate_counts.short_description = "Recalculate selected counts"


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    """Admin configuration for NotificationTemplate model"""
    list_display = [
        'name', 'template_type', 'is_active', 'created_at'
    ]
    list_filter = ['template_type', 'is_active', 'created_at']
    search_fields = ['name', 'subject_template', 'body_template']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('name', 'template_type', 'is_active')
        }),
        ('Templates', {
            'fields': ('subject_template', 'body_template')
        }),
        ('Variables', {
            'fields': ('variables',),
            'description': 'List of available template variables'
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Broadcast)
class BroadcastAdmin(admin.ModelAdmin):
    """Admin configuration for Broadcast model"""
    list_display = [
        'title', 'target_type', 'status', 'total_recipients', 'sent_count', 'created_at'
    ]
    list_filter = [
        'status', 'target_type', 'created_at', 'scheduled_at'
    ]
    search_fields = ['title', 'message', 'created_by__email']
    ordering = ['-created_at']
    readonly_fields = [
        'total_recipients', 'sent_count', 'failed_count', 'sent_at', 'created_at'
    ]
    
    fieldsets = (
        (None, {
            'fields': ('title', 'message', 'created_by')
        }),
        ('Targeting', {
            'fields': ('target_type', 'target_criteria')
        }),
        ('Scheduling', {
            'fields': ('status', 'scheduled_at')
        }),
        ('Statistics', {
            'fields': ('total_recipients', 'sent_count', 'failed_count', 'sent_at'),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """Set created_by if not set"""
        if not change:  # New broadcast
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(MessageThread)
class MessageThreadAdmin(admin.ModelAdmin):
    """Admin configuration for MessageThread model"""
    list_display = [
        'title', 'scope', 'scope_id', 'participant_count', 'created_at'
    ]
    list_filter = ['scope', 'created_at']
    search_fields = ['title', 'created_by__email']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at']
    
    def participant_count(self, obj):
        """Display participant count"""
        return obj.participants.count()
    participant_count.short_description = 'Participants'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Admin configuration for Message model"""
    list_display = [
        'sender_email', 'thread', 'body_preview', 'created_at', 'is_deleted'
    ]
    list_filter = ['created_at', 'deleted_at', 'thread__scope']
    search_fields = ['body', 'sender__email', 'thread__title']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'edited_at', 'deleted_at']
    
    fieldsets = (
        (None, {
            'fields': ('thread', 'sender', 'body')
        }),
        ('Status', {
            'fields': ('edited_at', 'deleted_at')
        }),
        ('Audit', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    def sender_email(self, obj):
        """Display sender email with link"""
        url = reverse('admin:accounts_user_change', args=[obj.sender.id])
        return format_html('<a href="{}">{}</a>', url, obj.sender.email)
    sender_email.short_description = 'Sender'
    
    def body_preview(self, obj):
        """Display body preview"""
        if len(obj.body) > 50:
            return obj.body[:50] + '...'
        return obj.body
    body_preview.short_description = 'Message'
    
    def is_deleted(self, obj):
        """Display deletion status"""
        if obj.deleted_at:
            return format_html('<span style="color: red;">Deleted</span>')
        return format_html('<span style="color: green;">Active</span>')
    is_deleted.short_description = 'Status'


@admin.register(DeliveryAttempt)
class DeliveryAttemptAdmin(admin.ModelAdmin):
    """Admin configuration for DeliveryAttempt model"""
    list_display = [
        'notification_title', 'channel', 'status', 'created_at'
    ]
    list_filter = ['channel', 'status', 'created_at']
    search_fields = ['notification__title', 'provider_ref']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at']
    
    def notification_title(self, obj):
        """Display notification title with link"""
        url = reverse('admin:notifications_notification_change', args=[obj.notification.id])
        return format_html('<a href="{}">{}</a>', url, obj.notification.title)
    notification_title.short_description = 'Notification'


# Inline admin for MessageParticipant
class MessageParticipantInline(admin.TabularInline):
    """Inline admin for MessageParticipant"""
    model = MessageParticipant
    extra = 0
    readonly_fields = ['joined_at']


# Add inline to MessageThread
MessageThreadAdmin.inlines = [MessageParticipantInline]