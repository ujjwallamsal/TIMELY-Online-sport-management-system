from django.contrib import admin
from .models import Venue, VenueSlot

@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ["name", "address", "capacity", "timezone", "created_by"]
    list_filter = ["timezone", "capacity"]
    search_fields = ["name", "address"]
    ordering = ["name"]
    fieldsets = (
        ("Basic Information", {
            "fields": ("name", "address", "capacity")
        }),
        ("Details", {
            "fields": ("facilities", "timezone", "created_by")
        }),
    )

@admin.register(VenueSlot)
class VenueSlotAdmin(admin.ModelAdmin):
    list_display = ["venue", "starts_at", "ends_at", "status", "reason"]
    list_filter = ["status", "venue", "starts_at"]
    search_fields = ["venue__name", "reason"]
    ordering = ["-starts_at"]
    date_hierarchy = "starts_at"
