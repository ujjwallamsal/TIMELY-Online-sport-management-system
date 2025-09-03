from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
	list_display = ["user", "title", "kind", "topic", "read_at", "created_at"]
	list_filter = ["kind", "topic", "read_at", "created_at"]
	search_fields = ["user__email", "title", "body"]
	ordering = ["-created_at"]
