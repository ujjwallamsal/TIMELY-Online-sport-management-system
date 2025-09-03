# fixtures/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q

from .models import Fixture, FixtureEntry
from .serializers import (
    FixtureSerializer, FixtureListSerializer, FixtureGenerateSerializer,
    FixtureAcceptSerializer, FixtureRescheduleSerializer, FixtureSwapEntriesSerializer,
    FixtureConflictSerializer, FixtureProposalSerializer
)
from .permissions import (
    CanManageFixtures, CanViewFixtures, CanGenerateFixtures,
    CanPublishFixtures, CanRescheduleFixtures
)
from .services.generator import (
    generate_round_robin, generate_knockout, get_available_teams_for_event,
    validate_participants
)
from .services.conflicts import (
    find_conflicts, check_fixture_conflicts, validate_fixture_schedule,
    check_venue_availability, suggest_alternative_times
)


class FixtureViewSet(viewsets.ModelViewSet):
    """
    ViewSet for fixture CRUD operations.
    """
    queryset = Fixture.objects.all()
    permission_classes = [IsAuthenticated, CanViewFixtures]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['event', 'status', 'venue']
    ordering_fields = ['starts_at', 'round_no', 'created_at']
    ordering = ['starts_at', 'round_no']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return FixtureListSerializer
        return FixtureSerializer

    def get_permissions(self):
        """Return appropriate permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, CanManageFixtures]
        elif self.action in ['generate', 'accept', 'publish']:
            permission_classes = [IsAuthenticated, CanGenerateFixtures]
        elif self.action in ['reschedule', 'swap_entries']:
            permission_classes = [IsAuthenticated, CanRescheduleFixtures]
        else:
            permission_classes = [IsAuthenticated, CanViewFixtures]
        
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Filter fixtures based on user permissions"""
        queryset = super().get_queryset()
        
        # Public users can only see published fixtures
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(status=Fixture.Status.PUBLISHED)
        else:
            # Non-admin users can only see fixtures for their own events
            if not self.request.user.is_staff:
                queryset = queryset.filter(
                    Q(event__created_by=self.request.user) |
                    Q(status=Fixture.Status.PUBLISHED)
                )
        
        return queryset

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        """Generate fixture proposals"""
        serializer = FixtureGenerateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        event_id = data['event_id']
        mode = data['mode']
        participants = data['participants']
        slot_hints = data.get('slot_hints', {})
        
        # Check if user can manage this event
        try:
            from events.models import Event
            event = Event.objects.get(id=event_id)
            if not (request.user.is_staff or event.created_by == request.user):
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        except Event.DoesNotExist:
            return Response(
                {'error': 'Event not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate participants
        validation = validate_participants(participants, event_id)
        if not validation['valid']:
            return Response({
                'error': 'Invalid participants',
                'invalid_ids': validation['invalid_ids'],
                'available_teams': validation['available_teams']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Generate fixtures based on mode
            if mode == 'rr':
                fixtures = generate_round_robin(participants, slot_hints)
            elif mode == 'ko':
                fixtures = generate_knockout(participants, slot_hints)
            else:
                return Response(
                    {'error': 'Invalid mode'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                'event_id': event_id,
                'mode': mode,
                'participants': participants,
                'fixtures': fixtures,
                'count': len(fixtures)
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], url_path='accept')
    def accept(self, request):
        """Accept generated fixtures and save as draft"""
        serializer = FixtureAcceptSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        event_id = data['event_id']
        fixtures_data = data['fixtures']
        
        # Check if user can manage this event
        try:
            from events.models import Event
            event = Event.objects.get(id=event_id)
            if not (request.user.is_staff or event.created_by == request.user):
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        except Event.DoesNotExist:
            return Response(
                {'error': 'Event not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate fixtures for conflicts
        validation = validate_fixture_schedule(fixtures_data, event_id)
        if not validation['valid']:
            return Response({
                'error': 'Conflicts detected',
                'conflicts': validation['conflicts']
            }, status=status.HTTP_409_CONFLICT)
        
        try:
            # Create fixtures
            created_fixtures = []
            for fixture_data in fixtures_data:
                # Convert string dates to datetime
                starts_at = fixture_data['starts_at']
                ends_at = fixture_data['ends_at']
                if isinstance(starts_at, str):
                    starts_at = timezone.datetime.fromisoformat(starts_at.replace('Z', '+00:00'))
                if isinstance(ends_at, str):
                    ends_at = timezone.datetime.fromisoformat(ends_at.replace('Z', '+00:00'))
                
                # Create fixture
                fixture = Fixture.objects.create(
                    event=event,
                    round_no=fixture_data['round_no'],
                    starts_at=starts_at,
                    ends_at=ends_at,
                    venue_id=fixture_data.get('venue_id'),
                    status=Fixture.Status.DRAFT
                )
                
                # Create entries
                for entry_data in fixture_data['entries']:
                    FixtureEntry.objects.create(
                        fixture=fixture,
                        side=entry_data['side'],
                        team_id=entry_data.get('team_id'),
                        participant_id=entry_data.get('participant_id')
                    )
                
                created_fixtures.append(FixtureSerializer(fixture).data)
            
            return Response({
                'message': 'Fixtures created successfully',
                'fixtures': created_fixtures,
                'count': len(created_fixtures)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        """Publish a fixture"""
        fixture = self.get_object()
        
        # Check if user can manage this event
        if not (request.user.is_staff or fixture.event.created_by == request.user):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not fixture.can_be_published():
            return Response(
                {'error': 'Fixture cannot be published'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for conflicts
        conflicts = check_fixture_conflicts(fixture)
        if conflicts:
            return Response({
                'error': 'Conflicts detected',
                'conflicts': conflicts
            }, status=status.HTTP_409_CONFLICT)
        
        fixture.status = Fixture.Status.PUBLISHED
        fixture.save()
        
        return Response({
            'message': 'Fixture published successfully',
            'fixture': FixtureSerializer(fixture).data
        })

    @action(detail=True, methods=['post'], url_path='reschedule')
    def reschedule(self, request, pk=None):
        """Reschedule a fixture"""
        fixture = self.get_object()
        
        # Check if user can manage this event
        if not (request.user.is_staff or fixture.event.created_by == request.user):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = FixtureRescheduleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Update fixture
        if 'starts_at' in data:
            fixture.starts_at = data['starts_at']
        if 'ends_at' in data:
            fixture.ends_at = data['ends_at']
        if 'venue_id' in data:
            fixture.venue_id = data['venue_id']
        
        # Check for conflicts
        conflicts = check_fixture_conflicts(fixture)
        if conflicts:
            return Response({
                'error': 'Conflicts detected',
                'conflicts': conflicts
            }, status=status.HTTP_409_CONFLICT)
        
        fixture.save()
        
        return Response({
            'message': 'Fixture rescheduled successfully',
            'fixture': FixtureSerializer(fixture).data
        })

    @action(detail=True, methods=['post'], url_path='swap-entries')
    def swap_entries(self, request, pk=None):
        """Swap home and away entries"""
        fixture = self.get_object()
        
        # Check if user can manage this event
        if not (request.user.is_staff or fixture.event.created_by == request.user):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = FixtureSwapEntriesSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Swap entries
        home_entry = fixture.entries.filter(side=FixtureEntry.Side.HOME).first()
        away_entry = fixture.entries.filter(side=FixtureEntry.Side.AWAY).first()
        
        if home_entry and away_entry:
            home_entry.side = FixtureEntry.Side.AWAY
            away_entry.side = FixtureEntry.Side.HOME
            home_entry.save()
            away_entry.save()
        
        return Response({
            'message': 'Entries swapped successfully',
            'fixture': FixtureSerializer(fixture).data
        })

    @action(detail=True, methods=['get'], url_path='conflicts')
    def conflicts(self, request, pk=None):
        """Check conflicts for a fixture"""
        fixture = self.get_object()
        
        conflicts = check_fixture_conflicts(fixture)
        
        return Response({
            'fixture_id': fixture.id,
            'has_conflicts': len(conflicts) > 0,
            'conflicts': conflicts
        })


class EventFixtureViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for event-specific fixture operations.
    """
    serializer_class = FixtureListSerializer
    permission_classes = [CanViewFixtures]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'venue']
    ordering_fields = ['starts_at', 'round_no']
    ordering = ['starts_at', 'round_no']

    def get_queryset(self):
        """Get fixtures for a specific event"""
        event_id = self.kwargs.get('event_id')
        queryset = Fixture.objects.filter(event_id=event_id)
        
        # Public users can only see published fixtures
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(status=Fixture.Status.PUBLISHED)
        else:
            # Non-admin users can only see fixtures for their own events
            if not self.request.user.is_staff:
                queryset = queryset.filter(
                    Q(event__created_by=self.request.user) |
                    Q(status=Fixture.Status.PUBLISHED)
                )
        
        return queryset

    @action(detail=False, methods=['post'], url_path='publish')
    def publish_all(self, request, event_id=None):
        """Publish all draft fixtures for an event"""
        # Check if user can manage this event
        try:
            from events.models import Event
            event = Event.objects.get(id=event_id)
            if not (request.user.is_staff or event.created_by == request.user):
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        except Event.DoesNotExist:
            return Response(
                {'error': 'Event not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all draft fixtures for the event
        draft_fixtures = Fixture.objects.filter(
            event_id=event_id,
            status=Fixture.Status.DRAFT
        )
        
        if not draft_fixtures.exists():
            return Response(
                {'error': 'No draft fixtures found'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for conflicts
        all_conflicts = []
        for fixture in draft_fixtures:
            conflicts = check_fixture_conflicts(fixture)
            if conflicts:
                all_conflicts.append({
                    'fixture_id': fixture.id,
                    'conflicts': conflicts
                })
        
        if all_conflicts:
            return Response({
                'error': 'Conflicts detected',
                'conflicts': all_conflicts
            }, status=status.HTTP_409_CONFLICT)
        
        # Publish all fixtures
        published_count = draft_fixtures.update(status=Fixture.Status.PUBLISHED)
        
        return Response({
            'message': f'{published_count} fixtures published successfully',
            'published_count': published_count
        })