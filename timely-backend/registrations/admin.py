from django.contrib import admin
from django.utils import timezone
from .models import Registration

@admin.action(description="Approve selected registrations")
def approve_registrations(modeladmin, request, queryset):
	count = 0
	for reg in queryset.select_related("event"):
		if reg.status == Registration.Status.PENDING:
			reg.status = Registration.Status.APPROVED
			reg.decided_by = request.user
			reg.decided_at = timezone.now()
			reg.save()
			count += 1
	modeladmin.message_user(request, f"Approved {count} registration(s)")

@admin.action(description="Reject selected registrations")
def reject_registrations(modeladmin, request, queryset):
	updated = queryset.update(status=Registration.Status.REJECTED, decided_by=None, decided_at=timezone.now())
	modeladmin.message_user(request, f"Rejected {updated} registration(s)")

@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
	list_display = [
		"event", "applicant", "type", "status", "submitted_at"
	]
	list_filter = ["status", "type", "submitted_at"]
	search_fields = ["event__name", "applicant__email", "team__name"]
	date_hierarchy = "submitted_at"
	ordering = ["-submitted_at"]
	actions = [approve_registrations, reject_registrations]

	def get_queryset(self, request):
		qs = super().get_queryset(request).select_related("event", "applicant")
		if request.user.is_superuser:
			return qs
		if request.user.is_staff:
			return qs.filter(event__created_by=request.user)
		return qs.none()

	def has_module_permission(self, request):
		return request.user.is_staff
	
	def has_delete_permission(self, request, obj=None):
		# Prevent deleting registrations that have associated payments
		if obj and hasattr(obj, 'payments') and obj.payments.exists():
			return False
		return super().has_delete_permission(request, obj)