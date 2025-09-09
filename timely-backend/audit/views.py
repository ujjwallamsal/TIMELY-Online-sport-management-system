"""
Views for audit log management and export
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.db import models
from django.utils import timezone
from django.http import HttpResponse
import csv
import io

from .models import AuditLog
from .serializers import AuditLogSerializer, AuditLogExportSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for audit log management
    Admin-only access for security
    """
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'target_type', 'actor_id']
    search_fields = ['action', 'target_type', 'target_id', 'meta']
    ordering_fields = ['created_at', 'action', 'actor_id']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter queryset based on query parameters"""
        queryset = super().get_queryset()
        
        # Date range filtering
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            try:
                date_from = timezone.datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                queryset = queryset.filter(created_at__gte=date_from)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to = timezone.datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                queryset = queryset.filter(created_at__lte=date_to)
            except ValueError:
                pass
        
        # Actor filtering
        actor = self.request.query_params.get('actor')
        if actor:
            queryset = queryset.filter(actor_id__email__icontains=actor)
        
        # Action filtering
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action__icontains=action)
        
        # General search
        q = self.request.query_params.get('q')
        if q:
            queryset = queryset.filter(
                Q(action__icontains=q) |
                Q(target_type__icontains=q) |
                Q(target_id__icontains=q) |
                Q(meta__icontains=q)
            )
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Export audit logs to CSV
        Supports same filtering as list view
        """
        # Get filtered queryset
        queryset = self.get_queryset()
        
        # Apply pagination if needed (for large exports)
        page_size = int(request.query_params.get('page_size', 1000))
        if page_size > 10000:  # Limit to prevent memory issues
            page_size = 10000
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="audit_logs_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        # Write CSV
        writer = csv.writer(response)
        
        # Write header
        serializer = AuditLogExportSerializer(queryset[:page_size], many=True)
        if serializer.data:
            writer.writerow(serializer.data[0].keys())
            
            # Write data rows
            for row in serializer.data:
                writer.writerow(row.values())
        
        return response
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get audit log statistics
        """
        queryset = self.get_queryset()
        
        # Basic stats
        total_count = queryset.count()
        
        # Actions by type
        action_stats = {}
        for action_choice in AuditLog.ActionType.choices:
            count = queryset.filter(action=action_choice[0]).count()
            if count > 0:
                action_stats[action_choice[1]] = count
        
        # Recent activity (last 24 hours)
        recent_cutoff = timezone.now() - timezone.timedelta(hours=24)
        recent_count = queryset.filter(created_at__gte=recent_cutoff).count()
        
        # Top actors
        top_actors = queryset.filter(actor_id__isnull=False).values(
            'actor_id__email'
        ).annotate(
            count=models.Count('id')
        ).order_by('-count')[:10]
        
        return Response({
            'total_count': total_count,
            'recent_count': recent_count,
            'action_stats': action_stats,
            'top_actors': list(top_actors),
        })
