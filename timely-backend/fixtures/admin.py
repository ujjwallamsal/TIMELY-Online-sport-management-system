from django.contrib import admin
from .models import Fixture

@admin.register(Fixture)
class FixtureAdmin(admin.ModelAdmin):
	list_display = ["event", "round", "home", "away", "venue", "start_at", "status"]
	list_filter = ["status", "phase", "event", "venue", "start_at"]
	search_fields = ["event__name", "venue__name", "home__name", "away__name"]
	date_hierarchy = "start_at"
	ordering = ["-start_at"]

	def get_queryset(self, request):
		qs = super().get_queryset(request).select_related("event", "venue", "home", "away")
		if request.user.is_superuser:
			return qs
		if request.user.is_staff:
			return qs.filter(event__created_by=request.user)
		return qs.none()

