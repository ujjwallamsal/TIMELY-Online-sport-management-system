# api/views.py - Unified API Views
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.authentication import JWTAuthentication
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import timedelta

from common.pagination import TimelyPageNumberPagination
from .permissions import (
    IsAdmin, IsOrganizer, IsCoach, IsAthlete, IsSpectator,
    IsEventOrganizer, IsEventParticipant
)
from .filters import (
    EventFilter, VenueFilter, RegistrationFilter, FixtureFilter, ResultFilter
)
from .serializers import (
    EventSerializer, VenueSerializer, SportSerializer, TeamSerializer,
    RegistrationSerializer, FixtureSerializer, ResultSerializer,
    NotificationSerializer, AnnouncementSerializer, ReportSerializer,
    UserSerializer
)

# Import models
from events.models import Event
from venues.models import Venue
from sports.models import Sport
from teams.models import Team, TeamMember
from registrations.models import Registration
from fixtures.models import Fixture
from results.models import Result, LeaderboardEntry
from notifications.models import Notification
from accounts.models import User
from events.models import Announcement

# Import gallery models and serializers for media endpoints
from gallery.models import Media
from gallery.serializers import MediaUploadSerializer, MediaModerationSerializer, PublicMediaSerializer


# ===== AUTHENTICATION VIEWSETS =====

class HealthView(APIView):
    """Lightweight health check returning a simple ok flag"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"ok": True})

class AuthViewSet(viewsets.ViewSet):
    """Authentication endpoints - delegates to accounts app"""
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """User registration - delegates to accounts app"""
        from accounts.views import AuthViewSet
        auth_view = AuthViewSet()
        return auth_view.register(request)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """User login - delegates to accounts app"""
        from accounts.views import AuthViewSet
        auth_view = AuthViewSet()
        return auth_view.login(request)
    
    @action(detail=False, methods=['post'])
    def refresh(self, request):
        """Token refresh - delegates to accounts app"""
        from accounts.views import AuthViewSet
        auth_view = AuthViewSet()
        return auth_view.refresh(request)


class UserViewSet(viewsets.ModelViewSet):
    """User management endpoints - delegates to accounts app"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name']
    filterset_fields = ['role', 'is_verified', 'is_active']
    ordering_fields = ['created_at', 'last_login']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter users based on permissions"""
        if self.request.user.is_superuser or self.request.user.role == User.Role.ADMIN:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    def get_permissions(self):
        """Restrict write operations on users to admins only."""
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsAdmin]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """Get or update current user profile - delegates to accounts app"""
        from accounts.views import UserViewSet
        user_view = UserViewSet()
        user_view.request = request
        return user_view.me(request)


# ===== SPORTS & VENUES =====

class SportViewSet(viewsets.ModelViewSet):
    """Sport management endpoints"""
    queryset = Sport.objects.all()
    serializer_class = SportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_permissions(self):
        """Override permissions for different actions"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsOrganizer]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]


