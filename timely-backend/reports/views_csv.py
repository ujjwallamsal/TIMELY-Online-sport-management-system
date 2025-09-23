# reports/views_csv.py
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import StreamingHttpResponse, HttpResponse
from django.db.models import Q
import csv
import io
from datetime import datetime

from .services import ReportsService
from .permissions import IsOrganizerOrAdmin
from events.models import Event
from registrations.models import Registration
from fixtures.models import Fixture
from results.models import Result
from tickets.models import TicketOrder, Ticket
from accounts.models import User


class CSVStreamingMixin:
    """Mixin for streaming CSV responses"""
    
    def get_csv_response(self, filename, data_generator):
        """Create a streaming CSV response"""
        response = StreamingHttpResponse(
            data_generator,
            content_type='text/csv; charset=utf-8'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Cache-Control'] = 'no-cache'
        return response


@api_view(['GET'])
@permission_classes([IsOrganizerOrAdmin])
def stream_registrations_csv(request):
    """
    Stream registrations CSV data
    
    Query parameters:
    - event: event ID to filter by
    - date_from: start date (YYYY-MM-DD)
    - date_to: end date (YYYY-MM-DD)
    - status: registration status filter
    """
    # Parse filters
    filters = {}
    
    event_id = request.query_params.get('event')
    if event_id:
        try:
            event = get_object_or_404(Event, id=event_id)
            filters['event'] = event
        except ValueError:
            return Response(
                {'error': 'Invalid event ID'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    date_from = request.query_params.get('date_from')
    if date_from:
        try:
            filters['date_from'] = datetime.strptime(date_from, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date_from format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    date_to = request.query_params.get('date_to')
    if date_to:
        try:
            filters['date_to'] = datetime.strptime(date_to, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date_to format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    status_filter = request.query_params.get('status')
    if status_filter:
        filters['status'] = status_filter
    
    # Generate filename
    event_name = filters.get('event').name if filters.get('event') else 'all_events'
    filename = f"registrations_{event_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    def data_generator():
        # Create CSV writer
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Event', 'Applicant Name', 'Applicant Email', 'Team', 'Type', 'Status', 
            'Submitted At', 'Decided At', 'Decided By', 'Reason', 'Division'
        ])
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        
        # Build queryset
        queryset = Registration.objects.select_related(
            'event', 'applicant', 'team', 'division', 'decided_by'
        ).order_by('-submitted_at')
        
        if filters.get('event'):
            queryset = queryset.filter(event=filters['event'])
        
        if filters.get('date_from'):
            queryset = queryset.filter(submitted_at__gte=filters['date_from'])
        
        if filters.get('date_to'):
            queryset = queryset.filter(submitted_at__lte=filters['date_to'])
        
        if filters.get('status'):
            queryset = queryset.filter(status=filters['status'])
        
        # Stream data in chunks
        chunk_size = 1000
        for i in range(0, queryset.count(), chunk_size):
            chunk = queryset[i:i + chunk_size]
            for reg in chunk:
                writer.writerow([
                    reg.id,
                    reg.event.name if reg.event else '',
                    reg.applicant.full_name if reg.applicant else '',
                    reg.applicant.email if reg.applicant else '',
                    reg.team.name if reg.team else '',
                    reg.get_type_display(),
                    reg.get_status_display(),
                    reg.submitted_at.strftime('%Y-%m-%d %H:%M:%S') if reg.submitted_at else '',
                    reg.decided_at.strftime('%Y-%m-%d %H:%M:%S') if reg.decided_at else '',
                    reg.decided_by.email if reg.decided_by else '',
                    reg.reason or '',
                    reg.division.name if reg.division else ''
                ])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)
    
    response = StreamingHttpResponse(
        data_generator(),
        content_type='text/csv; charset=utf-8'
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    response['Cache-Control'] = 'no-cache'
    return response


@api_view(['GET'])
@permission_classes([IsOrganizerOrAdmin])
def stream_fixtures_csv(request):
    """
    Stream fixtures CSV data
    
    Query parameters:
    - event: event ID to filter by
    - date_from: start date (YYYY-MM-DD)
    - date_to: end date (YYYY-MM-DD)
    - status: fixture status filter
    """
    # Parse filters
    filters = {}
    
    event_id = request.query_params.get('event')
    if event_id:
        try:
            event = get_object_or_404(Event, id=event_id)
            filters['event'] = event
        except ValueError:
            return Response(
                {'error': 'Invalid event ID'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    date_from = request.query_params.get('date_from')
    if date_from:
        try:
            filters['date_from'] = datetime.strptime(date_from, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date_from format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    date_to = request.query_params.get('date_to')
    if date_to:
        try:
            filters['date_to'] = datetime.strptime(date_to, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date_to format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    status_filter = request.query_params.get('status')
    if status_filter:
        filters['status'] = status_filter
    
    # Generate filename
    event_name = filters.get('event').name if filters.get('event') else 'all_events'
    filename = f"fixtures_{event_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    def data_generator():
        # Create CSV writer
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Event', 'Round', 'Phase', 'Home Team', 'Away Team', 
            'Venue', 'Start Time', 'End Time', 'Status', 'Created At'
        ])
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        
        # Build queryset
        queryset = Fixture.objects.select_related(
            'event', 'home_team', 'away_team', 'venue'
        ).order_by('start_at')
        
        if filters.get('event'):
            queryset = queryset.filter(event=filters['event'])
        
        if filters.get('date_from'):
            queryset = queryset.filter(start_at__date__gte=filters['date_from'])
        
        if filters.get('date_to'):
            queryset = queryset.filter(start_at__date__lte=filters['date_to'])
        
        if filters.get('status'):
            queryset = queryset.filter(status=filters['status'])
        
        # Stream data in chunks
        chunk_size = 1000
        for i in range(0, queryset.count(), chunk_size):
            chunk = queryset[i:i + chunk_size]
            for fixture in chunk:
                writer.writerow([
                    fixture.id,
                    fixture.event.name if fixture.event else '',
                    fixture.round,
                    fixture.get_phase_display(),
                    fixture.home_team.name if fixture.home_team else '',
                    fixture.away_team.name if fixture.away_team else '',
                    fixture.venue.name if fixture.venue else '',
                    fixture.start_at.strftime('%Y-%m-%d %H:%M:%S') if fixture.start_at else '',
                    fixture.end_at.strftime('%Y-%m-%d %H:%M:%S') if fixture.end_at else '',
                    fixture.get_status_display(),
                    fixture.created_at.strftime('%Y-%m-%d %H:%M:%S') if fixture.created_at else ''
                ])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)
    
    response = StreamingHttpResponse(
        data_generator(),
        content_type='text/csv; charset=utf-8'
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    response['Cache-Control'] = 'no-cache'
    return response


@api_view(['GET'])
@permission_classes([IsOrganizerOrAdmin])
def stream_results_csv(request):
    """
    Stream results CSV data
    
    Query parameters:
    - event: event ID to filter by
    - date_from: start date (YYYY-MM-DD)
    - date_to: end date (YYYY-MM-DD)
    - status: result status filter
    """
    # Parse filters
    filters = {}
    
    event_id = request.query_params.get('event')
    if event_id:
        try:
            event = get_object_or_404(Event, id=event_id)
            filters['event'] = event
        except ValueError:
            return Response(
                {'error': 'Invalid event ID'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    date_from = request.query_params.get('date_from')
    if date_from:
        try:
            filters['date_from'] = datetime.strptime(date_from, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date_from format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    date_to = request.query_params.get('date_to')
    if date_to:
        try:
            filters['date_to'] = datetime.strptime(date_to, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date_to format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    status_filter = request.query_params.get('status')
    if status_filter:
        filters['status'] = status_filter
    
    # Generate filename
    event_name = filters.get('event').name if filters.get('event') else 'all_events'
    filename = f"results_{event_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    def data_generator():
        # Create CSV writer
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Event', 'Fixture', 'Home Team', 'Away Team', 
            'Home Score', 'Away Score', 'Winner', 'Finalized At', 'Created At'
        ])
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        
        # Build queryset
        queryset = Result.objects.select_related(
            'fixture', 'fixture__event', 'fixture__home_team', 'fixture__away_team', 'winner'
        ).order_by('-created_at')
        
        if filters.get('event'):
            queryset = queryset.filter(fixture__event=filters['event'])
        
        if filters.get('date_from'):
            queryset = queryset.filter(created_at__date__gte=filters['date_from'])
        
        if filters.get('date_to'):
            queryset = queryset.filter(created_at__date__lte=filters['date_to'])
        
        if filters.get('status'):
            queryset = queryset.filter(status=filters['status'])
        
        # Stream data in chunks
        chunk_size = 1000
        for i in range(0, queryset.count(), chunk_size):
            chunk = queryset[i:i + chunk_size]
            for result in chunk:
                writer.writerow([
                    result.id,
                    result.fixture.event.name if result.fixture and result.fixture.event else '',
                    f"{result.fixture.home_team.name if result.fixture and result.fixture.home_team else 'TBD'} vs {result.fixture.away_team.name if result.fixture and result.fixture.away_team else 'TBD'}" if result.fixture else '',
                    result.fixture.home_team.name if result.fixture and result.fixture.home_team else '',
                    result.fixture.away_team.name if result.fixture and result.fixture.away_team else '',
                    result.score_home,
                    result.score_away,
                    result.winner.name if result.winner else 'Draw',
                    result.verified_at.strftime('%Y-%m-%d %H:%M:%S') if result.verified_at else '',
                    result.created_at.strftime('%Y-%m-%d %H:%M:%S') if result.created_at else ''
                ])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)
    
    response = StreamingHttpResponse(
        data_generator(),
        content_type='text/csv; charset=utf-8'
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    response['Cache-Control'] = 'no-cache'
    return response


@api_view(['GET'])
@permission_classes([IsOrganizerOrAdmin])
def stream_ticket_sales_csv(request):
    """
    Stream ticket sales CSV data
    
    Query parameters:
    - event: event ID to filter by
    - date_from: start date (YYYY-MM-DD)
    - date_to: end date (YYYY-MM-DD)
    - status: order status filter
    """
    # Parse filters
    filters = {}
    
    event_id = request.query_params.get('event')
    if event_id:
        try:
            event = get_object_or_404(Event, id=event_id)
            filters['event'] = event
        except ValueError:
            return Response(
                {'error': 'Invalid event ID'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    date_from = request.query_params.get('date_from')
    if date_from:
        try:
            filters['date_from'] = datetime.strptime(date_from, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date_from format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    date_to = request.query_params.get('date_to')
    if date_to:
        try:
            filters['date_to'] = datetime.strptime(date_to, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date_to format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    status_filter = request.query_params.get('status')
    if status_filter:
        filters['status'] = status_filter
    
    # Generate filename
    event_name = filters.get('event').name if filters.get('event') else 'all_events'
    filename = f"ticket_sales_{event_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    def data_generator():
        # Create CSV writer
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Order ID', 'User Name', 'User Email', 'Event', 'Fixture', 
            'Total Amount', 'Currency', 'Status', 'Created At', 'Tickets Count',
            'Payment Method', 'Stripe Payment Intent ID'
        ])
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        
        # Build queryset
        queryset = TicketOrder.objects.select_related('user').prefetch_related('tickets').order_by('-created_at')
        
        if filters.get('event'):
            queryset = queryset.filter(event_id=filters['event'].id)
        
        if filters.get('date_from'):
            queryset = queryset.filter(created_at__date__gte=filters['date_from'])
        
        if filters.get('date_to'):
            queryset = queryset.filter(created_at__date__lte=filters['date_to'])
        
        if filters.get('status'):
            queryset = queryset.filter(status=filters['status'])
        
        # Stream data in chunks
        chunk_size = 1000
        for i in range(0, queryset.count(), chunk_size):
            chunk = queryset[i:i + chunk_size]
            for order in chunk:
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
                    order.user.full_name if order.user else '',
                    order.user.email if order.user else '',
                    event_name,
                    fixture_info,
                    f"{order.total_cents / 100:.2f}",
                    order.currency,
                    order.get_status_display(),
                    order.created_at.strftime('%Y-%m-%d %H:%M:%S') if order.created_at else '',
                    ticket_count,
                    order.payment_provider,
                    order.provider_payment_intent_id or ''
                ])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)
    
    response = StreamingHttpResponse(
        data_generator(),
        content_type='text/csv; charset=utf-8'
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    response['Cache-Control'] = 'no-cache'
    return response
