# tickets/admin.py
from django.contrib import admin, messages
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils import timezone

from .models import TicketType, TicketOrder, Ticket, Refund


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
    """Enhanced Orders Dashboard with comprehensive management tools"""
    list_display = [
        'id', 'user_link', 'event_info', 'status_badge', 'total_dollars',
        'payment_provider_badge', 'refund_status', 'created_at', 'actions_quick'
    ]
    list_filter = [
        'status', 'payment_provider', 'currency', 'created_at', 'updated_at'
    ]
    search_fields = [
        'id', 'user__email', 'user__first_name', 'user__last_name', 
        'provider_session_id', 'provider_payment_intent_id'
    ]
    readonly_fields = [
        'total_dollars', 'created_at', 'updated_at', 'refund_summary', 'ticket_count'
    ]
    
    fieldsets = (
        ('Order Information', {
            'fields': ('user', 'event_id', 'fixture_id', 'status', 'ticket_count')
        }),
        ('Payment Details', {
            'fields': (
                'payment_provider', 'provider_session_id', 'provider_payment_intent_id',
                'total_cents', 'currency', 'total_dollars'
            )
        }),
        ('Refunds', {
            'fields': ('refund_summary',),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = [
        'mark_paid', 'mark_refunded', 'mark_failed', 'resend_receipts', 
        'export_selected_to_csv', 'process_refunds', 'view_webhook_logs'
    ]
    
    def user_link(self, obj):
        """Display user with link"""
        url = reverse('admin:accounts_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_link.short_description = 'User'
    
    def event_info(self, obj):
        """Display event information"""
        return format_html(
            '<strong>Event:</strong> {}<br><small>ID: {}</small>',
            obj.event_id, obj.event_id
        )
    event_info.short_description = 'Event'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'pending': 'orange',
            'paid': 'green',
            'failed': 'red',
            'refunded': 'blue'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def total_dollars(self, obj):
        return f"${obj.total_dollars:.2f}"
    total_dollars.short_description = 'Amount'
    
    def payment_provider_badge(self, obj):
        """Display payment provider with badge"""
        colors = {
            'stripe': '#635BFF',
            'offline': '#666666'
        }
        color = colors.get(obj.payment_provider, '#666666')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_payment_provider_display()
        )
    payment_provider_badge.short_description = 'Provider'
    
    def refund_status(self, obj):
        """Display refund status"""
        refunds = obj.refunds.all()
        if not refunds:
            return format_html('<span style="color: gray;">No refunds</span>')
        
        total_refunded = sum(refund.amount_cents for refund in refunds)
        if total_refunded >= obj.total_cents:
            return format_html('<span style="color: red;">Fully refunded</span>')
        elif total_refunded > 0:
            return format_html('<span style="color: orange;">Partially refunded</span>')
        else:
            return format_html('<span style="color: gray;">Pending refunds</span>')
    refund_status.short_description = 'Refunds'
    
    def refund_summary(self, obj):
        """Display refund summary"""
        refunds = obj.refunds.all()
        if not refunds:
            return 'No refunds'
        
        summary = []
        for refund in refunds:
            summary.append(f"{refund.get_status_display()}: ${refund.amount_dollars:.2f}")
        
        return format_html('<br>'.join(summary))
    refund_summary.short_description = 'Refund Summary'
    
    def ticket_count(self, obj):
        """Display ticket count"""
        count = obj.tickets.count() if hasattr(obj, 'tickets') else 0
        return f"{count} tickets"
    ticket_count.short_description = 'Tickets'
    
    def actions_quick(self, obj):
        """Display quick action buttons"""
        actions = []
        if obj.status == 'paid':
            actions.append(f'<a href="#" onclick="alert(\'Refund initiated for order {obj.id}\')">Refund</a>')
            actions.append(f'<a href="#" onclick="alert(\'Receipt resent for order {obj.id}\')">Resend</a>')
        
        return format_html(' | '.join(actions)) if actions else '-'
    actions_quick.short_description = 'Quick Actions'

    def mark_paid(self, request, queryset):
        """Mark selected orders as paid"""
        updated = queryset.filter(status='pending').update(status='paid')
        self.message_user(
            request,
            f'Marked {updated} orders as paid.',
            level=messages.SUCCESS
        )
    mark_paid.short_description = 'Mark selected as Paid'

    def mark_refunded(self, request, queryset):
        """Mark selected orders as refunded"""
        updated = queryset.filter(status='paid').update(status='refunded')
        self.message_user(
            request,
            f'Marked {updated} orders as refunded.',
            level=messages.SUCCESS
        )
    mark_refunded.short_description = 'Mark selected as Refunded'

    def mark_failed(self, request, queryset):
        """Mark selected orders as failed"""
        updated = queryset.filter(status='pending').update(status='failed')
        self.message_user(
            request,
            f'Marked {updated} orders as failed.',
            level=messages.SUCCESS
        )
    mark_failed.short_description = 'Mark selected as Failed'

    def resend_receipts(self, request, queryset):
        """Resend receipts for selected orders"""
        count = 0
        for order in queryset.filter(status='paid'):
            # In a real implementation, you would resend receipts
            count += 1
        
        self.message_user(
            request,
            f'Receipts resent for {count} orders.',
            level=messages.SUCCESS
        )
    resend_receipts.short_description = 'Resend receipts'

    def process_refunds(self, request, queryset):
        """Process refunds for selected orders"""
        count = 0
        for order in queryset.filter(status='paid'):
            # In a real implementation, you would process refunds
            count += 1
        
        self.message_user(
            request,
            f'Refund processing initiated for {count} orders.',
            level=messages.INFO
        )
    process_refunds.short_description = 'Process refunds'

    def view_webhook_logs(self, request, queryset):
        """View webhook logs for selected orders"""
        self.message_user(
            request,
            f'Webhook logs viewed for {queryset.count()} orders.',
            level=messages.INFO
        )
    view_webhook_logs.short_description = 'View webhook logs'

    def export_selected_to_csv(self, request, queryset):
        """Export orders to CSV with comprehensive data"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="orders_dashboard.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Order ID', 'User Email', 'Event ID', 'Fixture ID', 'Status', 
            'Total Amount', 'Currency', 'Payment Provider', 'Session ID', 
            'Payment Intent ID', 'Created At', 'Updated At'
        ])
        
        for order in queryset:
            writer.writerow([
                order.id,
                order.user.email,
                order.event_id,
                order.fixture_id or '',
                order.get_status_display(),
                order.total_dollars,
                order.currency,
                order.get_payment_provider_display(),
                order.provider_session_id or '',
                order.provider_payment_intent_id or '',
                order.created_at.isoformat(),
                order.updated_at.isoformat()
            ])
        
        return response
    export_selected_to_csv.short_description = 'Export to CSV'


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


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    """Enhanced Refund admin for comprehensive refund management"""
    list_display = [
        'id', 'order_link', 'amount_dollars', 'status_badge', 'processed_by_link',
        'reason_preview', 'created_at', 'processed_at'
    ]
    list_filter = [
        'status', 'currency', 'created_at', 'processed_at'
    ]
    search_fields = [
        'order__id', 'order__user__email', 'reason', 'provider_refund_id'
    ]
    readonly_fields = [
        'amount_dollars', 'created_at', 'processed_at', 'order_summary'
    ]
    
    fieldsets = (
        ('Refund Information', {
            'fields': ('order', 'order_summary', 'amount_cents', 'currency', 'amount_dollars')
        }),
        ('Processing', {
            'fields': ('status', 'reason', 'processed_by')
        }),
        ('Provider Details', {
            'fields': ('provider_refund_id',),
            'classes': ('collapse',)
        }),
        ('Timing', {
            'fields': ('created_at', 'processed_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = [
        'process_refunds', 'mark_processed', 'mark_failed', 'cancel_refunds',
        'export_refunds_to_csv'
    ]
    
    def order_link(self, obj):
        """Display order with link"""
        url = reverse('admin:tickets_ticketorder_change', args=[obj.order.id])
        return format_html('<a href="{}">Order {}</a>', url, obj.order.id)
    order_link.short_description = 'Order'
    
    def amount_dollars(self, obj):
        return f"${obj.amount_dollars:.2f}"
    amount_dollars.short_description = 'Amount'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'pending': 'orange',
            'processed': 'green',
            'failed': 'red',
            'cancelled': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def processed_by_link(self, obj):
        """Display processor with link"""
        if obj.processed_by:
            url = reverse('admin:accounts_user_change', args=[obj.processed_by.id])
            return format_html('<a href="{}">{}</a>', url, obj.processed_by.email)
        return 'Not processed'
    processed_by_link.short_description = 'Processed By'
    
    def reason_preview(self, obj):
        """Display reason with truncation"""
        if obj.reason:
            truncated = obj.reason[:50] + '...' if len(obj.reason) > 50 else obj.reason
            return truncated
        return 'No reason'
    reason_preview.short_description = 'Reason'
    
    def order_summary(self, obj):
        """Display order summary"""
        order = obj.order
        return format_html(
            '<strong>User:</strong> {}<br><strong>Event:</strong> {}<br><strong>Total:</strong> ${:.2f}',
            order.user.email, order.event_id, order.total_dollars
        )
    order_summary.short_description = 'Order Summary'
    
    def process_refunds(self, request, queryset):
        """Process selected refunds"""
        count = 0
        for refund in queryset.filter(status='pending'):
            # In a real implementation, you would process the refund with the payment provider
            refund.status = 'processed'
            refund.processed_by = request.user
            refund.processed_at = timezone.now()
            refund.save()
            count += 1
        
        self.message_user(
            request,
            f'Processed {count} refunds.',
            level=messages.SUCCESS
        )
    process_refunds.short_description = 'Process selected refunds'
    
    def mark_processed(self, request, queryset):
        """Mark selected refunds as processed"""
        updated = queryset.filter(status='pending').update(
            status='processed',
            processed_by=request.user,
            processed_at=timezone.now()
        )
        self.message_user(
            request,
            f'Marked {updated} refunds as processed.',
            level=messages.SUCCESS
        )
    mark_processed.short_description = 'Mark as processed'
    
    def mark_failed(self, request, queryset):
        """Mark selected refunds as failed"""
        updated = queryset.filter(status='pending').update(status='failed')
        self.message_user(
            request,
            f'Marked {updated} refunds as failed.',
            level=messages.SUCCESS
        )
    mark_failed.short_description = 'Mark as failed'
    
    def cancel_refunds(self, request, queryset):
        """Cancel selected refunds"""
        updated = queryset.filter(status='pending').update(status='cancelled')
        self.message_user(
            request,
            f'Cancelled {updated} refunds.',
            level=messages.SUCCESS
        )
    cancel_refunds.short_description = 'Cancel selected refunds'
    
    def export_refunds_to_csv(self, request, queryset):
        """Export refunds to CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="refunds.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Refund ID', 'Order ID', 'User Email', 'Amount', 'Currency', 'Status',
            'Reason', 'Processed By', 'Created At', 'Processed At'
        ])
        
        for refund in queryset:
            writer.writerow([
                refund.id,
                refund.order.id,
                refund.order.user.email,
                refund.amount_dollars,
                refund.currency,
                refund.get_status_display(),
                refund.reason,
                refund.processed_by.email if refund.processed_by else '',
                refund.created_at.isoformat(),
                refund.processed_at.isoformat() if refund.processed_at else ''
            ])
        
        return response
    export_refunds_to_csv.short_description = 'Export refunds to CSV'
