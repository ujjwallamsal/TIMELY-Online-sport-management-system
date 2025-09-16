from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from .models import Event, Division
from .serializers import (
    EventSerializer, EventListSerializer, DivisionSerializer,
    EventLifecycleActionSerializer
)
from .permissions import IsEventOwnerOrAdmin, IsOrganizerOrAdmin, IsAdminOrReadOnly


class EventViewSet(viewsets.ModelViewSet):
    """Event ViewSet with RBAC and lifecycle management"""
    
    queryset = Event.objects.select_related('created_by').prefetch_related('divisions').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sport', 'lifecycle_status']
    search_fields = ['name', 'description', 'location']
    ordering_fields = ['start_datetime', 'created_at', 'name']
    ordering = ['start_datetime', 'created_at']
    # Use default pagination from settings
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        return EventSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve']:
            # Public read access for published events
            permission_classes = [permissions.AllowAny]
        elif self.action == 'create':
            # Only organizers and admins can create
            permission_classes = [IsOrganizerOrAdmin]
        else:
            # Owners and admins can update/delete
            permission_classes = [IsEventOwnerOrAdmin]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter queryset based on user permissions and query params"""
        queryset = super().get_queryset()
        
        # Public list defaults to published only
        if self.action == 'list' and not self.request.user.is_authenticated:
            queryset = queryset.filter(lifecycle_status=Event.LifecycleStatus.PUBLISHED)
        elif self.action == 'list' and self.request.user.is_authenticated:
            # Admin sees all events, Organizer sees their own + published, others see published only
            if self.request.user.role == 'ADMIN':
                # Admin sees all events
                pass
            elif self.request.user.role == 'ORGANIZER':
                # Organizer sees their own events + published events
                queryset = queryset.filter(
                    Q(lifecycle_status=Event.LifecycleStatus.PUBLISHED) |
                    Q(created_by=self.request.user)
                )
            else:
                # Other users see only published events
                queryset = queryset.filter(lifecycle_status=Event.LifecycleStatus.PUBLISHED)
        
        # Apply filters
        sport = self.request.query_params.get('sport')
        if sport:
            queryset = queryset.filter(sport__iexact=sport)
        
        # Status filter (for admin/organizer)
        status_filter = self.request.query_params.get('status')
        if status_filter and self.request.user.is_authenticated:
            if self.request.user.role in ['ADMIN', 'ORGANIZER']:
                queryset = queryset.filter(lifecycle_status=status_filter)
        
        # Date range filter
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(start_datetime__gte=date_from)
        if date_to:
            queryset = queryset.filter(end_datetime__lte=date_to)
        
        # Search query
        q = self.request.query_params.get('q')
        if q:
            queryset = queryset.filter(
                Q(name__icontains=q) |
                Q(description__icontains=q) |
                Q(location__icontains=q)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a draft event"""
        event = self.get_object()
        
        if event.lifecycle_status != Event.LifecycleStatus.DRAFT:
            return Response(
                {"detail": "Only draft events can be published"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        event.lifecycle_status = Event.LifecycleStatus.PUBLISHED
        event.save()
        
        # Send realtime update
        self._send_realtime_update(event, 'published')
        
        return Response({"detail": "Event published successfully"})
    
    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Unpublish an event (return to draft)"""
        event = self.get_object()
        
        if event.lifecycle_status != Event.LifecycleStatus.PUBLISHED:
            return Response(
                {"detail": "Only published events can be unpublished"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        event.lifecycle_status = Event.LifecycleStatus.DRAFT
        event.save()
        
        # Send realtime update
        self._send_realtime_update(event, 'unpublished')
        
        return Response({"detail": "Event unpublished successfully"})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an event"""
        event = self.get_object()
        
        if event.lifecycle_status == Event.LifecycleStatus.CANCELLED:
            return Response(
                {"detail": "Event is already cancelled"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = EventLifecycleActionSerializer(data=request.data)
        if serializer.is_valid():
            reason = serializer.validated_data.get('reason', '')
            event.lifecycle_status = Event.LifecycleStatus.CANCELLED
            event.save()
            
            # Send realtime update
            self._send_realtime_update(event, 'cancelled', {'reason': reason})
            
            return Response({"detail": "Event cancelled successfully"})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def fixtures(self, request, pk=None):
        """Get fixtures for an event (for schedule/results pages)"""
        event = self.get_object()
        
        # Only admin/organizer can access fixtures
        if not request.user.is_authenticated or request.user.role not in ['ADMIN', 'ORGANIZER']:
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get date range filters
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        
        # For now, return empty fixtures (can be extended with actual fixture model)
        fixtures = []
        
        return Response({
            'event_id': event.id,
            'event_name': event.name,
            'fixtures': fixtures,
            'from_date': from_date,
            'to_date': to_date
        })
    
    def _send_realtime_update(self, event, action, extra_data=None):
        """Send realtime update via WebSocket (safe no-op if Channels not available)"""
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            
            channel_layer = get_channel_layer()
            if channel_layer:
                payload = {
                    'type': 'event_update',
                    'event_id': event.id,
                    'action': action,
                    'data': {
                        'id': event.id,
                        'name': event.name,
                        'lifecycle_status': event.lifecycle_status,
                        'start_datetime': event.start_datetime.isoformat(),
                        'end_datetime': event.end_datetime.isoformat(),
                        'phase': event.phase,
                    }
                }
                if extra_data:
                    payload['data'].update(extra_data)
                
                # Send to admin group
                async_to_sync(channel_layer.group_send)(
                    'events:admin',
                    payload
                )
                
                # Send to organizer group
                async_to_sync(channel_layer.group_send)(
                    f'events:org:{event.created_by_id}',
                    payload
                )
                
                # Send to public group if published
                if event.lifecycle_status == Event.LifecycleStatus.PUBLISHED:
                    async_to_sync(channel_layer.group_send)(
                        'events:public',
                        payload
                    )
        except ImportError:
            # Channels not available, silently continue
            pass


class DivisionViewSet(viewsets.ModelViewSet):
    """Division ViewSet for managing event divisions"""
    
    serializer_class = DivisionSerializer
    permission_classes = [IsEventOwnerOrAdmin]
    
    def get_queryset(self):
        """Filter divisions by event"""
        event_id = self.kwargs.get('event_pk')
        if event_id:
            return Division.objects.filter(event_id=event_id).order_by('sort_order', 'name')
        return Division.objects.none()
    
    def get_serializer_context(self):
        """Add event context for validation"""
        context = super().get_serializer_context()
        event_id = self.kwargs.get('event_pk')
        if event_id:
            try:
                context['event'] = Event.objects.get(id=event_id)
            except Event.DoesNotExist:
                pass
        return context
    
    def perform_create(self, serializer):
        """Set event from URL parameter"""
        event_id = self.kwargs.get('event_pk')
        event = Event.objects.get(id=event_id)
        serializer.save(event=event)
