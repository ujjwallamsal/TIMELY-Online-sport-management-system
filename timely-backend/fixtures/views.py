# fixtures/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q

from .models import Fixture
from .serializers import (
    FixtureSerializer, FixtureListSerializer, FixtureGenerateSerializer,
    FixtureAcceptSerializer, FixtureRescheduleSerializer, FixtureSwapEntriesSerializer,
    FixtureConflictSerializer, FixtureProposalSerializer
)
from accounts.permissions import (
    IsOrganizerOfEvent, IsCoachOfTeam, IsAthleteSelf, 
    IsSpectatorReadOnly, IsAdmin
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
    ordering_fields = ['start_at', 'round', 'created_at']
    ordering = ['start_at', 'round']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return FixtureListSerializer
        return FixtureSerializer

    def get_permissions(self):
        """Return appropriate permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsOrganizerOfEvent]
        elif self.action in ['generate', 'accept', 'publish']:
            permission_classes = [IsAuthenticated, IsOrganizerOfEvent]
        elif self.action in ['reschedule', 'swap_entries']:
            permission_classes = [IsAuthenticated, IsOrganizerOfEvent]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Filter fixtures based on user role and permissions"""
        queryset = super().get_queryset()
        
        # Apply role-based filtering
        if not self.request.user.is_authenticated:
            # Public users can only see published fixtures
            queryset = queryset.filter(status=Fixture.Status.PUBLISHED)
        elif self.request.user.is_staff or self.request.user.role == 'ADMIN':
            # Admin sees all fixtures
            pass
        elif self.request.user.role == 'ORGANIZER':
            # Organizer sees fixtures for their events + published fixtures
            queryset = queryset.filter(
                Q(event__created_by=self.request.user) |
                Q(status=Fixture.Status.PUBLISHED)
            )
        elif self.request.user.role == 'COACH':
            # Coach sees fixtures for teams they coach + published fixtures
            from teams.models import Team
            team_ids = Team.objects.filter(coach=self.request.user).values_list('id', flat=True)
            queryset = queryset.filter(
                Q(home_id__in=team_ids) |
                Q(away_id__in=team_ids) |
                Q(status=Fixture.Status.PUBLISHED)
            ).distinct()
        elif self.request.user.role == 'ATHLETE':
            # Athlete sees fixtures for teams they're in + published fixtures
            from teams.models import TeamMember
            team_ids = TeamMember.objects.filter(athlete=self.request.user).values_list('team_id', flat=True)
            queryset = queryset.filter(
                Q(home_id__in=team_ids) |
                Q(away_id__in=team_ids) |
                Q(status=Fixture.Status.PUBLISHED)
            ).distinct()
        else:
            # Spectator sees only published fixtures
            queryset = queryset.filter(status=Fixture.Status.PUBLISHED)
        
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
                start_at = fixture_data['start_at']
                if isinstance(start_at, str):
                    start_at = timezone.datetime.fromisoformat(start_at.replace('Z', '+00:00'))
                
                # Create fixture
                fixture = Fixture.objects.create(
                    event=event,
                    round=fixture_data['round'],
                    phase=fixture_data.get('phase', Fixture.Phase.RR),
                    start_at=start_at,
                    venue_id=fixture_data.get('venue_id'),
                    status=Fixture.Status.SCHEDULED
                )
                
                # Set home and away teams
                if 'home_team_id' in fixture_data:
                    fixture.home_id = fixture_data['home_team_id']
                if 'away_team_id' in fixture_data:
                    fixture.away_id = fixture_data['away_team_id']
                fixture.save()
                
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
        if 'start_at' in data:
            fixture.start_at = data['start_at']
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
        
        # Swap home and away teams
        if fixture.home and fixture.away:
            home_team = fixture.home
            away_team = fixture.away
            fixture.home = away_team
            fixture.away = home_team
            fixture.save()
        
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
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'venue']
    ordering_fields = ['start_at', 'round']
    ordering = ['start_at', 'round']

    def get_queryset(self):
        """Get fixtures for a specific event with role-based filtering"""
        event_id = self.kwargs.get('event_id')
        queryset = Fixture.objects.filter(event_id=event_id)
        
        # Apply role-based filtering
        if not self.request.user.is_authenticated:
            # Public users can only see published fixtures
            queryset = queryset.filter(status=Fixture.Status.PUBLISHED)
        elif self.request.user.is_staff or self.request.user.role == 'ADMIN':
            # Admin sees all fixtures
            pass
        elif self.request.user.role == 'ORGANIZER':
            # Organizer sees fixtures for their events + published fixtures
            queryset = queryset.filter(
                Q(event__created_by=self.request.user) |
                Q(status=Fixture.Status.PUBLISHED)
            )
        elif self.request.user.role == 'COACH':
            # Coach sees fixtures for teams they coach + published fixtures
            from teams.models import Team
            team_ids = Team.objects.filter(coach=self.request.user, event_id=event_id).values_list('id', flat=True)
            queryset = queryset.filter(
                Q(home_id__in=team_ids) |
                Q(away_id__in=team_ids) |
                Q(status=Fixture.Status.PUBLISHED)
            ).distinct()
        elif self.request.user.role == 'ATHLETE':
            # Athlete sees fixtures for teams they're in + published fixtures
            from teams.models import TeamMember
            team_ids = TeamMember.objects.filter(athlete=self.request.user, team__event_id=event_id).values_list('team_id', flat=True)
            queryset = queryset.filter(
                Q(home_id__in=team_ids) |
                Q(away_id__in=team_ids) |
                Q(status=Fixture.Status.PUBLISHED)
            ).distinct()
        else:
            # Spectator sees only published fixtures
            queryset = queryset.filter(status=Fixture.Status.PUBLISHED)
        
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