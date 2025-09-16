from django.contrib import admin
from django.utils import timezone
from .models import Event, Division


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
        "name", "sport", "venue", "start_date", "end_date", 
        "status", "created_by"
    ]
    search_fields = ["name", "sport__name", "venue__name", "created_by__email"]
    list_filter = ["sport", "status", "start_date", "end_date"]
    date_hierarchy = "start_date"
    ordering = ["-start_date"]
    actions = [mark_ongoing, mark_completed]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'sport', 'description')
        }),
        ('Date and Time', {
            'fields': ('start_date', 'end_date')
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
