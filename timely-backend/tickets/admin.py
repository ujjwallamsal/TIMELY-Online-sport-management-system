# tickets/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils import timezone

from .models import TicketType, TicketOrder, Ticket, Purchase


@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'event_id', 'price_dollars', 'available_quantity',
        'quantity_total', 'on_sale', 'created_at'
    ]
    list_filter = [
        'on_sale', 'created_at'
    ]
    search_fields = ['name', 'description']
    readonly_fields = [
        'quantity_sold', 'available_quantity', 'created_at', 'updated_at'
    ]
    list_editable = ['on_sale']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('event_id', 'fixture_id', 'name', 'description')
        }),
        ('Pricing', {
            'fields': ('price_cents', 'currency')
        }),
        ('Availability', {
            'fields': ('quantity_total', 'quantity_sold', 'available_quantity')
        }),
        ('Status', {
            'fields': ('on_sale',)
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def price_dollars(self, obj):
        return f"${obj.price_dollars:.2f}"
    price_dollars.short_description = 'Price'
    
    def available_quantity(self, obj):
        return obj.available_quantity
    available_quantity.short_description = 'Available'


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'event_id', 'status', 'amount_dollars', 'currency', 'created_at'
    ]
    list_filter = [
        'status', 'currency', 'created_at'
    ]
    search_fields = [
        'id', 'user__email', 'intent_id'
    ]
    readonly_fields = [
        'amount_dollars', 'created_at', 'updated_at'
    ]
    list_editable = ['status']
    
    fieldsets = (
        ('Purchase Information', {
            'fields': ('user', 'event_id', 'status')
        }),
        ('Payment', {
            'fields': ('intent_id', 'amount', 'currency')
        }),
        ('Timing', {
            'fields': ('created_at', 'updated_at')
        })
    )
    
    def amount_dollars(self, obj):
        return f"${obj.amount_dollars:.2f}"
    amount_dollars.short_description = 'Amount'


@admin.register(TicketOrder)
class TicketOrderAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'event_id', 'status', 'total_dollars',
        'payment_provider', 'created_at'
    ]
    list_filter = [
        'status', 'payment_provider', 'currency', 'created_at'
    ]
    search_fields = [
        'id', 'user__email'
    ]
    readonly_fields = [
        'total_dollars', 'created_at', 'updated_at'
    ]
    list_editable = ['status']
    
    fieldsets = (
        ('Order Information', {
            'fields': ('user', 'event_id', 'fixture_id', 'status')
        }),
        ('Payment', {
            'fields': (
                'payment_provider', 'provider_session_id', 'provider_payment_intent_id',
                'total_cents', 'currency'
            )
        }),
        ('Timing', {
            'fields': ('created_at', 'updated_at')
        })
    )
    
    def total_dollars(self, obj):
        return f"${obj.total_dollars:.2f}"
    total_dollars.short_description = 'Amount'


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        'code', 'purchase_link', 'status', 'created_at', 'is_valid'
    ]
    list_filter = [
        'status', 'created_at'
    ]
    search_fields = [
        'code', 'qr_payload', 'purchase__id'
    ]
    readonly_fields = [
        'code', 'qr_payload', 'created_at', 'is_valid'
    ]
    list_editable = ['status']
    
    fieldsets = (
        ('Ticket Information', {
            'fields': ('code', 'purchase', 'status')
        }),
        ('QR Code', {
            'fields': ('qr_payload',)
        }),
        ('Timing', {
            'fields': ('created_at', 'used_at')
        }),
        ('Validation', {
            'fields': ('is_valid',)
        })
    )
    
    def purchase_link(self, obj):
        if obj.purchase:
            url = reverse('admin:tickets_purchase_change', args=[obj.purchase.id])
            return format_html('<a href="{}">{}</a>', url, obj.purchase.id)
        return '-'
    purchase_link.short_description = 'Purchase'
    
    def is_valid(self, obj):
        return obj.is_valid
    is_valid.boolean = True
    is_valid.short_description = 'Valid'



# Custom admin actions
@admin.action(description="Activate selected ticket types")
def activate_ticket_types(modeladmin, request, queryset):
    queryset.update(is_active=True)
    modeladmin.message_user(request, f"{queryset.count()} ticket types activated.")

@admin.action(description="Deactivate selected ticket types")
def deactivate_ticket_types(modeladmin, request, queryset):
    queryset.update(is_active=False)
    modeladmin.message_user(request, f"{queryset.count()} ticket types deactivated.")

@admin.action(description="Mark selected orders as paid")
def mark_orders_paid(modeladmin, request, queryset):
    for order in queryset:
        if order.status == TicketOrder.Status.PENDING:
            order.status = TicketOrder.Status.PAID
            order.payment_date = timezone.now()
            order.save()
    modeladmin.message_user(request, f"{queryset.count()} orders marked as paid.")

# Add actions to admin classes
TicketTypeAdmin.actions = [activate_ticket_types, deactivate_ticket_types]
TicketOrderAdmin.actions = [mark_orders_paid]
