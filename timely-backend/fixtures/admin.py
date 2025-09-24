from django.contrib import admin
from .models import Fixture

@admin.action(description="Finalize results for selected fixtures")
def finalize_fixtures(modeladmin, request, queryset):
	updated = queryset.update(status=Fixture.Status.COMPLETED)
	modeladmin.message_user(request, f"Finalized {updated} fixture(s)")

@admin.register(Fixture)
class FixtureAdmin(admin.ModelAdmin):
	list_display = ["event", "round", "home", "away", "venue", "start_at", "status"]
	list_filter = ["status", "phase", "event", "venue", "start_at"]
	search_fields = ["event__name", "venue__name", "home__name", "away__name"]
	date_hierarchy = "start_at"
	ordering = ["-start_at"]
	actions = [finalize_fixtures]
	readonly_fields = ["created_at", "updated_at"]

	def get_queryset(self, request):
		qs = super().get_queryset(request).select_related("event", "venue", "home", "away")
		if request.user.is_superuser:
			return qs
		if request.user.is_staff:
			return qs.filter(event__created_by=request.user)
		return qs.none()

