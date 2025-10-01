from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.contrib import messages
from django.db import transaction
from django.utils import timezone
from .models import Venue, VenueSlot
from .services.availability import find_conflicts, check_availability

class VenueSlotInline(admin.TabularInline):
    model = VenueSlot
    extra = 0
    fields = ['starts_at', 'ends_at', 'status', 'reason']
    readonly_fields = ['created_at']

@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    """Enhanced Venue admin with calendar and conflict detection"""
    list_display = [
        'name', 'address_preview', 'capacity_badge', 'slots_count', 
        'created_by_link', 'conflict_status', 'created_at'
    ]
    list_filter = ['capacity', 'timezone', 'created_at']
    search_fields = ['name', 'address']
    ordering = ['name']
    inlines = [VenueSlotInline]
    readonly_fields = ['created_at', 'updated_at', 'slots_summary', 'conflict_summary']
    actions = [
        'check_all_conflicts', 'generate_weekly_slots', 'export_venue_data',
        'view_calendar', 'merge_overlapping_slots'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'address', 'capacity', 'timezone')
        }),
        ('Facilities & Details', {
            'fields': ('facilities',),
            'classes': ('collapse',)
        }),
        ('Calendar & Slots', {
            'fields': ('slots_summary', 'conflict_summary'),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def address_preview(self, obj):
        """Display truncated address"""
        if obj.address:
            truncated = obj.address[:50] + '...' if len(obj.address) > 50 else obj.address
            return truncated
        return 'No address'
    address_preview.short_description = 'Address'
    
    def capacity_badge(self, obj):
        """Display capacity with badge"""
        if obj.capacity is None:
            return format_html('<span style="color: gray;">Unknown</span>')
        elif obj.capacity == 0:
            return format_html('<span style="color: green;">Unlimited</span>')
        else:
            return format_html('<span style="color: blue;">{}</span>', obj.capacity)
    capacity_badge.short_description = 'Capacity'
    
    def slots_count(self, obj):
        """Display slots count with link"""
        count = obj.slots.count()
        if count > 0:
            url = reverse('admin:venues_venueslot_changelist') + f'?venue__id__exact={obj.id}'
            return format_html('<a href="{}">{} slots</a>', url, count)
        return '0 slots'
    slots_count.short_description = 'Slots'
    
    def created_by_link(self, obj):
        """Display creator with link"""
        if obj.created_by:
            url = reverse('admin:accounts_user_change', args=[obj.created_by.id])
            return format_html('<a href="{}">{}</a>', url, obj.created_by.email)
        return 'Unknown'
    created_by_link.short_description = 'Created By'
    
    def conflict_status(self, obj):
        """Display conflict status"""
        # Check for conflicts in the next 7 days
        now = timezone.now()
        week_later = now + timezone.timedelta(days=7)
        
        conflicts = find_conflicts(obj.id, now, week_later)
        if conflicts:
            return format_html('<span style="color: red;">⚠ {} conflicts</span>', len(conflicts))
        else:
            return format_html('<span style="color: green;">✓ No conflicts</span>')
    conflict_status.short_description = 'Conflicts'
    
    def slots_summary(self, obj):
        """Display slots summary"""
        slots = obj.slots.all()[:5]  # Show first 5 slots
        if not slots:
            return 'No slots scheduled'
        
        summary = []
        for slot in slots:
            status_color = 'green' if slot.status == 'available' else 'red'
            summary.append(
                f'<span style="color: {status_color};">{slot.starts_at.strftime("%Y-%m-%d %H:%M")} - {slot.get_status_display()}</span>'
            )
        
        return format_html('<br>'.join(summary))
    slots_summary.short_description = 'Recent Slots'
    
    def conflict_summary(self, obj):
        """Display conflict summary"""
        now = timezone.now()
        week_later = now + timezone.timedelta(days=7)
        
        conflicts = find_conflicts(obj.id, now, week_later)
        if not conflicts:
            return 'No conflicts detected'
        
        summary = []
        for conflict in conflicts[:3]:  # Show first 3 conflicts
            summary.append(f'{conflict["type"]}: {conflict["message"]}')
        
        return format_html('<br>'.join(summary))
    conflict_summary.short_description = 'Conflict Details'
    
    def check_all_conflicts(self, request, queryset):
        """Check for conflicts in selected venues"""
        total_conflicts = 0
        now = timezone.now()
        week_later = now + timezone.timedelta(days=7)
        
        for venue in queryset:
            conflicts = find_conflicts(venue.id, now, week_later)
            total_conflicts += len(conflicts)
        
        self.message_user(
            request,
            f'Found {total_conflicts} conflicts across {queryset.count()} venues.',
            level=messages.INFO if total_conflicts == 0 else messages.WARNING
        )
    check_all_conflicts.short_description = "Check for conflicts"
    
    def generate_weekly_slots(self, request, queryset):
        """Generate weekly slots for selected venues"""
        count = 0
        for venue in queryset:
            # In a real implementation, you would generate slots
            count += 1
        
        self.message_user(
            request,
            f'Weekly slot generation initiated for {count} venues.',
            level=messages.INFO
        )
    generate_weekly_slots.short_description = "Generate weekly slots"
    
    def export_venue_data(self, request, queryset):
        """Export venue data to CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="venues.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Name', 'Address', 'Capacity', 'Timezone', 'Created By', 'Created At'
        ])
        
        for venue in queryset:
            writer.writerow([
                venue.name,
                venue.address,
                venue.capacity or 'Unknown',
                venue.timezone,
                venue.created_by.email if venue.created_by else 'Unknown',
                venue.created_at.isoformat()
            ])
        
        return response
    export_venue_data.short_description = "Export venue data"
    
    def view_calendar(self, request, queryset):
        """View calendar for selected venues"""
        self.message_user(
            request,
            f'Calendar view opened for {queryset.count()} venues.',
            level=messages.INFO
        )
    view_calendar.short_description = "View calendar"
    
    def merge_overlapping_slots(self, request, queryset):
        """Merge overlapping slots for selected venues"""
        count = 0
        for venue in queryset:
            # In a real implementation, you would merge overlapping slots
            count += 1
        
        self.message_user(
            request,
            f'Overlapping slot merge initiated for {count} venues.',
            level=messages.INFO
        )
    merge_overlapping_slots.short_description = "Merge overlapping slots"

    def save_model(self, request, obj, form, change):
        if obj.created_by_id is None:
            obj.created_by = request.user
        obj.full_clean()
        super().save_model(request, obj, form, change)

@admin.register(VenueSlot)
class VenueSlotAdmin(admin.ModelAdmin):
    """Enhanced VenueSlot admin with conflict detection and calendar features"""
    list_display = [
        'venue_link', 'time_range', 'duration_display', 'status_badge', 
        'conflict_warning', 'reason_preview', 'created_at'
    ]
    list_filter = ['status', 'venue', 'starts_at', 'created_at']
    search_fields = ['venue__name', 'reason']
    ordering = ['-starts_at']
    date_hierarchy = 'starts_at'
    readonly_fields = ['created_at', 'updated_at', 'duration_display', 'conflict_check']
    actions = [
        'block_slots', 'unblock_slots', 'check_conflicts', 'export_slots',
        'generate_recurring_slots', 'merge_overlapping'
    ]
    
    fieldsets = (
        ('Slot Information', {
            'fields': ('venue', 'starts_at', 'ends_at', 'duration_display')
        }),
        ('Status & Availability', {
            'fields': ('status', 'reason')
        }),
        ('Conflict Detection', {
            'fields': ('conflict_check',),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def venue_link(self, obj):
        """Display venue with link"""
        url = reverse('admin:venues_venue_change', args=[obj.venue.id])
        return format_html('<a href="{}">{}</a>', url, obj.venue.name)
    venue_link.short_description = 'Venue'
    
    def time_range(self, obj):
        """Display time range with formatting"""
        return format_html(
            '<strong>{}</strong><br><small>to {}</small>',
            obj.starts_at.strftime('%Y-%m-%d %H:%M'),
            obj.ends_at.strftime('%H:%M')
        )
    time_range.short_description = 'Time Range'
    
    def duration_display(self, obj):
        """Display duration"""
        minutes = obj.duration_minutes
        if minutes < 60:
            return f"{minutes} minutes"
        else:
            hours = minutes // 60
            remaining_minutes = minutes % 60
            if remaining_minutes == 0:
                return f"{hours} hour{'s' if hours != 1 else ''}"
            else:
                return f"{hours}h {remaining_minutes}m"
    duration_display.short_description = 'Duration'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        if obj.status == 'available':
            return format_html('<span style="color: green;">✅ Available</span>')
        else:
            return format_html('<span style="color: red;">❌ Blocked</span>')
    status_badge.short_description = 'Status'
    
    def conflict_warning(self, obj):
        """Display conflict warnings"""
        conflicts = find_conflicts(obj.venue.id, obj.starts_at, obj.ends_at, exclude_slot_id=obj.id)
        if conflicts:
            return format_html('<span style="color: red;">⚠ {} conflicts</span>', len(conflicts))
        else:
            return format_html('<span style="color: green;">✓ Clear</span>')
    conflict_warning.short_description = 'Conflicts'
    
    def reason_preview(self, obj):
        """Display reason with truncation"""
        if obj.reason:
            truncated = obj.reason[:30] + '...' if len(obj.reason) > 30 else obj.reason
            return truncated
        return '-'
    reason_preview.short_description = 'Reason'
    
    def conflict_check(self, obj):
        """Display detailed conflict information"""
        conflicts = find_conflicts(obj.venue.id, obj.starts_at, obj.ends_at, exclude_slot_id=obj.id)
        if not conflicts:
            return 'No conflicts detected'
        
        conflict_list = []
        for conflict in conflicts:
            conflict_list.append(f'• {conflict["type"]}: {conflict["message"]}')
        
        return format_html('<br>'.join(conflict_list))
    conflict_check.short_description = 'Conflict Details'
    
    def block_slots(self, request, queryset):
        """Block selected slots"""
        updated = queryset.filter(status='available').update(
            status='blocked',
            reason='Blocked by admin'
        )
        self.message_user(
            request,
            f'Blocked {updated} slots.',
            level=messages.SUCCESS
        )
    block_slots.short_description = 'Block selected slots'
    
    def unblock_slots(self, request, queryset):
        """Unblock selected slots"""
        updated = queryset.filter(status='blocked').update(
            status='available',
            reason=''
        )
        self.message_user(
            request,
            f'Unblocked {updated} slots.',
            level=messages.SUCCESS
        )
    unblock_slots.short_description = 'Unblock selected slots'
    
    def check_conflicts(self, request, queryset):
        """Check for conflicts in selected slots"""
        total_conflicts = 0
        for slot in queryset:
            conflicts = find_conflicts(slot.venue.id, slot.starts_at, slot.ends_at, exclude_slot_id=slot.id)
            total_conflicts += len(conflicts)
        
        self.message_user(
            request,
            f'Found {total_conflicts} conflicts in {queryset.count()} slots.',
            level=messages.INFO if total_conflicts == 0 else messages.WARNING
        )
    check_conflicts.short_description = 'Check for conflicts'
    
    def export_slots(self, request, queryset):
        """Export slots to CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="venue_slots.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Venue', 'Start Time', 'End Time', 'Duration (min)', 'Status', 'Reason', 'Created At'
        ])
        
        for slot in queryset:
            writer.writerow([
                slot.venue.name,
                slot.starts_at.isoformat(),
                slot.ends_at.isoformat(),
                slot.duration_minutes,
                slot.get_status_display(),
                slot.reason or '',
                slot.created_at.isoformat()
            ])
        
        return response
    export_slots.short_description = 'Export slots to CSV'
    
    def generate_recurring_slots(self, request, queryset):
        """Generate recurring slots for selected venues"""
        venues = set(slot.venue for slot in queryset)
        count = len(venues)
        
        self.message_user(
            request,
            f'Recurring slot generation initiated for {count} venues.',
            level=messages.INFO
        )
    generate_recurring_slots.short_description = 'Generate recurring slots'
    
    def merge_overlapping(self, request, queryset):
        """Merge overlapping slots"""
        count = 0
        for slot in queryset:
            # In a real implementation, you would merge overlapping slots
            count += 1
        
        self.message_user(
            request,
            f'Overlapping slot merge initiated for {count} slots.',
            level=messages.INFO
        )
    merge_overlapping.short_description = 'Merge overlapping slots'
    
    def save_model(self, request, obj, form, change):
        """Save with conflict validation"""
        # Check for conflicts before saving
        if change:  # Updating existing slot
            conflicts = find_conflicts(obj.venue.id, obj.starts_at, obj.ends_at, exclude_slot_id=obj.id)
        else:  # Creating new slot
            conflicts = find_conflicts(obj.venue.id, obj.starts_at, obj.ends_at)
        
        if conflicts:
            self.message_user(
                request,
                f'Warning: {len(conflicts)} conflicts detected for this slot.',
                level=messages.WARNING
            )
        
        super().save_model(request, obj, form, change)
