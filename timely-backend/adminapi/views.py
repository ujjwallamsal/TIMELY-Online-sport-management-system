from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.http import HttpResponse
from django.db.models import Q

from .permissions import IsAdmin
from .services import AdminKPIService, AdminDrilldownService
from .serializers import (
    KPISerializer, UserDrilldownSerializer, EventDrilldownSerializer,
    RegistrationDrilldownSerializer, OrderDrilldownSerializer,
    AuditLogDrilldownSerializer, CSVExportMixin
)
from accounts.models import User
from common.models import AuditLog
from events.models import Event
from registrations.models import Registration
from tickets.models import TicketOrder


class AdminPagination(PageNumberPagination):
    """Custom pagination for admin endpoints"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['GET'])
@permission_classes([IsAdmin])
def get_kpis(request):
    """Get admin dashboard KPIs"""
    try:
        kpis = AdminKPIService.get_kpis()
        serializer = KPISerializer(kpis)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch KPIs: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdmin])
def drill_users(request):
    """Get paginated users with filtering"""
    try:
        role = request.GET.get('role')
        search = request.GET.get('q')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        
        data = AdminDrilldownService.get_users(
            role=role, search=search, page=page, page_size=page_size
        )
        
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch users: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdmin])
def drill_events(request):
    """Get paginated events with filtering"""
    try:
        status_filter = request.GET.get('status')
        search = request.GET.get('q')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        
        data = AdminDrilldownService.get_events(
            status=status_filter, search=search, page=page, page_size=page_size
        )
        
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch events: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdmin])
def drill_registrations(request):
    """Get paginated registrations with filtering"""
    try:
        status_filter = request.GET.get('status')
        event_id = request.GET.get('event')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        
        data = AdminDrilldownService.get_registrations(
            status=status_filter, event_id=event_id, page=page, page_size=page_size
        )
        
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch registrations: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdmin])
def drill_orders(request):
    """Get paginated ticket orders with filtering"""
    try:
        status_filter = request.GET.get('status')
        event_id = request.GET.get('event')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        
        data = AdminDrilldownService.get_orders(
            status=status_filter, event_id=event_id, page=page, page_size=page_size
        )
        
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch orders: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdmin])
def audit_logs(request):
    """Get paginated audit logs with filtering"""
    try:
        search = request.GET.get('q')
        actor_id = request.GET.get('actor')
        action = request.GET.get('action')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        
        data = AdminDrilldownService.get_audit_logs(
            search=search, actor_id=actor_id, action=action,
            page=page, page_size=page_size
        )
        
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch audit logs: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class CSVExportView(CSVExportMixin):
    """Base class for CSV export views"""
    pass


@api_view(['GET'])
@permission_classes([IsAdmin])
def export_csv(request, kind):
    """Export data to CSV format"""
    try:
        # Get the same filters as the list endpoints
        if kind == 'users':
            role = request.GET.get('role')
            search = request.GET.get('q')
            data = AdminDrilldownService.get_users(role=role, search=search, page=1, page_size=10000)
            headers = ['ID', 'Email', 'First Name', 'Last Name', 'Full Name', 'Role', 'Role Display', 'Active', 'Email Verified', 'Created At']
            filename = 'users_export.csv'
            
        elif kind == 'events':
            status_filter = request.GET.get('status')
            search = request.GET.get('q')
            data = AdminDrilldownService.get_events(status=status_filter, search=search, page=1, page_size=10000)
            headers = ['ID', 'Name', 'Sport', 'Location', 'Status', 'Status Display', 'Start Date', 'End Date', 'Capacity', 'Fee Cents', 'Fee Dollars', 'Created At']
            filename = 'events_export.csv'
            
        elif kind == 'registrations':
            status_filter = request.GET.get('status')
            event_id = request.GET.get('event')
            data = AdminDrilldownService.get_registrations(status=status_filter, event_id=event_id, page=1, page_size=10000)
            headers = ['ID', 'User ID', 'Event ID', 'Status', 'Status Display', 'Payment Status', 'Payment Status Display', 'Type', 'Type Display', 'Team Name', 'Fee Cents', 'Fee Dollars', 'Submitted At']
            filename = 'registrations_export.csv'
            
        elif kind == 'orders':
            status_filter = request.GET.get('status')
            event_id = request.GET.get('event')
            data = AdminDrilldownService.get_orders(status=status_filter, event_id=event_id, page=1, page_size=10000)
            headers = ['ID', 'User ID', 'Event ID', 'Status', 'Status Display', 'Total Cents', 'Total Dollars', 'Currency', 'Provider', 'Provider Display', 'Created At']
            filename = 'orders_export.csv'
            
        elif kind == 'audit':
            search = request.GET.get('q')
            actor_id = request.GET.get('actor')
            action = request.GET.get('action')
            data = AdminDrilldownService.get_audit_logs(search=search, actor_id=actor_id, action=action, page=1, page_size=10000)
            headers = ['ID', 'User ID', 'User Email', 'Action', 'Action Display', 'Resource Type', 'Resource ID', 'Details', 'IP Address', 'Created At']
            filename = 'audit_logs_export.csv'
            
        else:
            return Response(
                {'error': f'Invalid export kind: {kind}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create CSV export
        csv_view = CSVExportView()
        return csv_view.export_to_csv(data['results'], filename, headers)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to export {kind}: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )