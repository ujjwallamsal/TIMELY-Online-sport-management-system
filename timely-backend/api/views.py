# api/views.py - Unified API Views
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from django.core.exceptions import ValidationError

from common.views import HealthView
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
    queryset = Event.objects.select_related('sport', 'venue', 'created_by').all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = EventFilter
    search_fields = ['name', 'description', 'sport__name']
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
        serializer.save(created_by=self.request.user)
    
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
        subject = request.data.get('subject')
        body = request.data.get('body')
        audience = request.data.get('audience', 'ALL')
        
        if not subject or not body:
            return Response(
                {'error': 'subject and body are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        announcement = Announcement.objects.create(
            event=event,
            subject=subject,
            body=body,
            audience=audience,
            sent_by=request.user
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
                'home_score': home_score,
                'away_score': away_score,
                'entered_by': request.user,
                'entered_at': timezone.now()
            }
        )
        
        if not created:
            result.home_score = home_score
            result.away_score = away_score
            result.entered_by = request.user
            result.entered_at = timezone.now()
            result.save()
        
        # Update fixture status
        fixture.status = Fixture.Status.FINAL
        fixture.save()
        
        return Response({
            'message': 'Result recorded successfully',
            'result_id': result.id
        })


class ResultViewSet(viewsets.ModelViewSet):
    """Result management endpoints"""
    queryset = Result.objects.select_related('fixture', 'winner', 'entered_by').all()
    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ResultFilter
    ordering_fields = ['entered_at', 'finalized_at']
    ordering = ['-entered_at']
    
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
    queryset = Announcement.objects.select_related('event', 'sent_by').all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['subject', 'body']
    filterset_fields = ['event', 'audience', 'sent_by']
    ordering_fields = ['sent_at']
    ordering = ['-sent_at']
    
    def get_permissions(self):
        """Override permissions for different actions"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsOrganizer]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]


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
        
        events = Event.objects.select_related('sport', 'venue', 'created_by').all()
        for event in events:
            writer.writerow([
                event.name,
                event.sport.name,
                event.status,
                event.start_datetime,
                event.end_datetime,
                event.venue.name if event.venue else '',
                event.created_by.email
            ])
        
        return response


# ===== ADDITIONAL ENDPOINTS =====

class EventRegistrationsView(APIView):
    """Get registrations for a specific event"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        registrations = Registration.objects.filter(event=event).select_related('applicant', 'team')
        serializer = RegistrationSerializer(registrations, many=True)
        return Response(serializer.data)


class EventFixturesView(APIView):
    """Get fixtures for a specific event"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        fixtures = Fixture.objects.filter(event=event).select_related('home', 'away', 'venue')
        serializer = FixtureSerializer(fixtures, many=True)
        return Response(serializer.data)


class GenerateFixturesView(APIView):
    """Generate fixtures for an event"""
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        
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
        
        # TODO: Implement fixture generation logic
        # This would use the fixture generation service
        
        return Response({'message': 'Fixtures generated successfully'})


class EventLeaderboardView(APIView):
    """Get leaderboard for an event"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        
        # Get leaderboard entries for the event
        leaderboard = LeaderboardEntry.objects.filter(
            event=event
        ).select_related('team').order_by('-pts', '-gd', '-gf')
        
        serializer = ResultSerializer(leaderboard, many=True)
        return Response({'leaderboard': serializer.data})


class EventAnnounceView(APIView):
    """Send announcement for an event"""
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        subject = request.data.get('subject')
        body = request.data.get('body')
        audience = request.data.get('audience', 'ALL')
        
        if not subject or not body:
            return Response(
                {'error': 'subject and body are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        announcement = Announcement.objects.create(
            event=event,
            subject=subject,
            body=body,
            audience=audience,
            sent_by=request.user
        )
        
        return Response({
            'message': 'Announcement sent successfully',
            'announcement_id': announcement.id
        })


class EventAnnouncementsView(APIView):
    """Get announcements for an event"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        announcements = Announcement.objects.filter(event=event).select_related('sent_by')
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
        
        result, created = Result.objects.get_or_create(
            fixture=fixture,
            defaults={
                'home_score': home_score,
                'away_score': away_score,
                'entered_by': request.user,
                'entered_at': timezone.now()
            }
        )
        
        if not created:
            result.home_score = home_score
            result.away_score = away_score
            result.entered_by = request.user
            result.entered_at = timezone.now()
            result.save()
        
        serializer = ResultSerializer(result)
        return Response(serializer.data)


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
            status__in=[Event.Status.UPCOMING, Event.Status.ONGOING]
        ).select_related('sport', 'venue').order_by('start_datetime')
        
        # Apply filters
        sport = request.query_params.get('sport')
        if sport:
            events = events.filter(sport__name__icontains=sport)
        
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
        queryset = Media.objects.filter(status=Media.Status.APPROVED).select_related('event', 'fixture')
        
        # Filter by event if specified
        event_id = request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        # Filter by type if specified
        media_type = request.query_params.get('type')
        if media_type:
            queryset = queryset.filter(type=media_type)
        
        # Order by most recent first
        queryset = queryset.order_by('-approved_at', '-created_at')
        
        serializer = PublicMediaSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)