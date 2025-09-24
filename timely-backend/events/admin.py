from django.contrib import admin
from django.utils import timezone
from .models import Event, Division


class DivisionInline(admin.TabularInline):
    model = Division
    extra = 0
    fields = ['name', 'sort_order']
    ordering = ['sort_order']

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
    list_display = [
        "name", "sport", "venue", "start_datetime", "end_datetime", 
        "status", "created_by"
    ]
    search_fields = ["name", "sport", "venue__name", "created_by__email"]
    list_filter = ["sport", "status", "start_datetime", "end_datetime"]
    date_hierarchy = "start_datetime"
    ordering = ["-start_datetime"]
    actions = [mark_ongoing, mark_completed]
    inlines = [DivisionInline]
    readonly_fields = ["created_at", "updated_at"]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'sport', 'description')
        }),
        ('Date and Time', {
            'fields': ('start_datetime', 'end_datetime')
        }),
        ('Location and Venue', {
            'fields': ('venue', 'eligibility')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Metadata', {
            'fields': ('created_by',),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs.select_related("created_by")
        # Organizer staff: show only their events
        if request.user.is_staff:
            return qs.filter(created_by=request.user).select_related("created_by")
        return qs.none()

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