class VenueViewSet(viewsets.ModelViewSet):
    """Venue management endpoints"""
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = VenueFilter
    search_fields = ['name', 'address']
    ordering_fields = ['name', 'capacity', 'created_at']
    ordering = ['name']
    
    def get_permissions(self):
        """Override permissions for different actions"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsOrganizer]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """Ensure created_by is set for Venue creation."""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def availability(self, request):
        """Check venue availability for a date range"""
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        
        if not from_date or not to_date:
            return Response(
                {'error': 'from and to parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from_dt = timezone.datetime.fromisoformat(from_date.replace('Z', '+00:00'))
            to_dt = timezone.datetime.fromisoformat(to_date.replace('Z', '+00:00'))
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use ISO format.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for conflicts
        conflicting_events = Event.objects.filter(
            venue__isnull=False,
            start_datetime__lt=to_dt,
            end_datetime__gt=from_dt,
            status__in=[Event.Status.UPCOMING, Event.Status.ONGOING]
        ).select_related('venue')
        
        venues_with_conflicts = set(conflicting_events.values_list('venue_id', flat=True))
        available_venues = Venue.objects.exclude(id__in=venues_with_conflicts)
        
        serializer = self.get_serializer(available_venues, many=True)
        return Response({
            'available_venues': serializer.data,
            'conflicts': [
                {
                    'venue_id': event.venue.id,
                    'venue_name': event.venue.name,
                    'event_name': event.name,
                    'start': event.start_datetime,
                    'end': event.end_datetime
                }
                for event in conflicting_events
            ]
        })


# ===== EVENTS =====

class EventViewSet(viewsets.ModelViewSet):
    """Event management endpoints"""
    queryset = Event.objects.select_related('venue', 'created_by').all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = EventFilter
    search_fields = ['name', 'description', 'sport']
    ordering_fields = ['start_datetime', 'created_at', 'name']
    ordering = ['-start_datetime']
    
    def get_permissions(self):
        """Override permissions for different actions"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsOrganizer]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """Create event with proper permissions"""
        try:
            serializer.save(created_by=self.request.user)
        except Exception as e:
            # Surface DB/validation issues as 400 for easier debugging during acceptance run
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'non_field_errors': [str(e)]})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an event"""
        event = self.get_object()
        if event.status == Event.Status.CANCELLED:
            return Response(
                {'error': 'Event is already cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        event.status = Event.Status.CANCELLED
        event.save()
        
        return Response({'message': 'Event cancelled successfully'})
    
    @action(detail=True, methods=['post'])
    def announce(self, request, pk=None):
        """Send announcement for an event"""
        event = self.get_object()
        title = request.data.get('title') or request.data.get('subject')
        message = request.data.get('message') or request.data.get('body')
        announcement_type = request.data.get('type', 'GENERAL')
        priority = request.data.get('priority', 'NORMAL')
        
        if not title or not message:
            return Response(
                {'error': 'title and message are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        announcement = Announcement.objects.create(
            event=event,
            title=title,
            message=message,
            type=announcement_type,
            priority=priority,
            created_by=request.user
        )
        
        return Response({
            'message': 'Announcement sent successfully',
            'announcement_id': announcement.id
        })


# ===== TEAMS & REGISTRATIONS =====

class TeamViewSet(viewsets.ModelViewSet):
    """Team management endpoints"""
    queryset = Team.objects.select_related('manager', 'coach', 'event').all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    filterset_fields = ['event', 'manager', 'coach']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_permissions(self):
        """Override permissions for different actions"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsCoach]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]


class RegistrationViewSet(viewsets.ModelViewSet):
    """Registration management endpoints"""
    queryset = Registration.objects.select_related('event', 'applicant', 'team').all()
    serializer_class = RegistrationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = RegistrationFilter
    search_fields = ['applicant__email', 'team__name']
    ordering_fields = ['submitted_at', 'status']
    ordering = ['-submitted_at']
    
    def get_permissions(self):
        """Override permissions for different actions"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['create']:
            permission_classes = [IsAuthenticated, IsAthlete]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, IsOrganizer]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a registration"""
        registration = self.get_object()
        reason = request.data.get('reason', '')
        
        registration.status = Registration.Status.APPROVED
        registration.decided_at = timezone.now()
        registration.reason = reason
        registration.save()
        
        return Response({'message': 'Registration approved successfully'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a registration"""
        registration = self.get_object()
        reason = request.data.get('reason', '')
        
        if not reason:
            return Response(
                {'error': 'Reason is required for rejection'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        registration.status = Registration.Status.REJECTED
        registration.decided_at = timezone.now()
        registration.reason = reason
        registration.save()
        
        return Response({'message': 'Registration rejected successfully'})


# ===== FIXTURES & RESULTS =====

class FixtureViewSet(viewsets.ModelViewSet):
    """Fixture management endpoints"""
    queryset = Fixture.objects.select_related('event', 'home', 'away', 'venue').all()
    serializer_class = FixtureSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = FixtureFilter
    ordering_fields = ['start_at', 'round', 'created_at']
    ordering = ['start_at']
    
    def get_permissions(self):
        """Override permissions for different actions"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsOrganizer]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['post'])
    def result(self, request, pk=None):
        """Record result for a fixture"""
        fixture = self.get_object()
        home_score = request.data.get('home_score')
        away_score = request.data.get('away_score')
        
        if home_score is None or away_score is None:
            return Response(
                {'error': 'home_score and away_score are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update result
        result, created = Result.objects.get_or_create(
            fixture=fixture,
            defaults={
                'score_home': home_score,
                'score_away': away_score,
                'verified_by': request.user,
                'verified_at': timezone.now()
            }
        )
        
        if not created:
            result.score_home = home_score
            result.score_away = away_score
            result.verified_by = request.user
            result.verified_at = timezone.now()
            result.save()
        
        # Update fixture status
        fixture.status = Fixture.Status.FINAL
        fixture.save()
        
        return Response({
            'message': 'Result recorded successfully',
            'result_id': result.id
        })
    
    def partial_update(self, request, pk=None):
        """Reschedule a fixture (PATCH /api/fixtures/:fixtureId)"""
        fixture = self.get_object()
        
        # Check permissions
        if not (request.user.is_staff or request.user.role == 'ADMIN' or 
                (request.user.role == 'ORGANIZER' and fixture.event.created_by == request.user)):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get update data
        start_at = request.data.get('start_at')
        venue_id = request.data.get('venue_id')
        
        if start_at:
            try:
                from django.utils.dateparse import parse_datetime
                start_at = parse_datetime(start_at)
                if not start_at:
                    return Response(
                        {'error': 'Invalid start_at format. Use ISO format.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except:
                return Response(
                    {'error': 'Invalid start_at format. Use ISO format.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update fixture
        if start_at:
            fixture.start_at = start_at
        if venue_id:
            fixture.venue_id = venue_id
        
        # Check for conflicts
        from fixtures.services import check_fixture_conflicts
        conflicts = check_fixture_conflicts(fixture)
        
        if conflicts:
            return Response({
                'error': 'Conflicts detected',
                'conflicts': conflicts
            }, status=status.HTTP_400_BAD_REQUEST)
        
        fixture.save()
        
        # Broadcast schedule update
        from events.realtime_service import realtime_service
        realtime_service.broadcast_fixture_schedule(fixture.event.id, fixture.id)
        
        return Response({
            'message': 'Fixture rescheduled successfully',
            'fixture': FixtureSerializer(fixture).data
        })


class ResultViewSet(viewsets.ModelViewSet):
    """Result management endpoints"""
    queryset = Result.objects.select_related('fixture', 'winner', 'verified_by').all()
    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ResultFilter
    ordering_fields = ['verified_at', 'finalized_at']
    ordering = ['-verified_at']
    
    def get_permissions(self):
        """Override permissions for different actions"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update']:
            permission_classes = [IsAuthenticated, IsOrganizer]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]


# ===== ANNOUNCEMENTS =====

class AnnouncementViewSet(viewsets.ModelViewSet):
    """Announcement management endpoints"""
    queryset = Announcement.objects.select_related('event', 'created_by').all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'message']
    filterset_fields = ['event', 'type', 'priority', 'created_by']
    ordering_fields = ['created_at', 'priority']
    ordering = ['-created_at']
    
    def get_permissions(self):
        """Override permissions for different actions"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsOrganizer]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """Set the created_by field to the current user"""
        serializer.save(created_by=self.request.user)


# ===== NOTIFICATIONS =====

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """Notification viewing endpoints"""
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'message']
    filterset_fields = ['kind', 'is_read']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter notifications for current user"""
        return Notification.objects.filter(user=self.request.user)


# ===== REPORTS =====

class ReportViewSet(viewsets.ViewSet):
    """Report generation endpoints"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    @action(detail=False, methods=['get'])
    def events(self, request):
        """Export events report as CSV"""
        from django.http import HttpResponse
        import csv
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="events.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Name', 'Sport', 'Status', 'Start Date', 'End Date', 'Venue', 'Created By'])
        
        events = Event.objects.select_related('venue', 'created_by').all()
        for event in events:
            writer.writerow([
                event.name,
                event.sport,
                event.status,
                event.start_datetime,
                event.end_datetime,
                event.venue.name if event.venue else '',
                event.created_by.email
            ])
        
        return response


# ===== ADDITIONAL ENDPOINTS =====

class EventRegistrationsView(APIView):
    """Get and create registrations for a specific event"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        registrations = Registration.objects.filter(event=event).select_related('applicant', 'team')
        serializer = RegistrationSerializer(registrations, many=True)
        return Response(serializer.data)
    
    def post(self, request, event_id):
        """Create a new registration for an event"""
        event = get_object_or_404(Event, id=event_id)
        
        # Add event to the request data
        data = request.data.copy()
        data['event'] = event_id
        
        # Use the registration create serializer
        from registrations.serializers import RegistrationCreateSerializer
        serializer = RegistrationCreateSerializer(data=data, context={'request': request})
        
        if serializer.is_valid():
            registration = serializer.save()
            return Response(
                RegistrationSerializer(registration).data, 
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventFixturesView(APIView):
    """Get fixtures for a specific event"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        
        # Apply role-based filtering
        fixtures = Fixture.objects.filter(event=event).select_related('home', 'away', 'venue')
        
        # Filter based on user role
        if not request.user.is_authenticated:
            # Public users can only see published fixtures
            fixtures = fixtures.filter(status=Fixture.Status.SCHEDULED)  # Assuming SCHEDULED means published
        elif request.user.is_staff or request.user.role == 'ADMIN':
            # Admin sees all fixtures
            pass
        elif request.user.role == 'ORGANIZER':
            # Organizer sees fixtures for their events + published fixtures
            if event.created_by != request.user:
                fixtures = fixtures.filter(status=Fixture.Status.SCHEDULED)
        elif request.user.role == 'COACH':
            # Coach sees fixtures for teams they coach + published fixtures
            from teams.models import Team
            team_ids = Team.objects.filter(coach=request.user, event=event).values_list('id', flat=True)
            fixtures = fixtures.filter(
                Q(home_id__in=team_ids) |
                Q(away_id__in=team_ids) |
                Q(status=Fixture.Status.SCHEDULED)
            ).distinct()
        elif request.user.role == 'ATHLETE':
            # Athlete sees fixtures for teams they're in + published fixtures
            from teams.models import TeamMember
            team_ids = TeamMember.objects.filter(athlete=request.user, team__event=event).values_list('team_id', flat=True)
            fixtures = fixtures.filter(
                Q(home_id__in=team_ids) |
                Q(away_id__in=team_ids) |
                Q(status=Fixture.Status.SCHEDULED)
            ).distinct()
        else:
            # Spectator sees only published fixtures
            fixtures = fixtures.filter(status=Fixture.Status.SCHEDULED)
        
        # Order by start time
        fixtures = fixtures.order_by('start_at', 'round')
        
        serializer = FixtureSerializer(fixtures, many=True)
        return Response({
            'event_id': event_id,
            'event_name': event.name,
            'fixtures_count': fixtures.count(),
            'fixtures': serializer.data
        })


class GenerateFixturesView(APIView):
    """Generate fixtures for an event"""
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        
        # Get mode parameter (rr for round robin, ko for knockout)
        mode = request.query_params.get('mode', 'rr')
        if mode not in ['rr', 'ko']:
            return Response(
                {'error': 'Mode must be either "rr" (round robin) or "ko" (knockout)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get approved teams for the event
        teams = Team.objects.filter(
            event=event,
            registrations__status=Registration.Status.APPROVED
        ).distinct()
        
        if teams.count() < 2:
            return Response(
                {'error': 'At least 2 teams are required to generate fixtures'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get team IDs
        team_ids = list(teams.values_list('id', flat=True))
        
        # Get start date from request or use event start date
        start_date = request.data.get('start_date')
        if start_date:
            try:
                from django.utils.dateparse import parse_datetime
                start_date = parse_datetime(start_date)
            except:
                return Response(
                    {'error': 'Invalid start_date format. Use ISO format.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            start_date = event.start_datetime or timezone.now() + timedelta(days=1)
        
        # Get venues from request
        venues = request.data.get('venues', [])
        
        try:
            # Generate fixtures based on mode
            from fixtures.services import generate_round_robin, generate_knockout
            
            if mode == 'rr':
                fixtures_data = generate_round_robin(team_ids, event_id, start_date, venues)
            else:  # ko
                fixtures_data = generate_knockout(team_ids, event_id, start_date, venues)
            
            # Create fixtures in database
            created_fixtures = []
            for fixture_data in fixtures_data:
                # Convert string dates to datetime
                start_at = fixture_data['start_at']
                if isinstance(start_at, str):
                    from django.utils.dateparse import parse_datetime
                    start_at = parse_datetime(start_at)
                
                fixture = Fixture.objects.create(
                    event=event,
                    round=fixture_data['round'],
                    phase=fixture_data['phase'],
                    home_id=fixture_data.get('home_team_id'),
                    away_id=fixture_data.get('away_team_id'),
                    venue_id=fixture_data.get('venue_id'),
                    start_at=start_at,
                    status=Fixture.Status.SCHEDULED
                )
                
                created_fixtures.append({
                    'id': fixture.id,
                    'round': fixture.round,
                    'phase': fixture.phase,
                    'home_team': fixture.home.name if fixture.home else 'TBD',
                    'away_team': fixture.away.name if fixture.away else 'TBD',
                    'venue': fixture.venue.name if fixture.venue else 'TBD',
                    'start_at': fixture.start_at.isoformat(),
                    'status': fixture.status
                })
            
            return Response({
                'message': f'Fixtures generated successfully using {mode} mode',
                'mode': mode,
                'teams_count': teams.count(),
                'fixtures_count': len(created_fixtures),
                'fixtures': created_fixtures
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate fixtures: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EventLeaderboardView(APIView):
    """Get leaderboard for an event"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        
        # Get leaderboard entries for the event
        leaderboard = LeaderboardEntry.objects.filter(
            event=event
        ).select_related('team').order_by('-points', '-goal_difference', '-goals_for')
        
        # Convert to proper format
        leaderboard_data = []
        for i, entry in enumerate(leaderboard):
            leaderboard_data.append({
                'position': i + 1,
                'team_id': entry.team.id,
                'team_name': entry.team.name,
                'points': entry.points,
                'played': entry.matches_played,
                'won': entry.wins,
                'drawn': entry.draws,
                'lost': entry.losses,
                'goals_for': entry.goals_for,
                'goals_against': entry.goals_against,
                'goal_difference': entry.goal_difference,
                'win_percentage': entry.wins / entry.matches_played * 100 if entry.matches_played > 0 else 0,
                'points_per_match': entry.points / entry.matches_played if entry.matches_played > 0 else 0
            })
        
        return Response({
            'event_id': event_id,
            'event_name': event.name,
            'leaderboard': leaderboard_data,
            'last_updated': timezone.now().isoformat()
        })


class EventAnnounceView(APIView):
    """Send announcement for an event"""
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        title = request.data.get('title') or request.data.get('subject')
        message = request.data.get('message') or request.data.get('body')
        audience = request.data.get('audience', 'ALL')
        
        if not title or not message:
            return Response(
                {'error': 'title and message are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate audience parameter
        valid_audiences = ['ALL', 'PARTICIPANTS', 'OFFICIALS']
        if audience not in valid_audiences:
            return Response(
                {'error': f'audience must be one of: {", ".join(valid_audiences)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Map audience to model fields
        is_public = audience in ['ALL', 'PARTICIPANTS']
        target_teams = None
        if audience == 'PARTICIPANTS':
            # Get all teams registered for this event
            target_teams = event.teams.all()
        elif audience == 'OFFICIALS':
            # For officials, we might want to target specific teams or make it non-public
            is_public = False
        
        announcement = Announcement.objects.create(
            event=event,
            title=title,
            message=message,
            is_public=is_public,
            created_by=request.user
        )
        
        # Set target teams if specified
        if target_teams:
            announcement.target_teams.set(target_teams)
        
        # Broadcast the announcement in real-time
        if announcement.is_active:
            announcement.broadcast()
        
        return Response({
            'message': 'Announcement sent successfully',
            'announcement_id': announcement.id,
            'audience': audience
        })


class EventAnnouncementsView(APIView):
    """Get announcements for an event"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        announcements = Announcement.objects.filter(event=event).select_related('created_by')
        serializer = AnnouncementSerializer(announcements, many=True)
        return Response(serializer.data)


class FixtureResultView(APIView):
    """Get or update result for a fixture"""
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def get(self, request, fixture_id):
        fixture = get_object_or_404(Fixture, id=fixture_id)
        try:
            result = fixture.result
            serializer = ResultSerializer(result)
            return Response(serializer.data)
        except Result.DoesNotExist:
            return Response({'result': None})
    
    def post(self, request, fixture_id):
        fixture = get_object_or_404(Fixture, id=fixture_id)
        home_score = request.data.get('home_score')
        away_score = request.data.get('away_score')
        
        if home_score is None or away_score is None:
            return Response(
                {'error': 'home_score and away_score are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate scores
        try:
            home_score = int(home_score)
            away_score = int(away_score)
            if home_score < 0 or away_score < 0:
                return Response(
                    {'error': 'Scores must be non-negative integers'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Scores must be valid integers'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if result already exists
        if hasattr(fixture, 'result'):
            return Response(
                {'error': 'Result already exists for this fixture'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create result
        result = Result.objects.create(
            fixture=fixture,
            home_score=home_score,
            away_score=away_score,
            verified_by=request.user,
            finalized_at=timezone.now()  # Auto-finalize for now
        )
        
        # Update fixture status
        fixture.status = Fixture.Status.FINAL
        fixture.save()
        
        # Recompute leaderboard
        from results.services import recompute_event_leaderboard
        recompute_event_leaderboard(fixture.event.id)
        
        # Broadcast result update
        from events.realtime_service import realtime_service
        result_data = {
            'fixture_id': fixture.id,
            'home_team_id': fixture.home.id if fixture.home else None,
            'away_team_id': fixture.away.id if fixture.away else None,
            'home_score': result.home_score,
            'away_score': result.away_score,
            'winner_id': result.winner.id if result.winner else None,
            'is_draw': result.is_draw
        }
        realtime_service.broadcast_result_update(fixture.event.id, result_data)
        realtime_service.broadcast_event_leaderboard(fixture.event.id)
        
        serializer = ResultSerializer(result)
        return Response({
            'message': 'Result recorded successfully',
            'result': serializer.data
        }, status=status.HTTP_201_CREATED)


class LockResultView(APIView):
    """Lock a result to prevent further changes"""
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def post(self, request, result_id):
        result = get_object_or_404(Result, id=result_id)
        result.finalized_at = timezone.now()
        result.finalized_by = request.user
        result.save()
        
        return Response({'message': 'Result locked successfully'})


class ApproveRegistrationView(APIView):
    """Approve a registration"""
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def post(self, request, registration_id):
        registration = get_object_or_404(Registration, id=registration_id)
        reason = request.data.get('reason', '')
        
        registration.status = Registration.Status.APPROVED
        registration.decided_at = timezone.now()
        registration.reason = reason
        registration.save()
        
        return Response({'message': 'Registration approved successfully'})


class RejectRegistrationView(APIView):
    """Reject a registration"""
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def post(self, request, registration_id):
        registration = get_object_or_404(Registration, id=registration_id)
        reason = request.data.get('reason', '')
        
        if not reason:
            return Response(
                {'error': 'Reason is required for rejection'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        registration.status = Registration.Status.REJECTED
        registration.decided_at = timezone.now()
        registration.reason = reason
        registration.save()
        
        return Response({'message': 'Registration rejected successfully'})


class CancelEventView(APIView):
    """Cancel an event"""
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        reason = request.data.get('reason', '')
        
        event.status = Event.Status.CANCELLED
        event.save()
        
        return Response({'message': 'Event cancelled successfully'})


# ===== PUBLIC ENDPOINTS =====

class PublicEventListView(APIView):
    """Public event listing"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        events = Event.objects.filter(
            visibility='PUBLIC',
            status=Event.Status.UPCOMING
        ).select_related('venue').order_by('start_datetime')
        
        # Apply filters
        sport = request.query_params.get('sport')
        if sport:
            events = events.filter(sport__icontains=sport)
        
        venue = request.query_params.get('venue')
        if venue:
            events = events.filter(venue__name__icontains=venue)
        
        search = request.query_params.get('search')
        if search:
            events = events.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search)
            )
        
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)


class PublicEventDetailView(APIView):
    """Public event detail"""
    permission_classes = [AllowAny]
    
    def get(self, request, event_id):
        event = get_object_or_404(
            Event, 
            id=event_id, 
            visibility='PUBLIC'
        )
        serializer = EventSerializer(event)
        return Response(serializer.data)


class PublicEventFixturesView(APIView):
    """Public event fixtures"""
    permission_classes = [AllowAny]
    
    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id, visibility='PUBLIC')
        fixtures = Fixture.objects.filter(event=event).select_related('home', 'away', 'venue')
        serializer = FixtureSerializer(fixtures, many=True)
        return Response(serializer.data)


class PublicEventResultsView(APIView):
    """Public event results"""
    permission_classes = [AllowAny]
    
    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id, visibility='PUBLIC')
        fixtures = Fixture.objects.filter(
            event=event,
            result__isnull=False
        ).select_related('result', 'home', 'away')
        
        results = [fixture.result for fixture in fixtures]
        serializer = ResultSerializer(results, many=True)
        return Response(serializer.data)


class PublicEventLeaderboardView(APIView):
    """Public event leaderboard"""
    permission_classes = [AllowAny]
    
    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id, visibility='PUBLIC')
        leaderboard = LeaderboardEntry.objects.filter(
            event=event
        ).select_related('team').order_by('-pts', '-gd', '-gf')
        
        serializer = ResultSerializer(leaderboard, many=True)
        return Response({'leaderboard': serializer.data})


