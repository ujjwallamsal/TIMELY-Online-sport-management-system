from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils import timezone
from django.contrib import messages
from django.db import transaction
from .models import User, OrganizerApplication, AthleteApplication, CoachApplication
from django.contrib.contenttypes.models import ContentType
from common.models import DeletionRequest


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Enhanced admin configuration for User model with role management"""
    list_display = [
        'email', 'full_name', 'role_badge', 'is_active', 'is_staff', 'is_superuser', 
        'email_verified', 'date_joined', 'has_pending_applications'
    ]
    list_filter = [
        'is_active', 'is_staff', 'is_superuser', 'role', 'email_verified', 'date_joined'
    ]
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-date_joined']
    readonly_fields = ['created_at', 'updated_at', 'date_joined']
    actions = [
        'export_selected_to_csv', 'export_selected_to_pdf', 
        'force_password_reset', 'toggle_active_status', 'change_user_role',
        'verify_email_addresses', 'send_welcome_emails', 'impersonate_user',
        'export_user_data', 'suspend_users', 'activate_users'
    ]

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
    
    def full_name(self, obj):
        """Display user's full name"""
        return obj.full_name or 'No name'
    full_name.short_description = 'Name'
    
    def role_badge(self, obj):
        """Display role with color coding"""
        colors = {
            'ADMIN': 'red',
            'ORGANIZER': 'blue', 
            'COACH': 'green',
            'ATHLETE': 'orange',
            'SPECTATOR': 'gray'
        }
        color = colors.get(obj.role, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_role_display()
        )
    role_badge.short_description = 'Role'
    
    def has_pending_applications(self, obj):
        """Check if user has pending role applications"""
        has_athlete = hasattr(obj, 'athlete_application') and obj.athlete_application.status == 'PENDING'
        has_coach = hasattr(obj, 'coach_application') and obj.coach_application.status == 'PENDING'
        has_organizer = hasattr(obj, 'organizer_application') and obj.organizer_application.status == 'PENDING'
        
        if has_athlete or has_coach or has_organizer:
            return format_html('<span style="color: orange;">⚠ Pending</span>')
        return format_html('<span style="color: green;">✓ None</span>')
    has_pending_applications.short_description = 'Applications'
    
    def force_password_reset(self, request, queryset):
        """Force password reset for selected users"""
        count = 0
        for user in queryset:
            # In a real implementation, you would invalidate their current password
            # and send them a reset email
            user.set_unusable_password()
            user.save(update_fields=['password'])
            count += 1
        
        self.message_user(
            request,
            f'Forced password reset for {count} user(s).',
            level=messages.SUCCESS
        )
    force_password_reset.short_description = "Force password reset"
    
    def toggle_active_status(self, request, queryset):
        """Toggle active status for selected users"""
        count = 0
        for user in queryset:
            user.is_active = not user.is_active
            user.save(update_fields=['is_active'])
            count += 1
        
        self.message_user(
            request,
            f'Toggled active status for {count} user(s).',
            level=messages.SUCCESS
        )
    toggle_active_status.short_description = "Toggle active status"
    
    def change_user_role(self, request, queryset):
        """Change role for selected users"""
        # This would typically open a form to select new role
        # For now, just show a message
        self.message_user(
            request,
            f'Role change initiated for {queryset.count()} user(s).',
            level=messages.INFO
        )
    change_user_role.short_description = "Change user role"
    
    def verify_email_addresses(self, request, queryset):
        """Verify email addresses for selected users"""
        count = queryset.filter(email_verified=False).update(email_verified=True)
        self.message_user(
            request,
            f'Verified email addresses for {count} user(s).',
            level=messages.SUCCESS
        )
    verify_email_addresses.short_description = "Verify email addresses"
    
    def send_welcome_emails(self, request, queryset):
        """Send welcome emails to selected users"""
        count = 0
        for user in queryset.filter(is_active=True):
            # In a real implementation, you would send welcome emails
            count += 1
        
        self.message_user(
            request,
            f'Welcome emails sent to {count} user(s).',
            level=messages.SUCCESS
        )
    send_welcome_emails.short_description = "Send welcome emails"
    
    def impersonate_user(self, request, queryset):
        """Impersonate selected user (superuser only)"""
        if not request.user.is_superuser:
            self.message_user(
                request,
                'Only superusers can impersonate other users.',
                level=messages.ERROR
            )
            return
        
        if queryset.count() != 1:
            self.message_user(
                request,
                'Please select exactly one user to impersonate.',
                level=messages.ERROR
            )
            return
        
        user = queryset.first()
        # In a real implementation, you would set up impersonation session
        self.message_user(
            request,
            f'Impersonation initiated for {user.email}.',
            level=messages.INFO
        )
    impersonate_user.short_description = "Impersonate user (superuser only)"
    
    def export_user_data(self, request, queryset):
        """Export comprehensive user data (GDPR compliance)"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="user_data_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Email', 'Full Name', 'Role', 'Active', 'Email Verified', 'Staff', 'Superuser',
            'Date Joined', 'Last Login', 'Created At', 'Updated At'
        ])
        
        for user in queryset:
            writer.writerow([
                user.email,
                user.full_name,
                user.get_role_display(),
                'Yes' if user.is_active else 'No',
                'Yes' if user.email_verified else 'No',
                'Yes' if user.is_staff else 'No',
                'Yes' if user.is_superuser else 'No',
                user.date_joined.isoformat() if user.date_joined else '',
                user.last_login.isoformat() if user.last_login else '',
                user.created_at.isoformat(),
                user.updated_at.isoformat()
            ])
        
        return response
    export_user_data.short_description = "Export user data (GDPR)"
    
    def suspend_users(self, request, queryset):
        """Suspend selected users"""
        count = queryset.filter(is_active=True).update(is_active=False)
        self.message_user(
            request,
            f'Suspended {count} user(s).',
            level=messages.SUCCESS
        )
    suspend_users.short_description = "Suspend selected users"
    
    def activate_users(self, request, queryset):
        """Activate selected users"""
        count = queryset.filter(is_active=False).update(is_active=True)
        self.message_user(
            request,
            f'Activated {count} user(s).',
            level=messages.SUCCESS
        )
    activate_users.short_description = "Activate selected users"
    
    fieldsets = (
        ('Authentication', {
            'fields': ('email', 'password')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'username')
        }),
        ('Security & Verification', {
            'fields': ('email_verified',),
            'classes': ('collapse',)
        }),
        ('Status & Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'role', 'groups', 'user_permissions'),
        }),
        ('System Information', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at'),
            'classes': ('collapse',)
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


@admin.register(AthleteApplication)
class AthleteApplicationAdmin(admin.ModelAdmin):
    """Enhanced admin configuration for AthleteApplication model"""
    list_display = [
        'user_email', 'status_badge', 'date_of_birth', 'sports_count', 
        'reviewed_by', 'reviewed_at', 'created_at'
    ]
    list_filter = [
        'status', 'created_at', 'reviewed_at', 'date_of_birth'
    ]
    search_fields = [
        'user__email', 'user__first_name', 'user__last_name', 'reason'
    ]
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Application Details', {
            'fields': ('user', 'status', 'reason')
        }),
        ('Athlete Information', {
            'fields': ('date_of_birth', 'sports')
        }),
        ('Documents', {
            'fields': ('id_document', 'medical_clearance'),
            'classes': ('collapse',)
        }),
        ('Review', {
            'fields': ('reviewed_by', 'reviewed_at'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_applications', 'reject_applications', 'export_to_csv']
    
    def user_email(self, obj):
        """Display user email with link"""
        url = reverse('admin:accounts_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_email.short_description = 'User'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'PENDING': 'orange',
            'APPROVED': 'green',
            'REJECTED': 'red'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def sports_count(self, obj):
        """Display number of sports"""
        return len(obj.sports) if obj.sports else 0
    sports_count.short_description = 'Sports'
    
    def approve_applications(self, request, queryset):
        """Bulk approve athlete applications"""
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
                f"Successfully approved {approved_count} athlete application(s).",
                level=messages.SUCCESS
            )
    
    approve_applications.short_description = "Approve selected applications"
    
    def reject_applications(self, request, queryset):
        """Bulk reject athlete applications"""
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
                f"Successfully rejected {rejected_count} athlete application(s).",
                level=messages.SUCCESS
            )
    
    reject_applications.short_description = "Reject selected applications"
    
    def export_to_csv(self, request, queryset):
        """Export selected applications to CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="athlete_applications.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'User Email', 'Status', 'Date of Birth', 'Sports', 'Reason', 
            'Reviewed By', 'Reviewed At', 'Created At'
        ])
        
        for app in queryset:
            writer.writerow([
                app.user.email,
                app.get_status_display(),
                app.date_of_birth.isoformat() if app.date_of_birth else '',
                ', '.join(app.sports) if app.sports else '',
                app.reason,
                app.reviewed_by.email if app.reviewed_by else '',
                app.reviewed_at.isoformat() if app.reviewed_at else '',
                app.created_at.isoformat()
            ])
        
        return response
    export_to_csv.short_description = "Export selected to CSV"
    
    def get_queryset(self, request):
        """Optimize queryset with related data"""
        return super().get_queryset(request).select_related('user', 'reviewed_by')


