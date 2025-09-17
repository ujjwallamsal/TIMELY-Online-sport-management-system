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
from accounts.permissions import (
    IsOrganizerOfEvent, IsCoachOfTeam, IsAthleteSelf, 
    IsSpectatorReadOnly, IsAdmin, IsOwnerOrReadOnly
)

# Create a simple permission class for event ownership
class IsEventOwnerOrAdmin(permissions.BasePermission):
    """Allow access to event owners and admins"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin users have access to everything
        if request.user.role == 'ADMIN' or request.user.is_staff:
            return True
        
        # For other operations, check object-level permissions
        return True
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin users have access to everything
        if request.user.role == 'ADMIN' or request.user.is_staff:
            return True
        
        # Event owners have access to their events
        if hasattr(obj, 'event') and obj.event.created_by == request.user:
            return True
        
        return False


class EventViewSet(viewsets.ModelViewSet):
    """Event ViewSet with RBAC and lifecycle management"""
    
    queryset = Event.objects.select_related('created_by').prefetch_related('divisions').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sport', 'status']
    search_fields = ['name', 'description', 'location']
    ordering_fields = ['start_date', 'created_at', 'name']
    ordering = ['start_date', 'created_at']
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
            permission_classes = [IsOrganizerOfEvent]
        else:
            # Owners and admins can update/delete
            permission_classes = [IsOrganizerOfEvent]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter queryset based on user permissions and query params"""
        queryset = super().get_queryset()
        
        # Apply role-based filtering
        if self.action == 'list':
            if not self.request.user.is_authenticated:
                # Public users see only public events
                queryset = queryset.filter(visibility='PUBLIC', status=Event.Status.UPCOMING)
            elif self.request.user.is_staff or self.request.user.role == 'ADMIN':
                # Admin sees all events
                pass
            elif self.request.user.role == 'ORGANIZER':
                # Organizer sees their own events + public events
                queryset = queryset.filter(
                    Q(created_by=self.request.user) |
                    Q(visibility='PUBLIC', status=Event.Status.UPCOMING)
                )
            else:
                # Other roles see only public events
                queryset = queryset.filter(visibility='PUBLIC', status=Event.Status.UPCOMING)
        
        # Apply ?mine=true filter for organizers
        if self.request.query_params.get('mine') == 'true' and self.request.user.is_authenticated:
            if self.request.user.role == 'ORGANIZER':
                queryset = queryset.filter(created_by=self.request.user)
        
        # Apply filters
        sport = self.request.query_params.get('sport')
        if sport:
            queryset = queryset.filter(sport__iexact=sport)
        
        # Status filter (for admin/organizer)
        status_filter = self.request.query_params.get('status')
        if status_filter and self.request.user.is_authenticated:
            if self.request.user.is_staff or self.request.user.role in ['ADMIN', 'ORGANIZER']:
                queryset = queryset.filter(status=status_filter)
        
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
        
        if event.status != Event.Status.UPCOMING:
            return Response(
                {"detail": "Only draft events can be published"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        event.status = Event.Status.UPCOMING
        event.save()
        
        # Send realtime update
        self._send_realtime_update(event, 'published')
        
        return Response({"detail": "Event published successfully"})
    
    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Unpublish an event (return to draft)"""
        event = self.get_object()
        
        if event.status != Event.Status.UPCOMING:
            return Response(
                {"detail": "Only published events can be unpublished"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        event.status = Event.Status.UPCOMING
        event.save()
        
        # Send realtime update
        self._send_realtime_update(event, 'unpublished')
        
        return Response({"detail": "Event unpublished successfully"})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an event"""
        event = self.get_object()
        
        if event.status == Event.Status.CANCELLED:
            return Response(
                {"detail": "Event is already cancelled"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = EventLifecycleActionSerializer(data=request.data)
        if serializer.is_valid():
            reason = serializer.validated_data.get('reason', '')
            event.status = Event.Status.CANCELLED
            event.save()
            
            # Send realtime update
            self._send_realtime_update(event, 'cancelled', {'reason': reason})
            
            return Response({"detail": "Event cancelled successfully"})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def fixtures(self, request, pk=None):
        """Get fixtures for an event (for schedule/results pages)"""
        event = self.get_object()
        
        # Check permissions based on role
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Admin and organizer can see all fixtures
        if request.user.is_staff or request.user.role in ['ADMIN', 'ORGANIZER']:
            pass  # Full access
        # Coach can see fixtures for their team's events
        elif request.user.role == 'COACH':
            # Check if user coaches any team in this event
            from teams.models import Team
            if not Team.objects.filter(event=event, coach=request.user).exists():
                return Response(
                    {"detail": "Permission denied - not a coach for this event"},
                    status=status.HTTP_403_FORBIDDEN
                )
        # Athlete can see fixtures for events they're registered in
        elif request.user.role == 'ATHLETE':
            from registrations.models import Registration
            if not Registration.objects.filter(event=event, applicant=request.user).exists():
                return Response(
                    {"detail": "Permission denied - not registered for this event"},
                    status=status.HTTP_403_FORBIDDEN
                )
        # Spectator can see public fixtures
        elif request.user.role == 'SPECTATOR':
            if event.visibility != 'PUBLIC':
                return Response(
                    {"detail": "Permission denied - event not public"},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
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
    
    @action(detail=True, methods=['get', 'post'])
    def registrations(self, request, pk=None):
        """Get or create registrations for an event"""
        event = self.get_object()
        
        if request.method == 'GET':
            # Check permissions for viewing registrations
            if not request.user.is_authenticated:
                return Response(
                    {"detail": "Authentication required"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Only admin/organizer can view all registrations
            if not (request.user.is_staff or request.user.role in ['ADMIN', 'ORGANIZER']):
                return Response(
                    {"detail": "Permission denied - only organizers can view registrations"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get registrations for this event
            from registrations.models import Registration
            from registrations.serializers import RegistrationSerializer
            
            registrations = Registration.objects.filter(event=event).select_related('applicant', 'team')
            serializer = RegistrationSerializer(registrations, many=True)
            
            return Response({
                'event_id': event.id,
                'event_name': event.name,
                'registrations': serializer.data
            })
        
        elif request.method == 'POST':
            # Athletes can create registrations for themselves
            if not request.user.is_authenticated:
                return Response(
                    {"detail": "Authentication required"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if request.user.role not in ['ATHLETE', 'COACH']:
                return Response(
                    {"detail": "Permission denied - only athletes and coaches can register"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Create new registration
            from registrations.models import Registration
            from registrations.serializers import RegistrationSerializer
            
            data = request.data.copy()
            data['event'] = event.id
            data['applicant'] = request.user.id
            
            serializer = RegistrationSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='fixtures/generate')
    def generate_fixtures(self, request, pk=None):
        """Generate fixtures for an event (Round Robin or Knockout)"""
        event = self.get_object()
        
        # Only admin/organizer can generate fixtures
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not (request.user.is_staff or request.user.role in ['ADMIN', 'ORGANIZER']):
            return Response(
                {"detail": "Permission denied - only organizers can generate fixtures"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        mode = request.query_params.get('mode', 'rr')  # Default to Round Robin
        
        if mode not in ['rr', 'ko']:
            return Response(
                {"detail": "Mode must be 'rr' (Round Robin) or 'ko' (Knockout)"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Import fixture generator
            from fixtures.services.generator import generate_round_robin, generate_knockout
            
            if mode == 'rr':
                fixtures = generate_round_robin(event)
            else:
                fixtures = generate_knockout(event)
            
            return Response({
                'event_id': event.id,
                'event_name': event.name,
                'mode': mode,
                'fixtures_generated': len(fixtures),
                'message': f'Generated {len(fixtures)} fixtures using {mode.upper()} mode'
            })
            
        except Exception as e:
            return Response(
                {"detail": f"Error generating fixtures: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
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
                        'status': event.status,
                        'start_date': event.start_date.isoformat(),
                        'end_date': event.end_date.isoformat(),
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
                if event.status == Event.Status.UPCOMING:
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
    permission_classes = [IsOrganizerOfEvent]
    
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
