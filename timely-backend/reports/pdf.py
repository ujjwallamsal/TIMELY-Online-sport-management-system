# reports/pdf.py - PDF Report Generation
# Disabled for minimal boot profile - tickets app not available

from django.http import HttpResponse
from django.template.loader import render_to_string
from django.db.models import Sum, Count, Q
from django.utils import timezone

from events.models import Event
from registrations.models import Registration
# from tickets.models import TicketOrder, Ticket  # Disabled for minimal boot profile
from accounts.models import User


def generate_pdf_report(report_type, filters=None):
    """
    Generate PDF report - disabled for minimal boot profile
    
    Args:
        report_type: Type of report to generate
        filters: Dictionary of filter parameters
        
    Returns:
        HttpResponse with 501 error (not implemented)
    """
    return HttpResponse(
        "PDF reports are not available in minimal boot profile. "
        "Please use CSV exports instead.",
        status=501,
        content_type='text/plain'
    )


def get_report_data(report_type, filters=None):
    """
    Get report data - simplified for minimal boot profile
    
    Args:
        report_type: Type of report to generate
        filters: Dictionary of filter parameters
        
    Returns:
        Dictionary with report data
    """
    filters = filters or {}
    
    if report_type == 'events':
        return get_events_data(filters)
    elif report_type == 'registrations':
        return get_registrations_data(filters)
    elif report_type == 'revenue':
        return get_revenue_data(filters)
    elif report_type == 'tickets':
        return get_tickets_data(filters)
    elif report_type == 'summary':
        return get_summary_data(filters)
    else:
        return {'error': 'Unknown report type'}


def get_events_data(filters=None):
    """Get events report data"""
    filters = filters or {}
    
    # Base queryset
    queryset = Event.objects.all()
    
    # Apply filters
    if filters.get('event_id'):
        queryset = queryset.filter(id=filters['event_id'])
    
    if filters.get('date_from'):
        queryset = queryset.filter(start_datetime__gte=filters['date_from'])
    
    if filters.get('date_to'):
        queryset = queryset.filter(end_datetime__lte=filters['date_to'])
    
    if filters.get('sport'):
        queryset = queryset.filter(sport=filters['sport'])
    
    # Get summary data
    total_events = queryset.count()
    
    # Events by sport
    sport_events = queryset.values('sport').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Events by status
    status_events = queryset.values('status').annotate(
        count=Count('id')
    ).order_by('-count')
    
    return {
        'total_events': total_events,
        'sport_events': list(sport_events),
        'status_events': list(status_events),
        'events': list(queryset.values(
            'id', 'name', 'sport', 'status', 'start_datetime', 'end_datetime'
        ))
    }


def get_registrations_data(filters=None):
    """Get registrations report data"""
    filters = filters or {}
    
    # Base queryset
    queryset = Registration.objects.select_related('applicant', 'event')
    
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
    
    # Registrations by status
    status_registrations = queryset.values('status').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Registrations by event
    event_registrations = queryset.values('event__name').annotate(
        count=Count('id')
    ).order_by('-count')
    
    return {
        'total_registrations': total_registrations,
        'status_registrations': list(status_registrations),
        'event_registrations': list(event_registrations),
        'registrations': list(queryset.values(
            'id', 'applicant__email', 'event__name', 'status', 'created_at'
        ))
    }


def get_revenue_data(filters=None):
    """Get revenue report data - disabled for minimal boot profile"""
    # Disabled for minimal boot profile - tickets app not available
    return {
        'total_revenue': 0,
        'total_orders': 0,
        'event_revenue': [],
        'monthly_revenue': []
    }


def get_tickets_data(filters=None):
    """Get tickets report data - disabled for minimal boot profile"""
    # Disabled for minimal boot profile - tickets app not available
    return {
        'total_tickets': 0,
        'used_tickets': 0,
        'tickets': []
    }


def get_summary_data(filters=None):
    """Get summary report data"""
    # Basic summary without tickets
    total_events = Event.objects.count()
    total_registrations = Registration.objects.count()
    total_users = User.objects.count()
    
    # Active users (logged in last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    active_users = User.objects.filter(
        last_login__gte=thirty_days_ago
    ).count()
    
    return {
        'total_events': total_events,
        'total_registrations': total_registrations,
        'total_users': total_users,
        'active_users': active_users,
        'total_tickets': 0,  # Disabled for minimal boot profile
        'total_revenue': 0,  # Disabled for minimal boot profile
    }