class PublicStatsView(APIView):
    """Public statistics"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        from django.contrib.auth import get_user_model
        from teams.models import Team
        from venues.models import Venue
        from django.utils import timezone
        
        User = get_user_model()
        now = timezone.now()
        
        # Count public upcoming events
        events_count = Event.objects.filter(
            visibility='PUBLIC',
            status=Event.Status.UPCOMING
        ).count()
        
        # Count total participants (users with athlete role)
        participants_count = User.objects.filter(
            role='ATHLETE',
            is_active=True
        ).count()
        
        # Count active teams
        teams_count = Team.objects.filter(
            is_active=True
        ).count()
        
        # Count all venues
        venues_count = Venue.objects.count()
        
        stats = {
            'events': events_count,
            'participants': participants_count,
            'teams': teams_count,
            'venues': venues_count,
            'last_updated': now.isoformat()
        }
        
        return Response(stats)


# ===== AUTHENTICATION VIEWS =====

class LoginView(APIView):
    """JWT Login endpoint that accepts email/username and password"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Login with email/username and password"""
        email_or_username = request.data.get('email') or request.data.get('username')
        password = request.data.get('password')
        
        if not email_or_username or not password:
            return Response(
                {'detail': 'Email/username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to authenticate with email first, then username
        user = None
        try:
            # Try email authentication
            user = User.objects.get(email=email_or_username)
            if not user.check_password(password):
                user = None
        except User.DoesNotExist:
            try:
                # Try username authentication
                user = User.objects.get(username=email_or_username)
                if not user.check_password(password):
                    user = None
            except User.DoesNotExist:
                pass
        
        if user is None or not user.is_active:
            return Response(
                {'detail': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate JWT tokens
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        return Response({
            'access': access_token,
            'refresh': refresh_token,
            'user': UserSerializer(user).data
        })


class RegisterView(APIView):
    """JWT Registration endpoint"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Register new user"""
        from accounts.serializers import UserRegistrationSerializer
        
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens for immediate login
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            return Response({
                'access': access_token,
                'refresh': refresh_token,
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    """Get current user profile - JWT required"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def get(self, request):
        """Get current user profile"""
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'detail': 'Authentication failed'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    
    def patch(self, request):
        """Update current user profile (partial update)."""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Media API Views
class MediaUploadView(APIView):
    """Upload media files"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = MediaUploadSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            media = serializer.save()
            return Response(MediaUploadSerializer(media, context={'request': request}).data, 
                          status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MediaModerationView(APIView):
    """Moderate media (approve/reject) - admin/organizer only"""
    permission_classes = [IsAdmin | IsOrganizer]
    
    def patch(self, request, pk):
        try:
            media = Media.objects.get(pk=pk)
        except Media.DoesNotExist:
            return Response({'error': 'Media not found'}, status=status.HTTP_404_NOT_FOUND)
        
        status_value = request.data.get('status')
        if status_value not in [Media.Status.APPROVED, Media.Status.REJECTED]:
            return Response(
                {'error': 'Invalid status. Must be APPROVED or REJECTED'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        media.status = status_value
        media.save()
        
        serializer = MediaModerationSerializer(media, context={'request': request})
        return Response(serializer.data)


class PublicMediaListView(APIView):
    """Public media listing (only approved media)"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        queryset = Media.objects.filter(is_approved=True).select_related('event', 'uploaded_by')
        
        # Filter by event if specified
        event_id = request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        # Filter by type if specified
        media_type = request.query_params.get('type')
        if media_type:
            queryset = queryset.filter(media_type=media_type)
        
        # Order by most recent first
        queryset = queryset.order_by('-created_at')
        
        serializer = PublicMediaSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)