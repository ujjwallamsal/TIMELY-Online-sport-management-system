# reports/views.py
from __future__ import annotations

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.core.paginator import Paginator
from django.db.models import QuerySet
from typing import Dict, Any, List

from .services import ReportsService
from .serializers import (
    ReportFiltersSerializer, RegistrationReportSerializer,
    RevenueReportSerializer, RevenueTotalsSerializer,
    AttendanceReportSerializer, AttendanceSummarySerializer,
    TeamStandingSerializer, PlayerStatsSerializer,
    PerformanceSummarySerializer, CSVExportSerializer,
    PaginatedReportSerializer
)
from accounts.permissions import IsAdmin, IsOrganizerOrAdmin
from events.models import Event
from accounts.models import User


class ReportsViewSet(viewsets.ViewSet):
    """
    Reports ViewSet for generating various reports with RBAC
    """
    permission_classes = [IsOrganizerOrAdmin]
    
    def get_queryset(self):
        """Get queryset based on user permissions"""
        user = self.request.user
        if user.is_superuser:
            return Event.objects.all()
        elif user.role == User.Role.ORGANIZER:
            return Event.objects.filter(created_by=user)
        else:
            return Event.objects.none()
    
    @action(detail=False, methods=['get'], url_path='registrations')
    def registrations(self, request):
        """
        GET /api/reports/registrations/
        Get registrations report with filtering and pagination
        """
        # Validate filters
        filters_serializer = ReportFiltersSerializer(data=request.query_params)
        if not filters_serializer.is_valid():
            return Response(filters_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        filters = filters_serializer.validated_data
        
        # Get report data
        report_data = ReportsService.get_registrations_data(
            event_id=filters.get('event'),
            sport=filters.get('sport'),
            division_id=filters.get('division'),
            date_from=filters.get('date_from'),
            date_to=filters.get('date_to'),
            user=request.user
        )
        
        # Paginate results
        page = filters.get('page', 1)
        page_size = filters.get('page_size', 20)
        
        paginated_data = PaginatedReportSerializer.paginate_queryset(
            report_data['queryset'], page, page_size
        )
        
        # Serialize results
        serializer = RegistrationReportSerializer(paginated_data['results'], many=True)
        paginated_data['results'] = serializer.data
        
        return Response(paginated_data)
    
    @action(detail=False, methods=['get'], url_path='revenue')
    def revenue(self, request):
        """
        GET /api/reports/revenue/
        Get revenue report with totals and breakdowns
        """
        # Validate filters
        filters_serializer = ReportFiltersSerializer(data=request.query_params)
        if not filters_serializer.is_valid():
            return Response(filters_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        filters = filters_serializer.validated_data
        
        # Get report data
        report_data = ReportsService.get_revenue_data(
            event_id=filters.get('event'),
            date_from=filters.get('date_from'),
            date_to=filters.get('date_to'),
            user=request.user
        )
        
        # Serialize results
        rows_serializer = RevenueReportSerializer(report_data['rows'], many=True)
        totals_serializer = RevenueTotalsSerializer(report_data['totals'])
        
        return Response({
            'rows': rows_serializer.data,
            'totals': totals_serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='attendance')
    def attendance(self, request):
        """
        GET /api/reports/attendance/
        Get attendance report (proxied by ticket orders and scanned tickets)
        """
        # Validate filters
        filters_serializer = ReportFiltersSerializer(data=request.query_params)
        if not filters_serializer.is_valid():
            return Response(filters_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        filters = filters_serializer.validated_data
        
        # Get report data
        report_data = ReportsService.get_attendance_data(
            event_id=filters.get('event'),
            date_from=filters.get('date_from'),
            date_to=filters.get('date_to'),
            user=request.user
        )
        
        # Serialize results
        rows_serializer = AttendanceReportSerializer(report_data['rows'], many=True)
        summary_serializer = AttendanceSummarySerializer(report_data['summary'])
        
        return Response({
            'rows': rows_serializer.data,
            'summary': summary_serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='performance')
    def performance(self, request):
        """
        GET /api/reports/performance/
        Get performance report with standings and player/team stats
        """
        # Validate filters
        filters_serializer = ReportFiltersSerializer(data=request.query_params)
        if not filters_serializer.is_valid():
            return Response(filters_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        filters = filters_serializer.validated_data
        
        # Get report data
        report_data = ReportsService.get_performance_data(
            event_id=filters.get('event'),
            division_id=filters.get('division'),
            user=request.user
        )
        
        # Serialize results
        standings_serializer = TeamStandingSerializer(report_data['standings'], many=True)
        players_serializer = PlayerStatsSerializer(report_data['top_players'], many=True)
        summary_serializer = PerformanceSummarySerializer(report_data['summary'])
        
        return Response({
            'standings': standings_serializer.data,
            'top_players': players_serializer.data,
            'summary': summary_serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='export/(?P<report_type>[^/.]+)')
    def export_csv(self, request, report_type=None):
        """
        GET /api/reports/export/{report_type}/
        Export report data to CSV format
        """
        # Validate report type
        if report_type not in ['registrations', 'revenue', 'attendance', 'performance']:
            return Response(
                {'error': 'Invalid report type'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate filters
        filters_serializer = ReportFiltersSerializer(data=request.query_params)
        if not filters_serializer.is_valid():
            return Response(filters_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        filters = filters_serializer.validated_data
        
        # Generate CSV data based on report type
        csv_data = self._generate_csv_data(report_type, filters, request.user)
        
        if not csv_data:
            return Response(
                {'error': 'No data available for export'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create HTTP response with CSV content
        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report.csv"'
        
        return response
    
    def _generate_csv_data(self, report_type: str, filters: Dict[str, Any], user: User) -> str:
        """Generate CSV data for the specified report type"""
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        if report_type == 'registrations':
            # Get registrations data
            report_data = ReportsService.get_registrations_data(
                event_id=filters.get('event'),
                sport=filters.get('sport'),
                division_id=filters.get('division'),
                date_from=filters.get('date_from'),
                date_to=filters.get('date_to'),
                user=user
            )
            
            # Write header
            writer.writerow([
                'ID', 'User Name', 'User Email', 'Event Name', 'Event Sport',
                'Division Name', 'Status', 'KYC Status', 'Submitted At'
            ])
            
            # Write data rows
            for registration in report_data['queryset']:
                writer.writerow([
                    registration.id,
                    registration.user.full_name if registration.user else 'N/A',
                    registration.user.email if registration.user else 'N/A',
                    registration.event.name if registration.event else 'N/A',
                    registration.event.sport if registration.event else 'N/A',
                    registration.division.name if registration.division else 'N/A',
                    registration.status,
                    registration.user.kyc_profile.status if hasattr(registration.user, 'kyc_profile') and registration.user.kyc_profile else 'N/A',
                    registration.submitted_at
                ])
        
        elif report_type == 'revenue':
            # Get revenue data
            report_data = ReportsService.get_revenue_data(
                event_id=filters.get('event'),
                date_from=filters.get('date_from'),
                date_to=filters.get('date_to'),
                user=user
            )
            
            # Write header
            writer.writerow([
                'ID', 'Event Name', 'User Name', 'User Email', 'Total (Cents)',
                'Status', 'Ticket Count', 'Created At'
            ])
            
            # Write data rows
            for row in report_data['rows']:
                writer.writerow([
                    row['id'],
                    row['event_name'],
                    row['user_name'],
                    row['user_email'],
                    row['total_cents'],
                    row['status'],
                    row['ticket_count'],
                    row['created_at']
                ])
            
            # Write totals row
            writer.writerow([])
            writer.writerow(['TOTALS', '', '', '', report_data['totals']['total_cents'], '', report_data['totals']['count'], ''])
        
        elif report_type == 'attendance':
            # Get attendance data
            report_data = ReportsService.get_attendance_data(
                event_id=filters.get('event'),
                date_from=filters.get('date_from'),
                date_to=filters.get('date_to'),
                user=user
            )
            
            # Write header
            writer.writerow([
                'ID', 'Event Name', 'User Name', 'User Email', 'Ticket Count',
                'Scanned Count', 'Attendance Rate (%)', 'Created At', 'Event Date'
            ])
            
            # Write data rows
            for row in report_data['rows']:
                writer.writerow([
                    row['id'],
                    row['event_name'],
                    row['user_name'],
                    row['user_email'],
                    row['ticket_count'],
                    row['scanned_count'],
                    f"{row['attendance_rate']:.2f}",
                    row['created_at'],
                    row['event_date']
                ])
            
            # Write summary
            writer.writerow([])
            writer.writerow(['SUMMARY', '', '', '', report_data['summary']['total_tickets'], 
                           report_data['summary']['total_scanned'], 
                           f"{report_data['summary']['avg_attendance_rate']:.2f}", '', ''])
        
        elif report_type == 'performance':
            # Get performance data
            report_data = ReportsService.get_performance_data(
                event_id=filters.get('event'),
                division_id=filters.get('division'),
                user=user
            )
            
            # Write team standings
            writer.writerow(['TEAM STANDINGS'])
            writer.writerow([
                'Team', 'Games Played', 'Wins', 'Losses', 'Draws',
                'Points For', 'Points Against', 'Point Difference', 'Win %'
            ])
            
            for standing in report_data['standings']:
                writer.writerow([
                    standing['team'],
                    standing['games_played'],
                    standing['wins'],
                    standing['losses'],
                    standing['draws'],
                    standing['points_for'],
                    standing['points_against'],
                    standing['point_difference'],
                    f"{standing['win_percentage']:.2f}"
                ])
            
            # Write top players
            writer.writerow([])
            writer.writerow(['TOP PLAYERS'])
            writer.writerow(['Player', 'Team', 'Games Played', 'Points Scored', 'Avg Points'])
            
            for player in report_data['top_players']:
                writer.writerow([
                    player['player'],
                    player['team'],
                    player['games_played'],
                    player['points_scored'],
                    f"{player['avg_points']:.2f}"
                ])
        
        return output.getvalue()