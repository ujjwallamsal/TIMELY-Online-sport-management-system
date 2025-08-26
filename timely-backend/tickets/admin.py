# tickets/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils import timezone

from .models import TicketType, TicketOrder, Ticket, PaymentRecord


@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'event', 'category', 'price_dollars', 'available_quantity',
        'total_quantity', 'is_active', 'sale_start', 'sale_end'
    ]
    list_filter = [
        'category', 'is_active', 'includes_seating', 'includes_amenities',
        'is_transferable', 'created_at'
    ]
    search_fields = ['name', 'event__name', 'description']
    readonly_fields = [
        'sold_quantity', 'available_quantity', 'created_at', 'updated_at'
    ]
    list_editable = ['is_active']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('event', 'name', 'category', 'description')
        }),
        ('Pricing', {
            'fields': ('price_cents', 'currency')
        }),
        ('Availability', {
            'fields': ('total_quantity', 'sold_quantity', 'available_quantity', 'max_per_order')
        }),
        ('Timing', {
            'fields': ('sale_start', 'sale_end')
        }),
        ('Features', {
            'fields': ('includes_seating', 'includes_amenities', 'is_transferable')
        }),
        ('Status', {
            'fields': ('is_active',)
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


@admin.register(TicketOrder)
class TicketOrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number', 'customer_name', 'event', 'status', 'payment_amount_dollars',
        'total_tickets', 'payment_provider', 'created_at'
    ]
    list_filter = [
        'status', 'payment_provider', 'payment_currency', 'created_at'
    ]
    search_fields = [
        'order_number', 'customer_name', 'customer_email', 'event__name'
    ]
    readonly_fields = [
        'order_number', 'total_tickets', 'payment_amount_dollars', 'created_at', 'updated_at'
    ]
    list_editable = ['status']
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order_number', 'customer', 'event', 'status')
        }),
        ('Customer Details', {
            'fields': ('customer_name', 'customer_email', 'customer_phone', 'notes')
        }),
        ('Payment', {
            'fields': (
                'payment_provider', 'provider_reference', 'payment_amount_cents',
                'payment_currency', 'payment_date'
            )
        }),
        ('Timing', {
            'fields': ('created_at', 'updated_at', 'expires_at')
        }),
        ('Tickets', {
            'fields': ('total_tickets',)
        })
    )
    
    def payment_amount_dollars(self, obj):
        return f"${obj.payment_amount_dollars:.2f}"
    payment_amount_dollars.short_description = 'Amount'
    
    def total_tickets(self, obj):
        return obj.total_tickets
    total_tickets.short_description = 'Tickets'


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        'ticket_id', 'holder_name', 'order_link', 'event_name', 'ticket_type_name',
        'status', 'issued_at', 'expires_at', 'is_valid'
    ]
    list_filter = [
        'status', 'issued_at', 'expires_at', 'ticket_type__category'
    ]
    search_fields = [
        'ticket_id', 'holder_name', 'holder_email', 'order__order_number'
    ]
    readonly_fields = [
        'ticket_id', 'validation_hash', 'issued_at', 'is_valid', 'is_expired'
    ]
    list_editable = ['status']
    
    fieldsets = (
        ('Ticket Information', {
            'fields': ('ticket_id', 'order', 'ticket_type', 'status')
        }),
        ('Holder Details', {
            'fields': ('holder_name', 'holder_email', 'seat_number', 'section')
        }),
        ('Timing', {
            'fields': ('issued_at', 'used_at', 'expires_at')
        }),
        ('Validation', {
            'fields': ('validation_hash', 'qr_code', 'is_valid', 'is_expired')
        }),
        ('Notes', {
            'fields': ('notes',)
        })
    )
    
    def order_link(self, obj):
        if obj.order:
            url = reverse('admin:tickets_ticketorder_change', args=[obj.order.id])
            return format_html('<a href="{}">{}</a>', url, obj.order.order_number)
        return '-'
    order_link.short_description = 'Order'
    
    def event_name(self, obj):
        return obj.order.event.name if obj.order else '-'
    event_name.short_description = 'Event'
    
    def ticket_type_name(self, obj):
        return obj.ticket_type.name if obj.ticket_type else '-'
    ticket_type_name.short_description = 'Type'
    
    def is_valid(self, obj):
        return obj.is_valid
    is_valid.boolean = True
    is_valid.short_description = 'Valid'
    
    def is_expired(self, obj):
        return obj.is_expired
    is_expired.boolean = True
    is_expired.short_description = 'Expired'


@admin.register(PaymentRecord)
class PaymentRecordAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'order_link', 'provider', 'provider_reference', 'amount_dollars',
        'currency', 'status', 'created_at', 'processed_at'
    ]
    list_filter = [
        'provider', 'status', 'currency', 'created_at', 'processed_at'
    ]
    search_fields = [
        'provider_reference', 'order__order_number', 'order__customer_name'
    ]
    readonly_fields = [
        'created_at', 'updated_at', 'amount_dollars'
    ]
    list_editable = ['status']
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('order', 'provider', 'provider_reference', 'status')
        }),
        ('Amount', {
            'fields': ('amount_cents', 'currency', 'amount_dollars')
        }),
        ('Timing', {
            'fields': ('created_at', 'updated_at', 'processed_at')
        }),
        ('Provider Data', {
            'fields': ('provider_data',)
        }),
        ('Error Information', {
            'fields': ('error_message', 'error_code')
        })
    )
    
    def order_link(self, obj):
        if obj.order:
            url = reverse('admin:tickets_ticketorder_change', args=[obj.order.id])
            return format_html('<a href="{}">{}</a>', url, obj.order.order_number)
        return '-'
    order_link.short_description = 'Order'
    
    def amount_dollars(self, obj):
        return f"${obj.amount_dollars:.2f}"
    amount_dollars.short_description = 'Amount'


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
