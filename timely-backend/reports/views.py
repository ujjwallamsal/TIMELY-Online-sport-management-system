# reports/views.py
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponse
import csv
import io

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


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_csv(request, report_type):
    """
    Export report as CSV
    
    URL parameters:
    - report_type: type of report (registrations, fixtures, results, ticket_sales)
    
    Query parameters:
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
    
    # Validate report type
    valid_types = ['registrations', 'fixtures', 'results', 'ticket_sales']
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
            filters['event'] = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response(
                {'error': 'Event not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{report_type}_report.csv"'
    
    # Generate CSV data based on report type
    if report_type == 'registrations':
        _generate_registrations_csv(response, filters)
    elif report_type == 'fixtures':
        _generate_fixtures_csv(response, filters)
    elif report_type == 'results':
        _generate_results_csv(response, filters)
    elif report_type == 'ticket_sales':
        _generate_ticket_sales_csv(response, filters)
    
    return response


def _generate_registrations_csv(response, filters):
    """Generate registrations CSV"""
    from registrations.models import Registration
    from django.db.models import Q
    
    queryset = Registration.objects.select_related('event', 'applicant', 'team')
    
    if filters.get('event'):
        queryset = queryset.filter(event=filters['event'])
    
    writer = csv.writer(response)
    writer.writerow([
        'ID', 'Event', 'Applicant', 'Team', 'Type', 'Status', 
        'Submitted At', 'Decided At', 'Decided By', 'Reason'
    ])
    
    for reg in queryset:
        writer.writerow([
            reg.id,
            reg.event.name,
            reg.applicant.email if reg.applicant else '',
            reg.team.name if reg.team else '',
            reg.get_type_display(),
            reg.get_status_display(),
            reg.submitted_at.strftime('%Y-%m-%d %H:%M:%S'),
            reg.decided_at.strftime('%Y-%m-%d %H:%M:%S') if reg.decided_at else '',
            reg.decided_by.email if reg.decided_by else '',
            reg.reason
        ])


def _generate_fixtures_csv(response, filters):
    """Generate fixtures CSV"""
    from fixtures.models import Fixture
    
    queryset = Fixture.objects.select_related('event', 'home', 'away', 'venue')
    
    if filters.get('event'):
        queryset = queryset.filter(event=filters['event'])
    
    writer = csv.writer(response)
    writer.writerow([
        'ID', 'Event', 'Round', 'Phase', 'Home Team', 'Away Team', 
        'Venue', 'Start Time', 'Status'
    ])
    
    for fixture in queryset:
        writer.writerow([
            fixture.id,
            fixture.event.name,
            fixture.round,
            fixture.get_phase_display(),
            fixture.home.name if fixture.home else '',
            fixture.away.name if fixture.away else '',
            fixture.venue.name if fixture.venue else '',
            fixture.start_at.strftime('%Y-%m-%d %H:%M:%S'),
            fixture.get_status_display()
        ])


def _generate_results_csv(response, filters):
    """Generate results CSV"""
    from results.models import Result
    
    queryset = Result.objects.select_related('fixture', 'fixture__event', 'fixture__home', 'fixture__away', 'winner')
    
    if filters.get('event'):
        queryset = queryset.filter(fixture__event=filters['event'])
    
    writer = csv.writer(response)
    writer.writerow([
        'ID', 'Event', 'Fixture', 'Home Team', 'Away Team', 
        'Home Score', 'Away Score', 'Winner', 'Finalized At'
    ])
    
    for result in queryset:
        writer.writerow([
            result.id,
            result.fixture.event.name,
            f"{result.fixture.home.name if result.fixture.home else 'TBD'} vs {result.fixture.away.name if result.fixture.away else 'TBD'}",
            result.fixture.home.name if result.fixture.home else '',
            result.fixture.away.name if result.fixture.away else '',
            result.score_home,
            result.score_away,
            result.winner.name if result.winner else 'Draw',
            result.verified_at.strftime('%Y-%m-%d %H:%M:%S') if result.verified_at else ''
        ])


def _generate_ticket_sales_csv(response, filters):
    """Generate ticket sales CSV"""
    from tickets.models import TicketOrder, Ticket
    
    queryset = TicketOrder.objects.select_related('user')
    
    if filters.get('event'):
        queryset = queryset.filter(event_id=filters['event'].id)
    
    writer = csv.writer(response)
    writer.writerow([
        'Order ID', 'User', 'Event', 'Fixture', 'Total Amount', 
        'Currency', 'Status', 'Created At', 'Tickets Count'
    ])
    
    for order in queryset:
        ticket_count = order.tickets.count()
        # Get event name if possible
        event_name = ''
        if order.event_id:
            try:
                from events.models import Event
                event = Event.objects.get(id=order.event_id)
                event_name = event.name
            except Event.DoesNotExist:
                event_name = f'Event {order.event_id}'
        
        # Get fixture info if possible
        fixture_info = ''
        if order.fixture_id:
            try:
                from fixtures.models import Fixture
                fixture = Fixture.objects.get(id=order.fixture_id)
                fixture_info = str(fixture)
            except Fixture.DoesNotExist:
                fixture_info = f'Fixture {order.fixture_id}'
        
        writer.writerow([
            order.id,
            order.user.email,
            event_name,
            fixture_info,
            f"{order.total_cents / 100:.2f}",
            order.currency,
            order.get_status_display(),
            order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            ticket_count
        ])