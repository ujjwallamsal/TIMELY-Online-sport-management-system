from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import AuditLog, SystemSettings, DeletionRequest


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Admin configuration for AuditLog model"""
    list_display = [
        'action', 'actor_email', 'target_description', 'ip_address',
        'timestamp', 'details_preview'
    ]
    list_filter = [
        'action', 'target_type', 'timestamp'
    ]
    search_fields = ['actor__email', 'target_description', 'action']
    ordering = ['-timestamp']
    readonly_fields = [
        'actor', 'action', 'target_type', 'target_id', 'target_description',
        'details', 'ip_address', 'user_agent', 'timestamp'
    ]
    
    fieldsets = (
        (None, {
            'fields': ('actor', 'action', 'target_type', 'target_id', 'target_description')
        }),
        ('Details', {
            'fields': ('details', 'ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
        ('Timing', {
            'fields': ('timestamp',)
        }),
    )
    
    def actor_email(self, obj):
        """Display actor email with link"""
        if obj.actor:
            url = reverse('admin:accounts_user_change', args=[obj.actor.id])
            return format_html('<a href="{}">{}</a>', url, obj.actor.email)
        return 'System'
    actor_email.short_description = 'Actor'
    
    def details_preview(self, obj):
        """Display details preview"""
        if obj.details:
            details_str = str(obj.details)
            if len(details_str) > 50:
                return f"{details_str[:50]}..."
            return details_str
        return 'No details'
    details_preview.short_description = 'Details'
    
    def has_add_permission(self, request):
        """Audit logs cannot be manually created"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Audit logs cannot be modified"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Audit logs cannot be deleted"""
        return False
    
    def get_queryset(self, request):
        """Optimize queryset with related data"""
        return super().get_queryset(request).select_related('actor', 'target_type')


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    """Admin configuration for SystemSettings model"""
    list_display = [
        'key', 'value_preview', 'is_public', 'created_at', 'updated_at'
    ]
    list_filter = ['is_public', 'created_at', 'updated_at']
    search_fields = ['key', 'description']
    ordering = ['key']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('key', 'value', 'description', 'is_public')
        }),
        ('Timing', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def value_preview(self, obj):
        """Display value preview"""
        value_str = str(obj.value)
        if len(value_str) > 50:
            return f"{value_str[:50]}..."
        return value_str
    value_preview.short_description = 'Value'


@admin.register(DeletionRequest)
class DeletionRequestAdmin(admin.ModelAdmin):
    list_display = ['content_type', 'object_id', 'requested_by', 'status', 'created_at']
    list_filter = ['status', 'content_type']
    search_fields = ['object_id', 'requested_by__email']
    actions = ['approve_requests', 'reject_requests']

    def approve_requests(self, request, queryset):
        approved = 0
        for req in queryset.filter(status='PENDING'):
            model = req.content_type.model_class()
            try:
                obj = model.objects.get(id=req.object_id)
                obj.delete()
                req.status = 'APPROVED'
                req.processed_by = request.user
                req.processed_at = timezone.now()
                req.save(update_fields=['status', 'processed_by', 'processed_at'])
                approved += 1
            except model.DoesNotExist:
                req.status = 'REJECTED'
                req.processed_by = request.user
                req.processed_at = timezone.now()
                req.save(update_fields=['status', 'processed_by', 'processed_at'])
        self.message_user(request, f"Approved {approved} deletion request(s)")
    approve_requests.short_description = 'Approve selected deletion requests'

    def reject_requests(self, request, queryset):
        updated = queryset.filter(status='PENDING').update(status='REJECTED', processed_by=request.user, processed_at=timezone.now())
        self.message_user(request, f"Rejected {updated} deletion request(s)")
    reject_requests.short_description = 'Reject selected deletion requests'
