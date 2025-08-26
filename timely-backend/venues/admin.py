from django.contrib import admin
from .models import Venue

@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
	list_display = ["name", "address", "capacity", "indoor"]
	list_filter = ["indoor", "capacity"]
	search_fields = ["name", "address"]
	ordering = ["name"]
