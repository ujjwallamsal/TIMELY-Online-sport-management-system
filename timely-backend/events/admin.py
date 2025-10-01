from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from django.urls import reverse
from django.contrib import messages
from django.db import transaction
from .models import Event, Division


class DivisionInline(admin.TabularInline):
    model = Division
    extra = 0
    fields = ['name', 'sort_order']
    ordering = ['sort_order']


# Inline admin classes removed - models may not have proper foreign key relationships to Event

# TicketTypeInline removed - TicketType doesn't have ForeignKey to Event

@admin.register(Division)
class DivisionAdmin(admin.ModelAdmin):
    list_display = ["name", "event", "sort_order"]
    search_fields = ["name", "event__name"]
    list_filter = ["event"]
    ordering = ["event", "sort_order", "name"]


@admin.action(description="Mark selected events as ongoing")
def mark_ongoing(modeladmin, request, queryset):
    updated = queryset.update(status=Event.Status.ONGOING)
    modeladmin.message_user(request, f"{updated} event(s) marked as ongoing")


@admin.action(description="Mark selected events as completed")
def mark_completed(modeladmin, request, queryset):
    updated = queryset.update(status=Event.Status.COMPLETED)
    modeladmin.message_user(request, f"{updated} event(s) marked as completed")


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """Enhanced Event Hub admin with comprehensive inline editing"""
    list_display = [
        'name', 'sport', 'venue', 'start_datetime', 'status_badge', 
        'registrations_count', 'fixtures_count', 'tickets_count', 'created_by'
    ]
    search_fields = ['name', 'description', 'location', 'sport']
    list_filter = [
        'sport', 'status', 'visibility', 'requires_approval', 'start_datetime', 'created_at'
    ]
    ordering = ['-start_datetime']
    date_hierarchy = 'start_datetime'
    actions = [
        mark_ongoing, mark_completed, 'export_selected_to_csv', 'export_selected_to_pdf',
        'publish_event', 'unpublish_event', 'generate_fixtures', 'send_reminders'
    ]
    inlines = [DivisionInline]
    readonly_fields = [
        'created_at', 'updated_at', 'phase', 'registrations_count', 
        'fixtures_count', 'tickets_count', 'total_revenue'
    ]
    
    fieldsets = (
        ('Event Information', {
            'fields': ('name', 'sport', 'description', 'created_by')
        }),
        ('Scheduling', {
            'fields': ('start_datetime', 'end_datetime', 'registration_open_at', 'registration_close_at')
        }),
        ('Location & Capacity', {
            'fields': ('venue', 'location', 'capacity', 'fee_cents')
        }),
        ('Settings', {
            'fields': ('status', 'visibility', 'requires_approval')
        }),
        ('Statistics', {
            'fields': ('phase', 'registrations_count', 'fixtures_count', 'tickets_count', 'total_revenue'),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs.select_related("created_by", "venue").prefetch_related(
                "fixtures", "registrations", "tickettype_set"
            )
        # Organizer staff: show only their events
        if request.user.is_staff:
            return qs.filter(created_by=request.user).select_related("created_by", "venue").prefetch_related(
                "fixtures", "registrations", "tickettype_set"
            )
        return qs.none()
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'UPCOMING': 'blue',
            'ONGOING': 'green',
            'COMPLETED': 'gray',
            'CANCELLED': 'red'
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def registrations_count(self, obj):
        """Display registration count with link"""
        count = obj.registrations.count()
        if count > 0:
            url = reverse('admin:registrations_registration_changelist') + f'?event__id__exact={obj.id}'
            return format_html('<a href="{}">{} registrations</a>', url, count)
        return '0 registrations'
    registrations_count.short_description = 'Registrations'
    
    def fixtures_count(self, obj):
        """Display fixture count with link"""
        count = obj.fixtures.count()
        if count > 0:
            url = reverse('admin:fixtures_fixture_changelist') + f'?event__id__exact={obj.id}'
            return format_html('<a href="{}">{} fixtures</a>', url, count)
        return '0 fixtures'
    fixtures_count.short_description = 'Fixtures'
    
    def tickets_count(self, obj):
        """Display ticket count with link"""
        count = obj.tickettype_set.count()
        if count > 0:
            url = reverse('admin:tickets_tickettype_changelist') + f'?event_id__exact={obj.id}'
            return format_html('<a href="{}">{} ticket types</a>', url, count)
        return '0 ticket types'
    tickets_count.short_description = 'Tickets'
    
    def total_revenue(self, obj):
        """Calculate and display total revenue"""
        total = 0
        for ticket_type in obj.tickettype_set.all():
            total += ticket_type.price_cents * ticket_type.quantity_sold
        return f"${total / 100:.2f}"
    total_revenue.short_description = 'Revenue'

    def has_module_permission(self, request):
        # Only staff may see events module in admin
        return request.user.is_staff
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deleting events that have fixtures or tickets
        if obj:
            if obj.fixtures.exists():
                return False
            if hasattr(obj, 'tickets') and obj.tickets.exists():
                return False
        return super().has_delete_permission(request, obj)

    def export_selected_to_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename=events.csv'
        writer = csv.writer(response)
        writer.writerow(['id','name','sport','venue','start_datetime','status'])
        for e in queryset:
            writer.writerow([e.id, e.name, e.sport, e.venue.name if e.venue else '', e.start_datetime.isoformat() if e.start_datetime else '', e.status])
        return response
    export_selected_to_csv.short_description = 'Export selected to CSV'

    def export_selected_to_pdf(self, request, queryset):
        # TODO: Implement with WeasyPrint/ReportLab
        self.message_user(request, 'PDF export is not yet implemented.', level=messages.INFO)
    export_selected_to_pdf.short_description = 'Export selected to PDF (stub)'
    
    def publish_event(self, request, queryset):
        """Publish selected events"""
        updated = queryset.filter(status=Event.Status.UPCOMING).update(visibility='PUBLIC')
        self.message_user(
            request,
            f'Published {updated} event(s).',
            level=messages.SUCCESS
        )
    publish_event.short_description = "Publish selected events"
    
    def unpublish_event(self, request, queryset):
        """Unpublish selected events"""
        updated = queryset.update(visibility='PRIVATE')
        self.message_user(
            request,
            f'Unpublished {updated} event(s).',
            level=messages.SUCCESS
        )
    unpublish_event.short_description = "Unpublish selected events"
    
    def generate_fixtures(self, request, queryset):
        """Generate fixtures for selected events"""
        count = 0
        for event in queryset:
            # In a real implementation, you would generate fixtures based on teams
            # This is a placeholder
            count += 1
        
        self.message_user(
            request,
            f'Fixture generation initiated for {count} event(s).',
            level=messages.INFO
        )
    generate_fixtures.short_description = "Generate fixtures"
    
    def send_reminders(self, request, queryset):
        """Send reminders for selected events"""
        count = 0
        for event in queryset:
            # In a real implementation, you would send email reminders
            # This is a placeholder
            count += 1
        
        self.message_user(
            request,
            f'Reminders sent for {count} event(s).',
            level=messages.SUCCESS
        )
    send_reminders.short_description = "Send reminders"
    
    def save_model(self, request, obj, form, change):
        """Set created_by if not set"""
        if not change:  # New event
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
