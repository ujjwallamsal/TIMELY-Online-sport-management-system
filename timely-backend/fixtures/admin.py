from django.contrib import admin
from .models import Fixture, FixtureEntry

@admin.register(Fixture)
class FixtureAdmin(admin.ModelAdmin):
	list_display = ["event", "round_no", "venue", "starts_at", "status"]
	list_filter = ["status", "event", "venue", "starts_at"]
	search_fields = ["event__name", "venue__name"]
	date_hierarchy = "starts_at"
	ordering = ["-starts_at"]

	def get_queryset(self, request):
		qs = super().get_queryset(request).select_related("event", "venue")
		if request.user.is_superuser:
			return qs
		if request.user.is_staff:
			return qs.filter(event__created_by=request.user)
		return qs.none()

@admin.register(FixtureEntry)
class FixtureEntryAdmin(admin.ModelAdmin):
	list_display = ["fixture", "side", "team", "participant"]
	list_filter = ["side", "fixture__event"]
	search_fields = ["fixture__event__name", "team__name", "participant__email"]
