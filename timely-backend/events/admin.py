from django.contrib import admin
from django.utils import timezone
from .models import Event, Division


@admin.register(Division)
class DivisionAdmin(admin.ModelAdmin):
    list_display = ["name", "event", "sort_order"]
    search_fields = ["name", "event__name"]
    list_filter = ["event"]
    ordering = ["event", "sort_order", "name"]


@admin.action(description="Publish selected events")
def publish_events(modeladmin, request, queryset):
    updated = queryset.update(lifecycle_status=Event.LifecycleStatus.PUBLISHED)
    modeladmin.message_user(request, f"{updated} event(s) published")


@admin.action(description="Unpublish selected events")
def unpublish_events(modeladmin, request, queryset):
    updated = queryset.update(lifecycle_status=Event.LifecycleStatus.DRAFT)
    modeladmin.message_user(request, f"{updated} event(s) moved to draft")


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        "name", "sport", "location", "start_datetime", "end_datetime", 
        "lifecycle_status", "created_by"
    ]
    search_fields = ["name", "sport", "location", "created_by__email"]
    list_filter = ["sport", "lifecycle_status", "start_datetime", "end_datetime"]
    date_hierarchy = "start_datetime"
    ordering = ["-start_datetime"]
    actions = [publish_events, unpublish_events]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'sport', 'description')
        }),
        ('Date and Time', {
            'fields': ('start_datetime', 'end_datetime', 'registration_open_at', 'registration_close_at')
        }),
        ('Location and Capacity', {
            'fields': ('location', 'capacity', 'fee_cents')
        }),
        ('Status', {
            'fields': ('lifecycle_status',)
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
