# reports/serializers.py
from __future__ import annotations

from rest_framework import serializers
from django.db.models import QuerySet
from typing import Dict, Any, List

from .services import ReportsService
from events.models import Event
from registrations.models import Registration
from accounts.models import User


class ReportFiltersSerializer(serializers.Serializer):
    """Serializer for report filtering parameters"""
    event = serializers.IntegerField(required=False, allow_null=True)
    sport = serializers.CharField(required=False, allow_blank=True)
    division = serializers.IntegerField(required=False, allow_null=True)
    date_from = serializers.DateTimeField(required=False, allow_null=True)
    date_to = serializers.DateTimeField(required=False, allow_null=True)
    page = serializers.IntegerField(required=False, default=1, min_value=1)
    page_size = serializers.IntegerField(required=False, default=20, min_value=1, max_value=100)


class RegistrationReportSerializer(serializers.ModelSerializer):
    """Serializer for registration report data"""
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    event_sport = serializers.CharField(source='event.sport', read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)
    kyc_status = serializers.CharField(source='user.kyc_profile.status', read_only=True)
    
    class Meta:
        model = Registration
        fields = [
            'id', 'user_name', 'user_email', 'event_name', 'event_sport',
            'division_name', 'status', 'kyc_status', 'submitted_at'
        ]


class RevenueReportSerializer(serializers.Serializer):
    """Serializer for revenue report data"""
    id = serializers.IntegerField()
    event_name = serializers.CharField()
    event_id = serializers.IntegerField()
    user_name = serializers.CharField()
    user_email = serializers.EmailField()
    total_cents = serializers.IntegerField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    ticket_count = serializers.IntegerField()


class RevenueTotalsSerializer(serializers.Serializer):
    """Serializer for revenue totals"""
    count = serializers.IntegerField()
    total_cents = serializers.IntegerField()


class AttendanceReportSerializer(serializers.Serializer):
    """Serializer for attendance report data"""
    id = serializers.IntegerField()
    event_name = serializers.CharField()
    event_id = serializers.IntegerField()
    user_name = serializers.CharField()
    user_email = serializers.EmailField()
    ticket_count = serializers.IntegerField()
    scanned_count = serializers.IntegerField()
    attendance_rate = serializers.FloatField()
    created_at = serializers.DateTimeField()
    event_date = serializers.DateTimeField()


class AttendanceSummarySerializer(serializers.Serializer):
    """Serializer for attendance summary"""
    total_orders = serializers.IntegerField()
    total_tickets = serializers.IntegerField()
    total_scanned = serializers.IntegerField()
    avg_attendance_rate = serializers.FloatField()


class TeamStandingSerializer(serializers.Serializer):
    """Serializer for team standings"""
    team = serializers.CharField()
    games_played = serializers.IntegerField()
    wins = serializers.IntegerField()
    losses = serializers.IntegerField()
    draws = serializers.IntegerField()
    points_for = serializers.IntegerField()
    points_against = serializers.IntegerField()
    point_difference = serializers.IntegerField()
    win_percentage = serializers.FloatField()


class PlayerStatsSerializer(serializers.Serializer):
    """Serializer for player statistics"""
    player = serializers.CharField()
    team = serializers.CharField()
    games_played = serializers.IntegerField()
    points_scored = serializers.IntegerField()
    avg_points = serializers.FloatField()


class PerformanceSummarySerializer(serializers.Serializer):
    """Serializer for performance summary"""
    total_teams = serializers.IntegerField()
    total_players = serializers.IntegerField()
    total_games = serializers.IntegerField()


class CSVExportSerializer(serializers.Serializer):
    """Serializer for CSV export parameters"""
    report_type = serializers.ChoiceField(choices=[
        'registrations', 'revenue', 'attendance', 'performance'
    ])
    filters = ReportFiltersSerializer(required=False)
    
    def validate_report_type(self, value):
        """Validate report type"""
        if value not in ['registrations', 'revenue', 'attendance', 'performance']:
            raise serializers.ValidationError("Invalid report type")
        return value


class ReportDataSerializer(serializers.Serializer):
    """Base serializer for report data responses"""
    def to_representation(self, instance):
        """Convert report data to representation"""
        if isinstance(instance, dict):
            return instance
        return super().to_representation(instance)


class PaginatedReportSerializer(serializers.Serializer):
    """Serializer for paginated report responses"""
    results = serializers.ListField()
    count = serializers.IntegerField()
    page = serializers.IntegerField()
    page_size = serializers.IntegerField()
    total_pages = serializers.IntegerField()
    next = serializers.BooleanField()
    previous = serializers.BooleanField()
    
    @classmethod
    def paginate_queryset(cls, queryset: QuerySet, page: int, page_size: int) -> Dict[str, Any]:
        """Helper method to paginate a queryset"""
        from django.core.paginator import Paginator
        
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        return {
            'results': list(page_obj),
            'count': paginator.count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous()
        }
