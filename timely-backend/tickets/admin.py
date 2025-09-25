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


@admin.register(TicketOrder)
class TicketOrderAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'event_id', 'fixture_id', 'status', 'total_dollars',
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

    actions = ['mark_paid', 'mark_refunded', 'mark_cancelled', 'export_selected_to_csv']

    def mark_paid(self, request, queryset):
        queryset.update(status='paid')
    mark_paid.short_description = 'Mark selected as Paid'

    def mark_refunded(self, request, queryset):
        queryset.update(status='refunded')
    mark_refunded.short_description = 'Mark selected as Refunded'

    def mark_cancelled(self, request, queryset):
        queryset.update(status='failed')
    mark_cancelled.short_description = 'Mark selected as Cancelled'

    def export_selected_to_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename=ticket_orders.csv'
        writer = csv.writer(response)
        writer.writerow(['id','user','event_id','fixture_id','status','total_cents','currency','provider','created_at'])
        for o in queryset:
            writer.writerow([o.id, o.user.email, o.event_id, o.fixture_id, o.status, o.total_cents, o.currency, o.payment_provider, o.created_at.isoformat()])
        return response
    export_selected_to_csv.short_description = 'Export selected to CSV'


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        'serial', 'order_link', 'status', 'issued_at', 'is_valid'
    ]
    list_filter = [
        'status'
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
    
    def is_valid(self, obj):
        return obj.is_valid
    is_valid.boolean = True
    is_valid.short_description = 'Valid'



# Remove broken custom actions that referenced non-existent fields
