from django.core.cache import cache
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
import logging

from accounts.models import User, AuditLog
from events.models import Event
from registrations.models import Registration
from tickets.models import TicketOrder
from notifications.models import Notification

logger = logging.getLogger(__name__)


class AdminKPIService:
    """Service for aggregating admin dashboard KPIs with caching"""
    
    CACHE_KEY = 'admin_kpis'
    CACHE_TIMEOUT = 60  # 60 seconds cache
    
    @classmethod
    def get_kpis(cls):
        """Get cached KPIs or compute fresh ones"""
        cached_kpis = cache.get(cls.CACHE_KEY)
        if cached_kpis:
            return cached_kpis
        
        kpis = cls._compute_kpis()
        cache.set(cls.CACHE_KEY, kpis, cls.CACHE_TIMEOUT)
        return kpis
    
    @classmethod
    def invalidate_cache(cls):
        """Invalidate KPI cache"""
        cache.delete(cls.CACHE_KEY)
    
    @classmethod
    def _compute_kpis(cls):
        """Compute all KPIs from database"""
        try:
            # Users by role
            users_by_role = cls._get_users_by_role()
            
            # Events by status
            events_by_status = cls._get_events_by_status()
            
            # Registrations by status
            registrations_by_status = cls._get_registrations_by_status()
            
            # Ticket sales and revenue
            ticket_stats = cls._get_ticket_stats()
            
            # Notifications sent
            notifications_sent = cls._get_notifications_sent()
            
            # Recent errors from logs
            recent_errors = cls._get_recent_errors()
            
            return {
                'usersByRole': users_by_role,
                'eventsByStatus': events_by_status,
                'registrationsByStatus': registrations_by_status,
                'tickets': ticket_stats,
                'notificationsSent': notifications_sent,
                'errorsRecent': recent_errors,
                'lastUpdated': timezone.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error computing KPIs: {e}")
            return {
                'usersByRole': {},
                'eventsByStatus': {},
                'registrationsByStatus': {},
                'tickets': {'count': 0, 'totalCents': 0},
                'notificationsSent': 0,
                'errorsRecent': 0,
                'lastUpdated': timezone.now().isoformat(),
                'error': str(e)
            }
    
    @classmethod
    def _get_users_by_role(cls):
        """Get user counts by role"""
        role_counts = User.objects.values('role').annotate(
            count=Count('id')
        ).order_by('role')
        
        return {item['role']: item['count'] for item in role_counts}
    
    @classmethod
    def _get_events_by_status(cls):
        """Get event counts by lifecycle status"""
        status_counts = Event.objects.values('lifecycle_status').annotate(
            count=Count('id')
        ).order_by('lifecycle_status')
        
        return {item['lifecycle_status']: item['count'] for item in status_counts}
    
    @classmethod
    def _get_registrations_by_status(cls):
        """Get registration counts by status"""
        status_counts = Registration.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        return {item['status']: item['count'] for item in status_counts}
    
    @classmethod
    def _get_ticket_stats(cls):
        """Get ticket sales count and total revenue"""
        paid_orders = TicketOrder.objects.filter(status='paid')
        
        count = paid_orders.count()
        total_cents = paid_orders.aggregate(
            total=Sum('total_cents')
        )['total'] or 0
        
        return {
            'count': count,
            'totalCents': total_cents
        }
    
    @classmethod
    def _get_notifications_sent(cls):
        """Get count of notifications sent"""
        return Notification.objects.count()
    
    @classmethod
    def _get_recent_errors(cls):
        """Get count of recent errors from audit logs"""
        # Look for error-related actions in the last 24 hours
        since = timezone.now() - timedelta(hours=24)
        
        error_actions = [
            'PAYMENT_PROCESSING',  # Could indicate payment failures
            'DELETE',  # Could indicate data loss
        ]
        
        return AuditLog.objects.filter(
            action__in=error_actions,
            created_at__gte=since
        ).count()


class AdminDrilldownService:
    """Service for drilldown data with filtering and pagination"""
    
    @classmethod
    def get_users(cls, role=None, search=None, page=1, page_size=20):
        """Get paginated users with optional filtering"""
        queryset = User.objects.all().order_by('-created_at')
        
        if role:
            queryset = queryset.filter(role__iexact=role)
        
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        # Calculate pagination
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        
        users = queryset[start:end]
        
        return {
            'results': list(users.values(
                'id', 'email', 'first_name', 'last_name', 'role', 
                'is_active', 'email_verified', 'created_at'
            )),
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }
    
    @classmethod
    def get_events(cls, status=None, search=None, page=1, page_size=20):
        """Get paginated events with optional filtering"""
        queryset = Event.objects.all().order_by('-created_at')
        
        if status:
            queryset = queryset.filter(lifecycle_status__iexact=status)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(sport__icontains=search) |
                Q(location__icontains=search)
            )
        
        # Calculate pagination
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        
        events = queryset[start:end]
        
        return {
            'results': list(events.values(
                'id', 'name', 'sport', 'location', 'lifecycle_status',
                'start_datetime', 'end_datetime', 'capacity', 'fee_cents',
                'created_at', 'created_by_id'
            )),
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }
    
    @classmethod
    def get_registrations(cls, status=None, event_id=None, page=1, page_size=20):
        """Get paginated registrations with optional filtering"""
        queryset = Registration.objects.select_related('user', 'event').order_by('-submitted_at')
        
        if status:
            queryset = queryset.filter(status__iexact=status)
        
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        # Calculate pagination
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        
        registrations = queryset[start:end]
        
        return {
            'results': list(registrations.values(
                'id', 'user_id', 'event_id', 'status', 'payment_status',
                'type', 'team_name', 'fee_cents', 'submitted_at'
            )),
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }
    
    @classmethod
    def get_orders(cls, status=None, event_id=None, page=1, page_size=20):
        """Get paginated ticket orders with optional filtering"""
        queryset = TicketOrder.objects.select_related('user', 'event').order_by('-created_at')
        
        if status:
            queryset = queryset.filter(status__iexact=status)
        
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        # Calculate pagination
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        
        orders = queryset[start:end]
        
        return {
            'results': list(orders.values(
                'id', 'user_id', 'event_id', 'status', 'total_cents',
                'currency', 'provider', 'created_at'
            )),
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }
    
    @classmethod
    def get_audit_logs(cls, search=None, actor_id=None, action=None, page=1, page_size=20):
        """Get paginated audit logs with optional filtering"""
        queryset = AuditLog.objects.select_related('user').order_by('-created_at')
        
        if search:
            queryset = queryset.filter(
                Q(resource_type__icontains=search) |
                Q(details__icontains=search)
            )
        
        if actor_id:
            queryset = queryset.filter(user_id=actor_id)
        
        if action:
            queryset = queryset.filter(action__iexact=action)
        
        # Calculate pagination
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        
        logs = queryset[start:end]
        
        return {
            'results': list(logs.values(
                'id', 'user_id', 'action', 'resource_type', 'resource_id',
                'details', 'ip_address', 'created_at'
            )),
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }
