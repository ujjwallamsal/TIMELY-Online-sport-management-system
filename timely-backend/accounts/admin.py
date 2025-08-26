from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import User, UserRole, EmailVerificationToken, PasswordResetToken, AuditLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model"""
    list_display = [
        'email', 'full_name', 'is_active', 'email_verified', 'primary_role',
        'date_joined', 'last_login', 'is_staff'
    ]
    list_filter = [
        'is_active', 'email_verified', 'is_staff', 'is_superuser',
        'date_joined', 'last_login'
    ]
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    readonly_fields = ['created_at', 'updated_at', 'last_login']
    
    fieldsets = (
        (None, {
            'fields': ('email', 'password')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'phone_number', 'date_of_birth')
        }),
        ('Address', {
            'fields': ('address', 'city', 'state', 'postal_code', 'country'),
            'classes': ('collapse',)
        }),
        ('Profile', {
            'fields': ('profile_picture', 'bio', 'website', 'social_media', 'preferences'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active', 'email_verified', 'email_verified_at')
        }),
        ('Permissions', {
            'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Important Dates', {
            'fields': ('date_joined', 'last_login', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
        ('Stripe', {
            'fields': ('stripe_customer_id',),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )
    
    def full_name(self, obj):
        """Display full name"""
        return obj.full_name
    full_name.short_description = 'Full Name'
    
    def primary_role(self, obj):
        """Display primary role"""
        primary_role = obj.roles.filter(is_primary=True, is_active=True).first()
        if primary_role:
            return format_html(
                '<span style="color: #007cba;">{}</span>',
                primary_role.get_role_type_display()
            )
        return 'No Role'
    primary_role.short_description = 'Primary Role'
    
    def get_queryset(self, request):
        """Optimize queryset with related data"""
        return super().get_queryset(request).prefetch_related('roles')


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    """Admin configuration for UserRole model"""
    list_display = [
        'user_email', 'role_type', 'is_primary', 'context_info',
        'assigned_by', 'assigned_at', 'is_active', 'expires_info'
    ]
    list_filter = [
        'role_type', 'is_primary', 'is_active', 'context_type',
        'assigned_at', 'expires_at'
    ]
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    ordering = ['-assigned_at']
    readonly_fields = ['assigned_at', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('user', 'role_type', 'is_primary')
        }),
        ('Context', {
            'fields': ('context_type', 'context_id'),
            'classes': ('collapse',)
        }),
        ('Permissions', {
            'fields': (
                'can_manage_events', 'can_manage_teams', 'can_manage_users',
                'can_manage_fixtures', 'can_manage_results', 'can_manage_payments',
                'can_manage_content', 'can_view_reports'
            ),
            'classes': ('collapse',)
        }),
        ('Assignment', {
            'fields': ('assigned_by', 'assigned_at', 'expires_at', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_email(self, obj):
        """Display user email with link"""
        if obj.user:
            url = reverse('admin:accounts_user_change', args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.email)
        return 'No User'
    user_email.short_description = 'User'
    
    def context_info(self, obj):
        """Display context information"""
        if obj.context_type and obj.context_id:
            return f"{obj.context_type}: {obj.context_id}"
        return 'Global'
    context_info.short_description = 'Context'
    
    def expires_info(self, obj):
        """Display expiration information"""
        if obj.expires_at:
            if obj.is_expired:
                return format_html(
                    '<span style="color: #dc3232;">Expired</span>'
                )
            else:
                return format_html(
                    '<span style="color: #007cba;">{}</span>',
                    obj.expires_at.strftime('%Y-%m-%d %H:%M')
                )
        return 'Never'
    expires_info.short_description = 'Expires'
    
    def get_queryset(self, request):
        """Optimize queryset with related data"""
        return super().get_queryset(request).select_related('user', 'assigned_by')


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    """Admin configuration for EmailVerificationToken model"""
    list_display = ['user_email', 'token_preview', 'created_at', 'expires_at', 'is_used', 'is_expired']
    list_filter = ['is_used', 'created_at', 'expires_at']
    search_fields = ['user__email']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'token']
    
    fieldsets = (
        (None, {
            'fields': ('user', 'token', 'is_used')
        }),
        ('Timing', {
            'fields': ('created_at', 'expires_at')
        }),
    )
    
    def user_email(self, obj):
        """Display user email with link"""
        if obj.user:
            url = reverse('admin:accounts_user_change', args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.email)
        return 'No User'
    user_email.short_description = 'User'
    
    def token_preview(self, obj):
        """Display token preview"""
        return f"{obj.token[:20]}..." if len(obj.token) > 20 else obj.token
    token_preview.short_description = 'Token'
    
    def is_expired(self, obj):
        """Display expiration status"""
        if obj.is_expired:
            return format_html(
                '<span style="color: #dc3232;">Expired</span>'
            )
        return format_html(
            '<span style="color: #007cba;">Valid</span>'
        )
    is_expired.short_description = 'Status'
    
    def get_queryset(self, request):
        """Optimize queryset with related data"""
        return super().get_queryset(request).select_related('user')


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    """Admin configuration for PasswordResetToken model"""
    list_display = ['user_email', 'token_preview', 'created_at', 'expires_at', 'is_used', 'is_expired']
    list_filter = ['is_used', 'created_at', 'expires_at']
    search_fields = ['user__email']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'token']
    
    fieldsets = (
        (None, {
            'fields': ('user', 'token', 'is_used')
        }),
        ('Timing', {
            'fields': ('created_at', 'expires_at')
        }),
    )
    
    def user_email(self, obj):
        """Display user email with link"""
        if obj.user:
            url = reverse('admin:accounts_user_change', args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.email)
        return 'No User'
    user_email.short_description = 'User'
    
    def token_preview(self, obj):
        """Display token preview"""
        return f"{obj.token[:20]}..." if len(obj.token) > 20 else obj.token
    token_preview.short_description = 'Token'
    
    def is_expired(self, obj):
        """Display expiration status"""
        if obj.is_expired:
            return format_html(
                '<span style="color: #dc3232;">Expired</span>'
            )
        return format_html(
            '<span style="color: #007cba;">Valid</span>'
        )
    is_expired.short_description = 'Status'
    
    def get_queryset(self, request):
        """Optimize queryset with related data"""
        return super().get_queryset(request).select_related('user')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Admin configuration for AuditLog model"""
    list_display = [
        'action', 'user_email', 'resource_info', 'ip_address',
        'created_at', 'details_preview'
    ]
    list_filter = [
        'action', 'resource_type', 'created_at'
    ]
    search_fields = ['user__email', 'resource_type', 'resource_id']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'user', 'action', 'resource_type', 'resource_id', 'details', 'ip_address', 'user_agent']
    
    fieldsets = (
        (None, {
            'fields': ('user', 'action', 'resource_type', 'resource_id')
        }),
        ('Details', {
            'fields': ('details', 'ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
        ('Timing', {
            'fields': ('created_at',)
        }),
    )
    
    def user_email(self, obj):
        """Display user email with link"""
        if obj.user:
            url = reverse('admin:accounts_user_change', args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.email)
        return 'Anonymous'
    user_email.short_description = 'User'
    
    def resource_info(self, obj):
        """Display resource information"""
        if obj.resource_id:
            return f"{obj.resource_type}: {obj.resource_id}"
        return obj.resource_type
    resource_info.short_description = 'Resource'
    
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
        return super().get_queryset(request).select_related('user')


# Customize admin site
admin.site.site_header = "Timely Sports Management Admin"
admin.site.site_title = "Timely Admin"
admin.site.index_title = "Welcome to Timely Sports Management"
