from django.contrib import admin
from django import forms
from django.core.exceptions import ValidationError
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

class RegistrationAdminForm(forms.ModelForm):
	class Meta:
		model = Registration
		fields = "__all__"

	def clean(self):
		cleaned_data = super().clean()
		applicant_user = cleaned_data.get("applicant_user")
		applicant_team = cleaned_data.get("applicant_team")
		legacy_applicant = cleaned_data.get("applicant")
		legacy_team = cleaned_data.get("team")
		reg_type = cleaned_data.get("type")

		# 1) Normalize based on Type first
		if reg_type == Registration.Type.ATHLETE:
			# Clear team when athlete
			cleaned_data["applicant_team"] = None
			applicant_team = None
		elif reg_type == Registration.Type.TEAM:
			# Clear user when team
			cleaned_data["applicant_user"] = None
			applicant_user = None
		elif reg_type == Registration.Type.SPECTATOR:
			# Spectator has neither user nor team
			cleaned_data["applicant_user"] = None
			cleaned_data["applicant_team"] = None
			applicant_user = None
			applicant_team = None

		# 2) Migrate legacy fields into the correct new field based on Type
		if reg_type == Registration.Type.ATHLETE and not applicant_user and legacy_applicant:
			applicant_user = cleaned_data["applicant_user"] = legacy_applicant
		if reg_type == Registration.Type.TEAM and not applicant_team and legacy_team:
			applicant_team = cleaned_data["applicant_team"] = legacy_team

		# Always clear legacy fields so they don't persist
		cleaned_data["applicant"] = None
		cleaned_data["team"] = None

		# 3) Enforce rules after normalization/migration
		if reg_type in (Registration.Type.ATHLETE, Registration.Type.TEAM):
			if bool(applicant_user) == bool(applicant_team):
				raise ValidationError("Exactly one of applicant_user or applicant_team must be set.")
		elif reg_type == Registration.Type.SPECTATOR:
			# For spectator, both must be empty
			if applicant_user or applicant_team:
				raise ValidationError("Spectator registrations must not have an applicant user or team.")

		return cleaned_data


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
	form = RegistrationAdminForm
	exclude = ["applicant", "team"]
	list_display = [
		"event", "applicant_name", "type", "status", "submitted_at"
	]
	list_filter = ["status", "type", "submitted_at"]
	search_fields = [
		"event__name",
		"applicant_user__email",
		"applicant_team__name",
		# legacy fallbacks during transition
		"applicant__email",
		"team__name",
	]
	date_hierarchy = "submitted_at"
	ordering = ["-submitted_at"]
	actions = [approve_registrations, reject_registrations]

	def get_queryset(self, request):
		qs = (
			super()
			.get_queryset(request)
			.select_related("event", "applicant_user", "applicant_team", "applicant")
		)
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

	def save_model(self, request, obj, form, change):
		# Enforce XOR normalization before saving (also migrate legacy fields defensively)
		if obj.type == Registration.Type.ATHLETE:
			# Migrate legacy applicant if needed
			if obj.applicant_user is None and obj.applicant is not None:
				obj.applicant_user = obj.applicant
			obj.applicant_team = None
		elif obj.type == Registration.Type.TEAM:
			# Migrate legacy team if needed
			if obj.applicant_team is None and obj.team is not None:
				obj.applicant_team = obj.team
			obj.applicant_user = None
		elif obj.type == Registration.Type.SPECTATOR:
			# Ensure neither is set
			obj.applicant_user = None
			obj.applicant_team = None

		# Clear legacy fields to avoid confusion going forward
		obj.applicant = None
		obj.team = None

		# Enforce final invariants based on type
		if obj.type in (Registration.Type.ATHLETE, Registration.Type.TEAM):
			if bool(obj.applicant_user) == bool(obj.applicant_team):
				raise ValidationError("Exactly one of applicant_user or applicant_team must be set.")
		elif obj.type == Registration.Type.SPECTATOR:
			if obj.applicant_user or obj.applicant_team:
				raise ValidationError("Spectator registrations must not have an applicant user or team.")

		# Full clean to ensure DB constraint alignment
		# Do not call full_clean here; admin form already validated and DB constraint will enforce
		super().save_model(request, obj, form, change)