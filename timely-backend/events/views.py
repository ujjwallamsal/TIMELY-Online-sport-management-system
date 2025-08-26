from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from .models import Event, Division
from .serializers import (
    EventSerializer, EventCreateSerializer, EventUpdateSerializer, 
    EventListSerializer, DivisionSerializer
)

class IsOrganizerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return user.is_authenticated and (user.is_superuser or user.role in ("ORGANIZER", "ADMIN"))

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return user.is_authenticated and (
            user.is_superuser or 
            user.role == "ADMIN" or 
            (user.role == "ORGANIZER" and obj.created_by == user)
        )

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.select_related("venue", "created_by").prefetch_related("divisions").all()
    permission_classes = [IsOrganizerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "sport_type", "venue", "divisions"]
    search_fields = ["name", "sport_type", "description", "eligibility_notes"]
    ordering_fields = ["start_date", "end_date", "name", "created_at", "fee_cents"]
    ordering = ["-start_date", "-created_at"]

    def get_serializer_class(self):
        if self.action == 'create':
            return EventCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return EventUpdateSerializer
        elif self.action == 'list':
            return EventListSerializer
        return EventSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_date__lte=end_date)
        
        # Filter by registration status
        registration_open = self.request.query_params.get('registration_open')
        if registration_open == 'true':
            now = timezone.now()
            queryset = queryset.filter(
                registration_open__lte=now,
                registration_close__gte=now
            )
        
        # Filter by price range
        min_fee = self.request.query_params.get('min_fee')
        max_fee = self.request.query_params.get('max_fee')
        
        if min_fee:
            queryset = queryset.filter(fee_cents__gte=int(float(min_fee) * 100))
        if max_fee:
            queryset = queryset.filter(fee_cents__lte=int(float(max_fee) * 100))
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsOrganizerOrReadOnly])
    def publish(self, request, pk=None):
        """Publish a draft event"""
        event = self.get_object()
        
        if event.status != Event.Status.DRAFT:
            return Response(
                {"detail": "Only draft events can be published"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for venue conflicts
        conflicting_events = Event.objects.filter(
            venue=event.venue,
            status__in=[Event.Status.PUBLISHED, Event.Status.UPCOMING],
            start_date__lt=event.end_date,
            end_date__gt=event.start_date
        ).exclude(id=event.id)
        
        if conflicting_events.exists():
            return Response(
                {"detail": "Venue conflict detected with existing events"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        event.status = Event.Status.PUBLISHED
        event.save()
        
        return Response({"detail": "Event published successfully"})

    @action(detail=True, methods=['post'], permission_classes=[IsOrganizerOrReadOnly])
    def unpublish(self, request, pk=None):
        """Unpublish an event and return to draft"""
        event = self.get_object()
        
        if event.status not in [Event.Status.PUBLISHED, Event.Status.UPCOMING]:
            return Response(
                {"detail": "Only published or upcoming events can be unpublished"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        event.status = Event.Status.DRAFT
        event.save()
        
        return Response({"detail": "Event unpublished successfully"})

    @action(detail=True, methods=['post'], permission_classes=[IsOrganizerOrReadOnly])
    def cancel(self, request, pk=None):
        """Cancel an event"""
        event = self.get_object()
        
        if event.status in [Event.Status.COMPLETED, Event.Status.CANCELLED]:
            return Response(
                {"detail": "Cannot cancel completed or already cancelled events"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        event.status = Event.Status.CANCELLED
        event.save()
        
        return Response({"detail": "Event cancelled successfully"})

    @action(detail=False, methods=['get'])
    def my_events(self, request):
        """Get events created by the current user (organizer only)"""
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        
        if request.user.role not in ["ORGANIZER", "ADMIN"]:
            return Response({"detail": "Organizer access required"}, status=status.HTTP_403_FORBIDDEN)
        
        events = self.get_queryset().filter(created_by=request.user)
        serializer = EventListSerializer(events, many=True)
        return Response(serializer.data)

class DivisionViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for divisions"""
    queryset = Division.objects.all()
    serializer_class = DivisionSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']
