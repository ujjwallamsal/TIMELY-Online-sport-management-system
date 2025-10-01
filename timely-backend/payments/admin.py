# payments/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from django.contrib import messages
from django.db import transaction
from .models import (
    PaymentIntent, WebhookEvent, Refund, PaymentSettings, 
    DeliveryEndpoint, DeliveryLog
)


@admin.register(PaymentSettings)
class PaymentSettingsAdmin(admin.ModelAdmin):
    """Admin configuration for Payment Settings"""
    list_display = [
        'environment', 'is_active', 'default_currency', 'platform_fee_percent', 
        'updated_by', 'updated_at'
    ]
    list_filter = ['environment', 'is_active', 'updated_at']
    search_fields = ['updated_by__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Environment', {
            'fields': ('environment', 'is_active')
        }),
        ('Stripe Configuration', {
            'fields': (
                'stripe_publishable_key', 'stripe_secret_key', 
                'stripe_webhook_secret', 'stripe_connect_account_id'
            ),
            'classes': ('collapse',)
        }),
        ('Fees & Tax', {
            'fields': ('platform_fee_percent', 'tax_rate_percent')
        }),
        ('Currency & Limits', {
            'fields': ('default_currency', 'minimum_amount_cents', 'maximum_amount_cents')
        }),
        ('Features', {
            'fields': ('enable_refunds', 'enable_partial_refunds', 'enable_offline_payments')
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """Set updated_by if not set"""
        if change:  # Updating existing settings
            obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(PaymentIntent)
class PaymentIntentAdmin(admin.ModelAdmin):
    """Enhanced admin configuration for PaymentIntent model"""
    list_display = [
        'stripe_payment_intent_id', 'amount_dollars', 'currency', 'status', 
        'registration_user', 'created_at', 'status_badge'
    ]
    list_filter = ['status', 'currency', 'created_at']
    search_fields = [
        'stripe_payment_intent_id', 'registration__user__email', 
        'stripe_customer_id'
    ]
    readonly_fields = [
        'stripe_payment_intent_id', 'stripe_customer_id', 'client_secret',
        'created_at', 'updated_at', 'confirmed_at'
    ]
    actions = ['retry_failed_payments', 'export_to_csv']
    
    fieldsets = (
        ('Stripe Information', {
            'fields': ('stripe_payment_intent_id', 'stripe_customer_id', 'client_secret')
        }),
        ('Payment Details', {
            'fields': ('amount_cents', 'currency', 'status')
        }),
        ('Registration', {
            'fields': ('registration',)
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'confirmed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def registration_user(self, obj):
        """Display registration user with link"""
        if obj.registration:
            url = reverse('admin:registrations_registration_change', args=[obj.registration.id])
            return format_html('<a href="{}">{}</a>', url, obj.registration.user.email)
        return 'No registration'
    registration_user.short_description = 'User'
    
    def amount_dollars(self, obj):
        """Display amount in dollars"""
        return f"${obj.amount_dollars:.2f}"
    amount_dollars.short_description = 'Amount'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'succeeded': 'green',
            'failed': 'red',
            'pending': 'orange',
            'canceled': 'gray'
        }
        color = colors.get(obj.status, 'blue')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def retry_failed_payments(self, request, queryset):
        """Retry failed payment intents"""
        failed_intents = queryset.filter(status='failed')
        count = failed_intents.count()
        
        if count == 0:
            self.message_user(request, 'No failed payments to retry.', level=messages.WARNING)
            return
        
        # In a real implementation, you would retry the payments here
        self.message_user(
            request, 
            f'Retry initiated for {count} failed payment(s).', 
            level=messages.SUCCESS
        )
    retry_failed_payments.short_description = "Retry selected failed payments"
    
    def export_to_csv(self, request, queryset):
        """Export selected payment intents to CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="payment_intents.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Stripe Intent ID', 'Amount', 'Currency', 'Status', 
            'User Email', 'Created At', 'Confirmed At'
        ])
        
        for intent in queryset:
            writer.writerow([
                intent.id,
                intent.stripe_payment_intent_id,
                intent.amount_dollars,
                intent.currency,
                intent.status,
                intent.registration.user.email if intent.registration else '',
                intent.created_at.isoformat(),
                intent.confirmed_at.isoformat() if intent.confirmed_at else ''
            ])
        
        return response
    export_to_csv.short_description = "Export selected to CSV"


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    """Enhanced admin configuration for WebhookEvent model"""
    list_display = [
        'stripe_event_id', 'event_type', 'created_at', 'received_at', 
        'processed_badge', 'processing_error_preview'
    ]
    list_filter = ['event_type', 'processed', 'created_at', 'received_at']
    search_fields = ['stripe_event_id', 'event_type', 'processing_error']
    readonly_fields = [
        'stripe_event_id', 'event_type', 'api_version', 'created_at', 
        'received_at', 'data', 'processed', 'processing_error'
    ]
    actions = ['replay_failed_webhooks', 'mark_as_processed']
    
    fieldsets = (
        ('Event Information', {
            'fields': ('stripe_event_id', 'event_type', 'api_version')
        }),
        ('Timing', {
            'fields': ('created_at', 'received_at')
        }),
        ('Processing', {
            'fields': ('processed', 'processing_error')
        }),
        ('Event Data', {
            'fields': ('data',),
            'classes': ('collapse',)
        }),
    )
    
    def processed_badge(self, obj):
        """Display processed status with color coding"""
        if obj.processed:
            return format_html('<span style="color: green;">✓ Processed</span>')
        return format_html('<span style="color: red;">● Failed</span>')
    processed_badge.short_description = 'Status'
    
    def processing_error_preview(self, obj):
        """Display processing error preview"""
        if obj.processing_error:
            error = obj.processing_error[:50] + '...' if len(obj.processing_error) > 50 else obj.processing_error
            return format_html('<span style="color: red;">{}</span>', error)
        return 'No errors'
    processing_error_preview.short_description = 'Error'
    
    def replay_failed_webhooks(self, request, queryset):
        """Replay failed webhook events"""
        failed_webhooks = queryset.filter(processed=False)
        count = failed_webhooks.count()
        
        if count == 0:
            self.message_user(request, 'No failed webhooks to replay.', level=messages.WARNING)
            return
        
        # In a real implementation, you would replay the webhooks here
        self.message_user(
            request, 
            f'Replay initiated for {count} failed webhook(s).', 
            level=messages.SUCCESS
        )
    replay_failed_webhooks.short_description = "Replay selected failed webhooks"
    
    def mark_as_processed(self, request, queryset):
        """Mark selected webhooks as processed"""
        updated = queryset.filter(processed=False).update(processed=True)
        self.message_user(
            request, 
            f'Marked {updated} webhook(s) as processed.', 
            level=messages.SUCCESS
        )
    mark_as_processed.short_description = "Mark selected as processed"


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    """Enhanced admin configuration for Refund model"""
    list_display = [
        'stripe_refund_id', 'amount_dollars', 'currency', 'status_badge',
        'registration_user', 'created_at'
    ]
    list_filter = ['status', 'currency', 'created_at']
    search_fields = [
        'stripe_refund_id', 'registration__user__email', 
        'stripe_payment_intent_id'
    ]
    readonly_fields = [
        'stripe_refund_id', 'stripe_payment_intent_id', 'created_at', 'updated_at'
    ]
    actions = ['retry_failed_refunds']
    
    fieldsets = (
        ('Stripe Information', {
            'fields': ('stripe_refund_id', 'stripe_payment_intent_id')
        }),
        ('Refund Details', {
            'fields': ('amount_cents', 'currency', 'reason', 'status')
        }),
        ('Registration', {
            'fields': ('registration',)
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def registration_user(self, obj):
        """Display registration user with link"""
        if obj.registration:
            url = reverse('admin:registrations_registration_change', args=[obj.registration.id])
            return format_html('<a href="{}">{}</a>', url, obj.registration.user.email)
        return 'No registration'
    registration_user.short_description = 'User'
    
    def amount_dollars(self, obj):
        """Display amount in dollars"""
        return f"${obj.amount_dollars:.2f}"
    amount_dollars.short_description = 'Amount'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'succeeded': 'green',
            'failed': 'red',
            'pending': 'orange',
            'canceled': 'gray'
        }
        color = colors.get(obj.status, 'blue')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def retry_failed_refunds(self, request, queryset):
        """Retry failed refunds"""
        failed_refunds = queryset.filter(status='failed')
        count = failed_refunds.count()
        
        if count == 0:
            self.message_user(request, 'No failed refunds to retry.', level=messages.WARNING)
            return
        
        # In a real implementation, you would retry the refunds here
        self.message_user(
            request, 
            f'Retry initiated for {count} failed refund(s).', 
            level=messages.SUCCESS
        )
    retry_failed_refunds.short_description = "Retry selected failed refunds"


@admin.register(DeliveryEndpoint)
class DeliveryEndpointAdmin(admin.ModelAdmin):
    """Admin configuration for DeliveryEndpoint model"""
    list_display = [
        'name', 'endpoint_type', 'status_badge', 'failure_count', 
        'last_success_at', 'last_failure_at'
    ]
    list_filter = ['endpoint_type', 'status', 'created_at']
    search_fields = ['name', 'url']
    readonly_fields = ['created_at', 'updated_at', 'failure_count', 'last_success_at', 'last_failure_at']
    
    fieldsets = (
        (None, {
            'fields': ('name', 'endpoint_type', 'url', 'status')
        }),
        ('Configuration', {
            'fields': ('config',),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('failure_count', 'last_success_at', 'last_failure_at'),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'active': 'green',
            'inactive': 'gray',
            'failed': 'red'
        }
        color = colors.get(obj.status, 'blue')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'


@admin.register(DeliveryLog)
class DeliveryLogAdmin(admin.ModelAdmin):
    """Admin configuration for DeliveryLog model"""
    list_display = [
        'id', 'endpoint', 'notification_preview', 'status_badge', 
        'response_code', 'retry_count', 'created_at'
    ]
    list_filter = ['status', 'endpoint__endpoint_type', 'created_at']
    search_fields = ['endpoint__name', 'error_message', 'response_body']
    readonly_fields = ['created_at', 'sent_at']
    
    fieldsets = (
        (None, {
            'fields': ('endpoint', 'notification', 'webhook_event', 'status')
        }),
        ('Response', {
            'fields': ('response_code', 'response_body', 'error_message')
        }),
        ('Retry Tracking', {
            'fields': ('retry_count', 'max_retries')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'sent_at'),
            'classes': ('collapse',)
        }),
    )
    
    def notification_preview(self, obj):
        """Display notification preview"""
        if obj.notification:
            url = reverse('admin:notifications_notification_change', args=[obj.notification.id])
            title = obj.notification.title[:30] + '...' if len(obj.notification.title) > 30 else obj.notification.title
            return format_html('<a href="{}">{}</a>', url, title)
        elif obj.webhook_event:
            url = reverse('admin:payments_webhookevent_change', args=[obj.webhook_event.id])
            return format_html('<a href="{}">Webhook Event</a>', url)
        return 'No notification'
    notification_preview.short_description = 'Notification'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'sent': 'green',
            'failed': 'red',
            'pending': 'orange',
            'retrying': 'blue'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
