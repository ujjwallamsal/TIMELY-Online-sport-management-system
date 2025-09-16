# reports/pdf.py
import os
import tempfile
from datetime import datetime, timedelta
from django.conf import settings
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.db.models import Sum, Count, Q
from django.utils import timezone

from events.models import Event
from registrations.models import Registration
from tickets.models import TicketOrder, Ticket
from accounts.models import User


def generate_pdf_report(report_type, filters=None):
    """
    Generate PDF report using WeasyPrint or fallback to 501 response
    
    Args:
        report_type: Type of report to generate
        filters: Dictionary of filter parameters
        
    Returns:
        HttpResponse with PDF content or 501 error
    """
    try:
        # Try to import WeasyPrint
        from weasyprint import HTML, CSS
        from weasyprint.text.fonts import FontConfiguration
        
        # Generate report data
        report_data = get_report_data(report_type, filters)
        
        # Render HTML template
        html_content = render_to_string(
            f'reports/{report_type}_report.html',
            {'data': report_data, 'filters': filters or {}}
        )
        
        # Create CSS
        css_content = get_report_css()
        
        # Generate PDF
        font_config = FontConfiguration()
        html_doc = HTML(string=html_content)
        css_doc = CSS(string=css_content, font_config=font_config)
        
        pdf_content = html_doc.write_pdf(stylesheets=[css_doc], font_config=font_config)
        
        # Create response
        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
        
        return response
        
    except ImportError:
        # WeasyPrint not available, return 501 with helpful message
        return HttpResponse(
            'PDF generation requires WeasyPrint. Install with: pip install weasyprint',
            status=501,
            content_type='text/plain'
        )
    except Exception as e:
        return HttpResponse(
            f'PDF generation failed: {str(e)}',
            status=500,
            content_type='text/plain'
        )


def get_report_data(report_type, filters=None):
    """
    Get data for the specified report type
    
    Args:
        report_type: Type of report
        filters: Dictionary of filter parameters
        
    Returns:
        Dictionary containing report data
    """
    if report_type == 'registrations':
        return get_registrations_data(filters)
    elif report_type == 'revenue':
        return get_revenue_data(filters)
    elif report_type == 'attendance':
        return get_attendance_data(filters)
    elif report_type == 'performance':
        return get_performance_data(filters)
    else:
        raise ValueError(f"Unknown report type: {report_type}")


def get_registrations_data(filters=None):
    """Get registrations report data"""
    filters = filters or {}
    
    # Base queryset
    queryset = Registration.objects.select_related('user', 'event').all()
    
    # Apply filters
    if filters.get('event_id'):
        queryset = queryset.filter(event_id=filters['event_id'])
    
    if filters.get('date_from'):
        queryset = queryset.filter(created_at__gte=filters['date_from'])
    
    if filters.get('date_to'):
        queryset = queryset.filter(created_at__lte=filters['date_to'])
    
    if filters.get('status'):
        queryset = queryset.filter(status=filters['status'])
    
    # Get summary data
    total_registrations = queryset.count()
    
    status_breakdown = queryset.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    event_breakdown = queryset.values('event__name').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Get recent registrations
    recent_registrations = queryset.order_by('-created_at')[:50]
    
    return {
        'total_registrations': total_registrations,
        'status_breakdown': list(status_breakdown),
        'event_breakdown': list(event_breakdown),
        'recent_registrations': recent_registrations,
        'generated_at': timezone.now(),
        'filters': filters
    }


def get_revenue_data(filters=None):
    """Get revenue report data"""
    filters = filters or {}
    
    # Base queryset
    queryset = TicketOrder.objects.select_related('user', 'event').filter(
        status=TicketOrder.Status.PAID
    )
    
    # Apply filters
    if filters.get('event_id'):
        queryset = queryset.filter(event_id=filters['event_id'])
    
    if filters.get('date_from'):
        queryset = queryset.filter(created_at__gte=filters['date_from'])
    
    if filters.get('date_to'):
        queryset = queryset.filter(created_at__lte=filters['date_to'])
    
    # Get summary data
    total_revenue = queryset.aggregate(
        total=Sum('total_cents')
    )['total'] or 0
    
    total_orders = queryset.count()
    
    # Revenue by event
    event_revenue = queryset.values('event__name').annotate(
        revenue=Sum('total_cents'),
        orders=Count('id')
    ).order_by('-revenue')
    
    # Revenue by payment provider
    provider_revenue = queryset.values('payment_provider').annotate(
        revenue=Sum('total_cents'),
        orders=Count('id')
    ).order_by('-revenue')
    
    # Daily revenue (last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    daily_revenue = queryset.filter(
        created_at__gte=thirty_days_ago
    ).extra(
        select={'day': 'date(created_at)'}
    ).values('day').annotate(
        revenue=Sum('total_cents'),
        orders=Count('id')
    ).order_by('day')
    
    return {
        'total_revenue_cents': total_revenue,
        'total_revenue_dollars': total_revenue / 100,
        'total_orders': total_orders,
        'event_revenue': list(event_revenue),
        'provider_revenue': list(provider_revenue),
        'daily_revenue': list(daily_revenue),
        'generated_at': timezone.now(),
        'filters': filters
    }


