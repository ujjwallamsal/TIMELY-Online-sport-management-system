from django.contrib import admin
from django.utils import timezone
from .models import Registration

@admin.action(description="Approve selected registrations")
def approve_registrations(modeladmin, request, queryset):
	count = 0
	for reg in queryset.select_related("event"):
		if reg.status == Registration.Status.PENDING or reg.status == Registration.Status.KYC_PENDING:
			reg.status = Registration.Status.CONFIRMED
			reg.reviewed_by = request.user
			reg.reviewed_at = timezone.now()
			reg.save()
			count += 1
	modeladmin.message_user(request, f"Approved {count} registration(s)")

@admin.action(description="Reject selected registrations")
def reject_registrations(modeladmin, request, queryset):
	updated = queryset.update(status=Registration.Status.REJECTED, reviewed_by=None, reviewed_at=timezone.now())
	modeladmin.message_user(request, f"Rejected {updated} registration(s)")

@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
	list_display = [
		"event", "user", "registration_type", "status", "is_paid", "kyc_status", "created_at"
	]
	list_filter = ["status", "registration_type", "is_paid", "kyc_status", "created_at"]
	search_fields = ["event__name", "user__email", "team_name"]
	date_hierarchy = "created_at"
	ordering = ["-created_at"]
	actions = [approve_registrations, reject_registrations]

	def get_queryset(self, request):
		qs = super().get_queryset(request).select_related("event", "user")
		if request.user.is_superuser:
			return qs
		if request.user.is_staff:
			return qs.filter(event__created_by=request.user)
		return qs.none()

	def has_module_permission(self, request):
		return request.user.is_staff
