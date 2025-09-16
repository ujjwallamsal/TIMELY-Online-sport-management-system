# reports/views.py
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import JsonResponse

from .pdf import generate_pdf_report, get_report_data
from events.models import Event


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_pdf(request):
    """
    Export report as PDF
    
    Query parameters:
    - kind: report type (registrations, revenue, attendance, performance)
    - event: event ID to filter by
    - date_from: start date (YYYY-MM-DD)
    - date_to: end date (YYYY-MM-DD)
    """
    # Check permissions (admin or organizer)
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get report type
    report_type = request.query_params.get('kind')
    if not report_type:
        return Response(
            {'error': 'Report type (kind) is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate report type
    valid_types = ['registrations', 'revenue', 'attendance', 'performance']
    if report_type not in valid_types:
        return Response(
            {'error': f'Invalid report type. Must be one of: {", ".join(valid_types)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Parse filters
    filters = {}
    
    event_id = request.query_params.get('event')
    if event_id:
        try:
            event = get_object_or_404(Event, id=event_id)
            filters['event_id'] = event_id
        except ValueError:
            return Response(
                {'error': 'Invalid event ID'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    date_from = request.query_params.get('date_from')
    if date_from:
        try:
            from datetime import datetime
            filters['date_from'] = datetime.strptime(date_from, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date_from format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    date_to = request.query_params.get('date_to')
    if date_to:
        try:
            from datetime import datetime
            filters['date_to'] = datetime.strptime(date_to, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date_to format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Additional filters based on report type
    if report_type == 'registrations':
        status_filter = request.query_params.get('status')
        if status_filter:
            filters['status'] = status_filter
    
    # Generate PDF
    try:
        response = generate_pdf_report(report_type, filters)
        return response
    except Exception as e:
        return Response(
            {'error': f'Failed to generate PDF: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_report_data_api(request):
    """
    Get report data as JSON (for preview or API consumption)
    
    Query parameters:
    - kind: report type (registrations, revenue, attendance, performance)
    - event: event ID to filter by
    - date_from: start date (YYYY-MM-DD)
    - date_to: end date (YYYY-MM-DD)
    """
    # Check permissions
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get report type
    report_type = request.query_params.get('kind')
    if not report_type:
        return Response(
            {'error': 'Report type (kind) is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate report type
    valid_types = ['registrations', 'revenue', 'attendance', 'performance']
    if report_type not in valid_types:
        return Response(
            {'error': f'Invalid report type. Must be one of: {", ".join(valid_types)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Parse filters (same as PDF export)
    filters = {}
    
    event_id = request.query_params.get('event')
    if event_id:
        try:
            event = get_object_or_404(Event, id=event_id)
            filters['event_id'] = event_id
        except ValueError:
            return Response(
                {'error': 'Invalid event ID'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    date_from = request.query_params.get('date_from')
    if date_from:
        try:
            from datetime import datetime
            filters['date_from'] = datetime.strptime(date_from, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date_from format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    date_to = request.query_params.get('date_to')
    if date_to:
        try:
            from datetime import datetime
            filters['date_to'] = datetime.strptime(date_to, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date_to format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    if report_type == 'registrations':
        status_filter = request.query_params.get('status')
        if status_filter:
            filters['status'] = status_filter
    
    # Get report data
    try:
        data = get_report_data(report_type, filters)
        return Response(data)
    except Exception as e:
        return Response(
            {'error': f'Failed to get report data: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_available_events(request):
    """
    Get list of events for report filters
    """
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    events = Event.objects.filter(
        status=Event.Status.PUBLISHED
    ).values('id', 'name', 'start_date', 'end_date').order_by('-start_date')
    
    return Response({'events': list(events)})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_report_summary(request):
    """
    Get summary of all available reports
    """
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get basic counts for each report type
    from events.models import Event
    from registrations.models import Registration
    from tickets.models import TicketOrder, Ticket
    from accounts.models import User
    
    summary = {
        'registrations': {
            'total': Registration.objects.count(),
            'pending': Registration.objects.filter(status='pending').count(),
            'approved': Registration.objects.filter(status='approved').count(),
        },
        'revenue': {
            'total_orders': TicketOrder.objects.filter(status='paid').count(),
            'total_revenue_cents': TicketOrder.objects.filter(status='paid').aggregate(
                total=__import__('django.db.models', fromlist=['Sum']).Sum('total_cents')
            )['total'] or 0,
        },
        'attendance': {
            'total_tickets_used': Ticket.objects.filter(status='used').count(),
            'total_tickets_issued': Ticket.objects.count(),
        },
        'performance': {
            'total_users': User.objects.count(),
            'total_events': Event.objects.count(),
            'active_events': Event.objects.filter(status='published').count(),
        }
    }
    
    return Response(summary)