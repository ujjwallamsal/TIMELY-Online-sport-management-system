from django.contrib import admin
from django.utils import timezone
from .models import Event, Division

@admin.register(Division)
class DivisionAdmin(admin.ModelAdmin):
	list_display = ["name", "min_age", "max_age", "gender"]
	search_fields = ["name"]
	list_filter = ["gender"]
	ordering = ["name"]

@admin.action(description="Publish selected events")
def publish_events(modeladmin, request, queryset):
	updated = queryset.update(status=Event.Status.PUBLISHED)
	modeladmin.message_user(request, f"{updated} event(s) published")

@admin.action(description="Unpublish selected events")
def unpublish_events(modeladmin, request, queryset):
	updated = queryset.update(status=Event.Status.DRAFT)
	modeladmin.message_user(request, f"{updated} event(s) moved to draft")

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
	list_display = [
		"name", "sport_type", "venue", "start_date", "end_date", "status", "created_by"
	]
	search_fields = ["name", "sport_type", "venue__name", "created_by__email"]
	list_filter = ["sport_type", "status", "venue", "start_date", "end_date"]
	date_hierarchy = "start_date"
	ordering = ["-start_date"]
	actions = [publish_events, unpublish_events]

	def get_queryset(self, request):
		qs = super().get_queryset(request)
		if request.user.is_superuser:
			return qs.select_related("venue", "created_by")
		# Organizer staff: show only their events
		if request.user.is_staff:
			return qs.filter(created_by=request.user).select_related("venue", "created_by")
		return qs.none()

	def has_module_permission(self, request):
		# Only staff may see events module in admin
		return request.user.is_staff
