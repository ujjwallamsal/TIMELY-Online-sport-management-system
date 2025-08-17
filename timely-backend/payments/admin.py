# payments/admin.py
from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "status", "amount_cents", "currency", "user", "registration", "ticket", "created_at")
    list_filter = ("status", "currency", "created_at")
    search_fields = ("provider_ref", "user__email")
