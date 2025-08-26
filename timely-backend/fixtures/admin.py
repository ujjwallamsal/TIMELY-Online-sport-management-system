from django.contrib import admin
from .models import Fixture, Match

@admin.action(description="Publish selected fixtures")
def publish_fixtures(modeladmin, request, queryset):
	updated = queryset.update(status=Fixture.Status.PUBLISHED)
	modeladmin.message_user(request, f"{updated} fixture(s) published")

@admin.action(description="Unpublish selected fixtures")
def unpublish_fixtures(modeladmin, request, queryset):
	updated = queryset.update(status=Fixture.Status.DRAFT)
	modeladmin.message_user(request, f"{updated} fixture(s) moved to draft")

@admin.register(Fixture)
class FixtureAdmin(admin.ModelAdmin):
	list_display = ["event", "division", "name", "status", "start_date", "end_date"]
	list_filter = ["status", "event", "division", "start_date"]
	search_fields = ["name", "event__name", "division__name"]
	date_hierarchy = "start_date"
	actions = [publish_fixtures, unpublish_fixtures]

	def get_queryset(self, request):
		qs = super().get_queryset(request).select_related("event", "division")
		if request.user.is_superuser:
			return qs
		if request.user.is_staff:
			return qs.filter(event__created_by=request.user)
		return qs.none()

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
	list_display = ["fixture", "round_number", "match_number", "venue", "scheduled_at", "status", "is_published"]
	list_filter = ["status", "is_published", "venue", "scheduled_at"]
	search_fields = ["fixture__name", "venue__name"]
	date_hierarchy = "scheduled_at"
	ordering = ["-scheduled_at"]

	def get_queryset(self, request):
		qs = super().get_queryset(request).select_related("fixture", "venue")
		if request.user.is_superuser:
			return qs
		if request.user.is_staff:
			return qs.filter(fixture__event__created_by=request.user)
		return qs.none()
