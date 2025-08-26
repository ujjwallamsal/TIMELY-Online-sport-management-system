# payments/admin.py
from django.contrib import admin
from .models import PaymentIntent, WebhookEvent, Refund

@admin.register(PaymentIntent)
class PaymentIntentAdmin(admin.ModelAdmin):
    list_display = ("id", "stripe_payment_intent_id", "amount_cents", "currency", "status", "registration", "created_at")
    list_filter = ("status", "currency", "created_at")
    search_fields = ("stripe_payment_intent_id", "registration__user__email")
    readonly_fields = ("stripe_payment_intent_id", "stripe_customer_id", "client_secret")

@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ("stripe_event_id", "event_type", "created_at", "received_at", "processed")
    list_filter = ("event_type", "processed", "created_at")
    search_fields = ("stripe_event_id", "event_type")
    readonly_fields = ("stripe_event_id", "event_type", "api_version", "created_at", "received_at", "data")

@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ("id", "stripe_refund_id", "amount_cents", "currency", "status", "registration", "created_at")
    list_filter = ("status", "currency", "created_at")
    search_fields = ("stripe_refund_id", "registration__user__email")
    readonly_fields = ("stripe_refund_id", "stripe_payment_intent_id")
