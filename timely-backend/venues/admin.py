from django.contrib import admin
from .models import Venue, VenueSlot

class VenueSlotInline(admin.TabularInline):
    model = VenueSlot
    extra = 0
    fields = ['starts_at', 'ends_at', 'status', 'reason']
    readonly_fields = ['created_at']

@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ["name", "address", "capacity", "facilities"]
    list_filter = ["capacity"]
    search_fields = ["name", "address"]
    ordering = ["name"]
    inlines = [VenueSlotInline]
    readonly_fields = ["created_at"]
    fieldsets = (
        ("Basic Information", {
            "fields": ("name", "address", "capacity")
        }),
        ("Details", {
            "fields": ("facilities",)
        }),
    )

    def save_model(self, request, obj, form, change):
        if obj.created_by_id is None:
            obj.created_by = request.user
        obj.full_clean()
        super().save_model(request, obj, form, change)

@admin.register(VenueSlot)
class VenueSlotAdmin(admin.ModelAdmin):
    list_display = ["venue", "starts_at", "ends_at", "status", "reason"]
    list_filter = ["status", "venue", "starts_at"]
    search_fields = ["venue__name", "reason"]
    ordering = ["-starts_at"]
    date_hierarchy = "starts_at"
    readonly_fields = ["created_at"]
