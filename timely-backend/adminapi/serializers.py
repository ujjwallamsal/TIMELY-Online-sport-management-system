from rest_framework import serializers
from django.http import HttpResponse
import csv
import io

from accounts.models import User, AuditLog
from events.models import Event
from registrations.models import Registration
from tickets.models import TicketOrder
from .services import AdminDrilldownService


class KPISerializer(serializers.Serializer):
    """Serializer for KPI data"""
    usersByRole = serializers.DictField()
    eventsByStatus = serializers.DictField()
    registrationsByStatus = serializers.DictField()
    tickets = serializers.DictField()
    notificationsSent = serializers.IntegerField()
    errorsRecent = serializers.IntegerField()
    lastUpdated = serializers.DateTimeField()


class UserDrilldownSerializer(serializers.ModelSerializer):
    """Serializer for user drilldown data"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'role_display', 'is_active', 'email_verified', 'created_at'
        ]


class EventDrilldownSerializer(serializers.ModelSerializer):
    """Serializer for event drilldown data"""
    lifecycle_status_display = serializers.CharField(source='get_lifecycle_status_display', read_only=True)
    fee_dollars = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'name', 'sport', 'location', 'lifecycle_status',
            'lifecycle_status_display', 'start_datetime', 'end_datetime',
            'capacity', 'fee_cents', 'fee_dollars', 'created_at', 'created_by_id'
        ]
    
    def get_fee_dollars(self, obj):
        """Convert fee from cents to dollars"""
        return obj.fee_cents / 100 if obj.fee_cents else 0


class RegistrationDrilldownSerializer(serializers.ModelSerializer):
    """Serializer for registration drilldown data"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    fee_dollars = serializers.SerializerMethodField()
    
    class Meta:
        model = Registration
        fields = [
            'id', 'user_id', 'event_id', 'status', 'status_display',
            'payment_status', 'payment_status_display', 'type', 'type_display',
            'team_name', 'fee_cents', 'fee_dollars', 'submitted_at'
        ]
    
    def get_fee_dollars(self, obj):
        """Convert fee from cents to dollars"""
        return obj.fee_cents / 100 if obj.fee_cents else 0


class OrderDrilldownSerializer(serializers.ModelSerializer):
    """Serializer for ticket order drilldown data"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)
    total_dollars = serializers.SerializerMethodField()
    
    class Meta:
        model = TicketOrder
        fields = [
            'id', 'user_id', 'event_id', 'status', 'status_display',
            'total_cents', 'total_dollars', 'currency', 'provider',
            'provider_display', 'created_at'
        ]
    
    def get_total_dollars(self, obj):
        """Convert total from cents to dollars"""
        return obj.total_cents / 100 if obj.total_cents else 0


class AuditLogDrilldownSerializer(serializers.ModelSerializer):
    """Serializer for audit log drilldown data"""
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user_id', 'user_email', 'action', 'action_display',
            'resource_type', 'resource_id', 'details', 'ip_address', 'created_at'
        ]


class CSVExportMixin:
    """Mixin for CSV export functionality"""
    
    def export_to_csv(self, data, filename, headers):
        """Export data to CSV format"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        writer = csv.writer(response)
        writer.writerow(headers)
        
        for item in data:
            row = []
            for header in headers:
                value = item.get(header.lower().replace(' ', '_'), '')
                # Handle special cases
                if header == 'Full Name':
                    value = f"{item.get('first_name', '')} {item.get('last_name', '')}".strip()
                elif header == 'Role Display':
                    value = item.get('role_display', item.get('role', ''))
                elif header == 'Fee Dollars':
                    cents = item.get('fee_cents', 0)
                    value = f"${cents / 100:.2f}" if cents else "$0.00"
                elif header == 'Total Dollars':
                    cents = item.get('total_cents', 0)
                    value = f"${cents / 100:.2f}" if cents else "$0.00"
                elif header == 'User Email':
                    value = item.get('user_email', '')
                elif header == 'Action Display':
                    value = item.get('action_display', item.get('action', ''))
                
                row.append(str(value))
            writer.writerow(row)
        
        return response


class PaginatedResponseSerializer(serializers.Serializer):
    """Serializer for paginated responses"""
    results = serializers.ListField()
    count = serializers.IntegerField()
    page = serializers.IntegerField()
    page_size = serializers.IntegerField()
    total_pages = serializers.IntegerField()