def get_attendance_data(filters=None):
    """Get attendance report data"""
    filters = filters or {}
    
    # Base queryset for used tickets
    queryset = Ticket.objects.filter(status=Ticket.Status.USED).select_related(
        'order', 'order__event', 'ticket_type'
    )
    
    # Apply filters
    if filters.get('event_id'):
        queryset = queryset.filter(order__event_id=filters['event_id'])
    
    if filters.get('date_from'):
        queryset = queryset.filter(used_at__gte=filters['date_from'])
    
    if filters.get('date_to'):
        queryset = queryset.filter(used_at__lte=filters['date_to'])
    
    # Get summary data
    total_attendance = queryset.count()
    
    # Attendance by event
    event_attendance = queryset.values('order__event__name').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Attendance by ticket type
    ticket_type_attendance = queryset.values('ticket_type__name').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Daily attendance
    if filters.get('date_from') and filters.get('date_to'):
        daily_attendance = queryset.extra(
            select={'day': 'date(used_at)'}
        ).values('day').annotate(
            count=Count('id')
        ).order_by('day')
    else:
        # Last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        daily_attendance = queryset.filter(
            used_at__gte=thirty_days_ago
        ).extra(
            select={'day': 'date(used_at)'}
        ).values('day').annotate(
            count=Count('id')
        ).order_by('day')
    
    # Recent check-ins
    recent_checkins = queryset.order_by('-used_at')[:50]
    
    return {
        'total_attendance': total_attendance,
        'event_attendance': list(event_attendance),
        'ticket_type_attendance': list(ticket_type_attendance),
        'daily_attendance': list(daily_attendance),
        'recent_checkins': recent_checkins,
        'generated_at': timezone.now(),
        'filters': filters
    }


def get_performance_data(filters=None):
    """Get performance report data"""
    filters = filters or {}
    
    # This would include various performance metrics
    # For now, return basic system stats
    
    total_users = User.objects.count()
    total_events = Event.objects.count()
    total_registrations = Registration.objects.count()
    total_tickets = Ticket.objects.count()
    
    # Active users (logged in last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    active_users = User.objects.filter(
        last_login__gte=thirty_days_ago
    ).count()
    
    # Events by status
    events_by_status = Event.objects.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    # Registrations by status
    registrations_by_status = Registration.objects.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    return {
        'total_users': total_users,
        'active_users': active_users,
        'total_events': total_events,
        'total_registrations': total_registrations,
        'total_tickets': total_tickets,
        'events_by_status': list(events_by_status),
        'registrations_by_status': list(registrations_by_status),
        'generated_at': timezone.now(),
        'filters': filters
    }


def get_report_css():
    """Get CSS styles for PDF reports"""
    return """
    @page {
        size: A4;
        margin: 1in;
    }
    
    body {
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #333;
    }
    
    .header {
        text-align: center;
        margin-bottom: 2em;
        border-bottom: 2px solid #333;
        padding-bottom: 1em;
    }
    
    .header h1 {
        margin: 0;
        font-size: 24px;
        color: #333;
    }
    
    .header .subtitle {
        margin: 0.5em 0 0 0;
        font-size: 14px;
        color: #666;
    }
    
    .summary {
        margin-bottom: 2em;
    }
    
    .summary h2 {
        font-size: 18px;
        margin-bottom: 1em;
        color: #333;
    }
    
    .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1em;
        margin-bottom: 2em;
    }
    
    .summary-item {
        background: #f8f9fa;
        padding: 1em;
        border-radius: 4px;
        border-left: 4px solid #007bff;
    }
    
    .summary-item h3 {
        margin: 0 0 0.5em 0;
        font-size: 14px;
        color: #666;
        text-transform: uppercase;
    }
    
    .summary-item .value {
        font-size: 24px;
        font-weight: bold;
        color: #333;
    }
    
    .table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 2em;
    }
    
    .table th,
    .table td {
        padding: 0.5em;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }
    
    .table th {
        background: #f8f9fa;
        font-weight: bold;
        color: #333;
    }
    
    .table tr:nth-child(even) {
        background: #f8f9fa;
    }
    
    .chart-placeholder {
        background: #f8f9fa;
        border: 2px dashed #ddd;
        padding: 2em;
        text-align: center;
        margin: 1em 0;
        color: #666;
    }
    
    .footer {
        margin-top: 2em;
        padding-top: 1em;
        border-top: 1px solid #ddd;
        font-size: 10px;
        color: #666;
        text-align: center;
    }
    
    .no-data {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 2em;
    }
    """
