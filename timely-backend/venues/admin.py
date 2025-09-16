from django.contrib import admin
from .models import Venue, VenueSlot

@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ["name", "address", "capacity", "facilities"]
    list_filter = ["capacity"]
    search_fields = ["name", "address"]
    ordering = ["name"]
    fieldsets = (
        ("Basic Information", {
            "fields": ("name", "address", "capacity")
        }),
        ("Details", {
            "fields": ("facilities",)
        }),
    )

@admin.register(VenueSlot)
class VenueSlotAdmin(admin.ModelAdmin):
    list_display = ["venue", "starts_at", "ends_at", "status", "reason"]
    list_filter = ["status", "venue", "starts_at"]
    search_fields = ["venue__name", "reason"]
    ordering = ["-starts_at"]
    date_hierarchy = "starts_at"