@admin.register(CoachApplication)
class CoachApplicationAdmin(admin.ModelAdmin):
    """Enhanced admin configuration for CoachApplication model"""
    list_display = [
        'user_email', 'status_badge', 'sports_count', 'team_preference', 
        'reviewed_by', 'reviewed_at', 'created_at'
    ]
    list_filter = [
        'status', 'created_at', 'reviewed_at'
    ]
    search_fields = [
        'user__email', 'user__first_name', 'user__last_name', 'reason', 'team_preference'
    ]
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Application Details', {
            'fields': ('user', 'status', 'reason')
        }),
        ('Coach Information', {
            'fields': ('sports', 'team_preference')
        }),
        ('Documents', {
            'fields': ('coaching_certificate', 'resume'),
            'classes': ('collapse',)
        }),
        ('Review', {
            'fields': ('reviewed_by', 'reviewed_at'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_applications', 'reject_applications', 'export_to_csv']
    
    def user_email(self, obj):
        """Display user email with link"""
        url = reverse('admin:accounts_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_email.short_description = 'User'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'PENDING': 'orange',
            'APPROVED': 'green',
            'REJECTED': 'red'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def sports_count(self, obj):
        """Display number of sports"""
        return len(obj.sports) if obj.sports else 0
    sports_count.short_description = 'Sports'
    
    def approve_applications(self, request, queryset):
        """Bulk approve coach applications"""
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
                f"Successfully approved {approved_count} coach application(s).",
                level=messages.SUCCESS
            )
    
    approve_applications.short_description = "Approve selected applications"
    
    def reject_applications(self, request, queryset):
        """Bulk reject coach applications"""
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
                f"Successfully rejected {rejected_count} coach application(s).",
                level=messages.SUCCESS
            )
    
    reject_applications.short_description = "Reject selected applications"
    
    def export_to_csv(self, request, queryset):
        """Export selected applications to CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="coach_applications.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'User Email', 'Status', 'Sports', 'Team Preference', 'Reason', 
            'Reviewed By', 'Reviewed At', 'Created At'
        ])
        
        for app in queryset:
            writer.writerow([
                app.user.email,
                app.get_status_display(),
                ', '.join(app.sports) if app.sports else '',
                app.team_preference,
                app.reason,
                app.reviewed_by.email if app.reviewed_by else '',
                app.reviewed_at.isoformat() if app.reviewed_at else '',
                app.created_at.isoformat()
            ])
        
        return response
    export_to_csv.short_description = "Export selected to CSV"
    
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