from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils import timezone
from django.contrib import messages
from django.db import transaction
from .models import User, OrganizerApplication
from django.contrib.contenttypes.models import ContentType
from common.models import DeletionRequest


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model"""
    list_display = [
        'email', 'role', 'is_active', 'is_staff', 'is_superuser', 'date_joined'
    ]
    list_filter = [
        'is_active', 'is_staff', 'is_superuser', 'role', 'email_verified', 'date_joined'
    ]
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-date_joined']
    readonly_fields = ['created_at', 'updated_at', 'date_joined']
    actions = ['export_selected_to_csv', 'export_selected_to_pdf']

    def export_selected_to_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename=users.csv'
        writer = csv.writer(response)
        writer.writerow(['email','role','is_active','is_staff','is_superuser','date_joined'])
        for u in queryset:
            writer.writerow([u.email, u.role, u.is_active, u.is_staff, u.is_superuser, u.date_joined.isoformat() if u.date_joined else ''])
        return response
    export_selected_to_csv.short_description = 'Export selected to CSV'

    def export_selected_to_pdf(self, request, queryset):
        # TODO: Implement PDF export using a library like WeasyPrint/ReportLab
        self.message_user(request, 'PDF export is not yet implemented.', level=messages.INFO)
    export_selected_to_pdf.short_description = 'Export selected to PDF (stub)'
    fieldsets = (
        (None, {
            'fields': ('email', 'password')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'username')
        }),
        ('Status', {
            'fields': ('is_active', 'email_verified')
        }),
        ('Permissions', {
            'fields': ('is_staff', 'is_superuser', 'role', 'groups', 'user_permissions'),
        }),
        ('Important Dates', {
            'fields': ('date_joined', 'last_login', 'created_at', 'updated_at'),
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset"""
        return super().get_queryset(request).select_related()

    def delete_model(self, request, obj):
        ct = ContentType.objects.get_for_model(User)
        DeletionRequest.objects.create(
            requested_by=request.user,
            content_type=ct,
            object_id=obj.id,
            reason=request.POST.get('reason', 'Admin requested user deletion'),
        )
        self.message_user(request, "Deletion requested; pending approval.")

    def delete_queryset(self, request, queryset):
        ct = ContentType.objects.get_for_model(User)
        for obj in queryset:
            DeletionRequest.objects.create(
                requested_by=request.user,
                content_type=ct,
                object_id=obj.id,
                reason=request.POST.get('reason', 'Admin requested user deletion'),
            )
        self.message_user(request, f"Deletion requested for {queryset.count()} user(s); pending approval.")


@admin.register(OrganizerApplication)
class OrganizerApplicationAdmin(admin.ModelAdmin):
    """Admin configuration for OrganizerApplication model"""
    list_display = [
        'user', 'status', 'reviewed_by', 'reviewed_at', 'created_at'
    ]
    list_filter = [
        'status', 'created_at', 'reviewed_at'
    ]
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'reason']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('user', 'status', 'reason')
        }),
        ('Review', {
            'fields': ('reviewed_by', 'reviewed_at'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
        }),
    )
    
    actions = ['approve_applications', 'reject_applications']
    
    def approve_applications(self, request, queryset):
        """Bulk approve organizer applications"""
        approved_count = 0
        with transaction.atomic():
            for application in queryset.filter(status='PENDING'):
                try:
                    application.approve(request.user)
                    approved_count += 1
                except Exception as e:
                    self.message_user(
                        request,
                        f"Error approving application for {application.user.email}: {str(e)}",
                        level=messages.ERROR
                    )
        
        if approved_count > 0:
            self.message_user(
                request,
                f"Successfully approved {approved_count} organizer application(s).",
                level=messages.SUCCESS
            )
    
    approve_applications.short_description = "Approve selected applications"
    
    def reject_applications(self, request, queryset):
        """Bulk reject organizer applications"""
        rejected_count = 0
        default_reason = "Rejected by admin."
        
        with transaction.atomic():
            for application in queryset.filter(status='PENDING'):
                try:
                    application.reject(request.user, default_reason)
                    rejected_count += 1
                except Exception as e:
                    self.message_user(
                        request,
                        f"Error rejecting application for {application.user.email}: {str(e)}",
                        level=messages.ERROR
                    )
        
        if rejected_count > 0:
            self.message_user(
                request,
                f"Successfully rejected {rejected_count} organizer application(s).",
                level=messages.SUCCESS
            )
    
    reject_applications.short_description = "Reject selected applications"
    
    def get_queryset(self, request):
        """Optimize queryset with related data"""
        return super().get_queryset(request).select_related('user', 'reviewed_by')


# --- Admin site branding and theme ---
admin.site.site_header = "Timely Sports Management"
admin.site.site_title = "Timely Admin"
admin.site.index_title = "Operations Dashboard"


class CustomAdminSite(admin.AdminSite):
    class Media:
        css = {
            'all': (
                'admin/css/custom.css',
            )
        }


# Swap the default site class to include our Media definitions for CSS
admin.site.__class__ = CustomAdminSite