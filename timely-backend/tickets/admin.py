# tickets/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils import timezone

from .models import TicketType, TicketOrder, Ticket


@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'event', 'price_dollars', 'available_quantity',
        'quantity_total', 'on_sale', 'created_at'
    ]
    list_filter = [
        'on_sale', 'created_at'
    ]
    search_fields = ['name', 'event__name', 'description']
    readonly_fields = [
        'quantity_sold', 'available_quantity', 'created_at', 'updated_at'
    ]
    list_editable = ['on_sale']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('event', 'fixture', 'name', 'description')
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


@admin.register(TicketOrder)
class TicketOrderAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'event', 'status', 'total_dollars',
        'provider', 'created_at'
    ]
    list_filter = [
        'status', 'provider', 'currency', 'created_at'
    ]
    search_fields = [
        'id', 'user__email', 'event__name'
    ]
    readonly_fields = [
        'total_dollars', 'created_at', 'updated_at'
    ]
    list_editable = ['status']
    
    fieldsets = (
        ('Order Information', {
            'fields': ('user', 'event', 'fixture', 'status')
        }),
        ('Payment', {
            'fields': (
                'provider', 'provider_session_id', 'provider_payment_intent',
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
        'serial', 'order_link', 'ticket_type_name', 'status', 'issued_at', 'is_valid'
    ]
    list_filter = [
        'status', 'issued_at', 'ticket_type__name'
    ]
    search_fields = [
        'serial', 'qr_payload', 'order__id'
    ]
    readonly_fields = [
        'serial', 'qr_payload', 'issued_at', 'is_valid'
    ]
    list_editable = ['status']
    
    fieldsets = (
        ('Ticket Information', {
            'fields': ('serial', 'order', 'ticket_type', 'status')
        }),
        ('QR Code', {
            'fields': ('qr_payload',)
        }),
        ('Timing', {
            'fields': ('issued_at', 'used_at')
        }),
        ('Validation', {
            'fields': ('is_valid',)
        })
    )
    
    def order_link(self, obj):
        if obj.order:
            url = reverse('admin:tickets_ticketorder_change', args=[obj.order.id])
            return format_html('<a href="{}">{}</a>', url, obj.order.id)
        return '-'
    order_link.short_description = 'Order'
    
    def ticket_type_name(self, obj):
        return obj.ticket_type.name if obj.ticket_type else '-'
    ticket_type_name.short_description = 'Type'
    
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
