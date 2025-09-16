# api/v1/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from django.http import HttpResponse
import csv
import io

from accounts.models import User
from events.models import Event
from venues.models import Venue
from registrations.models import Registration
from fixtures.models import Fixture
from results.models import Result, LeaderboardEntry
from notifications.models import Notification

from .serializers import (
    UserSerializer, EventSerializer, VenueSerializer, RegistrationSerializer,
    FixtureSerializer, ResultSerializer, LeaderboardEntrySerializer,
    AnnouncementSerializer
)
from .permissions import IsAdmin, IsOrganizer, IsCoach, IsAthlete, IsSpectator
from .filters import EventFilter, RegistrationFilter, FixtureFilter, ResultFilter


class AuthViewSet(viewsets.ViewSet):
    """Authentication endpoints"""
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        # Implementation for login
        pass
    
    @action(detail=False, methods=['post'])
    def refresh(self, request):
        # Implementation for token refresh
        pass
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        # Implementation for registration
        pass


class UserViewSet(viewsets.ModelViewSet):
    """User management endpoints"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name']
    filterset_fields = ['role', 'is_verified']
    ordering_fields = ['created_at', 'last_login']
    ordering = ['-created_at']
    
    def get_permissions(self):
        """Override permissions for different actions"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, IsAdmin]
        else:
            permission_classes = [IsAuthenticated, IsAdmin]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'])
    def update_me(self, request):
        """Update current user profile"""
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventViewSet(viewsets.ModelViewSet):
    """Event management endpoints"""
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = EventFilter
    search_fields = ['name', 'sport', 'description']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-start_date']
    
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
    def cancel(self, request, pk=None):
        """Cancel an event"""
        event = self.get_object()
        event.lifecycle_status = Event.Status.CANCELLED
        event.save()
        return Response({'status': 'Event cancelled'})


class VenueViewSet(viewsets.ModelViewSet):
    """Venue management endpoints"""
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'address']
    filterset_fields = ['capacity']
    ordering_fields = ['name', 'capacity']
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


class RegistrationViewSet(viewsets.ModelViewSet):
    """Registration management endpoints"""
    queryset = Registration.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = RegistrationFilter
    search_fields = ['user__email', 'team_name']
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


class FixtureViewSet(viewsets.ModelViewSet):
    """Fixture management endpoints"""
    queryset = Fixture.objects.all()
    serializer_class = FixtureSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = FixtureFilter
    ordering_fields = ['starts_at', 'round_no']
    ordering = ['starts_at']
    
    def get_permissions(self):
        """Override permissions for different actions"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsOrganizer]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]


class ResultViewSet(viewsets.ModelViewSet):
    """Result management endpoints"""
    queryset = Result.objects.all()
    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ResultFilter
    ordering_fields = ['created_at', 'finalized_at']
    ordering = ['-created_at']
    
    def get_permissions(self):
        """Override permissions for different actions"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update']:
            permission_classes = [IsAuthenticated, IsOrganizer]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]


class AnnouncementViewSet(viewsets.ModelViewSet):
    """Announcement management endpoints"""
    queryset = Notification.objects.filter(kind='announcement')
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated, IsOrganizer]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'body']
    ordering_fields = ['created_at']
    ordering = ['-created_at']


class ReportViewSet(viewsets.ViewSet):
    """Report generation endpoints"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    @action(detail=False, methods=['get'])
    def events(self, request):
        """Export events report as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="events.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Name', 'Sport', 'Status', 'Start Date', 'End Date', 'Venue', 'Created By'])
        
        events = Event.objects.all()
        for event in events:
            writer.writerow([
                event.name,
                event.sport,
                event.lifecycle_status,
                event.start_date,
                event.end_date,
                event.venue.name if event.venue else '',
                event.created_by.email
            ])
        
        return response
    
    @action(detail=False, methods=['get'])
    def registrations(self, request):
        """Export registrations report as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="registrations.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Applicant', 'Type', 'Event', 'Submitted At', 'Status', 'Docs'])
        
        registrations = Registration.objects.all()
        for reg in registrations:
            writer.writerow([
                reg.user.email,
                reg.type,
                reg.event.name,
                reg.submitted_at,
                reg.status,
                reg.documents.count()
            ])
        
        return response
    
    @action(detail=False, methods=['get'])
    def fixtures(self, request):
        """Export fixtures report as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="fixtures.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Event', 'Round', 'Home', 'Away', 'Venue', 'Start', 'Status'])
        
        fixtures = Fixture.objects.all()
        for fixture in fixtures:
            writer.writerow([
                fixture.event.name,
                fixture.round_no,
                fixture.home_team.name if fixture.home_team else '',
                fixture.away_team.name if fixture.away_team else '',
                fixture.venue.name if fixture.venue else '',
                fixture.starts_at,
                fixture.status
            ])
        
        return response
    
    @action(detail=False, methods=['get'])
    def results(self, request):
        """Export results report as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="results.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Fixture', 'Home Score', 'Away Score', 'Winner', 'Entered By', 'Finalized At'])
        
        results = Result.objects.all()
        for result in results:
            writer.writerow([
                f"{result.fixture.event.name} - R{result.fixture.round_no}",
                result.score_home,
                result.score_away,
                result.winner.name if result.winner else 'Draw',
                result.verified_by.email if result.verified_by else '',
                result.verified_at
            ])
        
        return response


# Additional view classes for specific endpoints
class EventRegistrationsView(APIView):
    """Get registrations for a specific event"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        registrations = Registration.objects.filter(event_id=event_id)
        serializer = RegistrationSerializer(registrations, many=True)
        return Response(serializer.data)


class EventFixturesView(APIView):
    """Get fixtures for a specific event"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        fixtures = Fixture.objects.filter(event_id=event_id)
        serializer = FixtureSerializer(fixtures, many=True)
        return Response(serializer.data)


class GenerateFixturesView(APIView):
    """Generate fixtures for an event"""
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def post(self, request, event_id):
        # Implementation for fixture generation
        return Response({'status': 'Fixtures generated'})


class EventLeaderboardView(APIView):
    """Get leaderboard for an event"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        leaderboard = LeaderboardEntry.objects.filter(event_id=event_id)
        serializer = LeaderboardEntrySerializer(leaderboard, many=True)
        return Response(serializer.data)


class EventAnnounceView(APIView):
    """Send announcement for an event"""
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def post(self, request, event_id):
        # Implementation for sending announcements
        return Response({'status': 'Announcement sent'})


class EventAnnouncementsView(APIView):
    """Get announcements for an event"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        announcements = Notification.objects.filter(
            kind='announcement',
            # Add event filtering logic here
        )
        serializer = AnnouncementSerializer(announcements, many=True)
        return Response(serializer.data)


class FixtureResultView(APIView):
    """Enter result for a fixture"""
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def post(self, request, fixture_id):
        # Implementation for entering results
        return Response({'status': 'Result entered'})


class LockResultView(APIView):
    """Lock a result"""
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def post(self, request, result_id):
        # Implementation for locking results
        return Response({'status': 'Result locked'})


class ApproveRegistrationView(APIView):
    """Approve a registration"""
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def patch(self, request, registration_id):
        # Implementation for approving registrations
        return Response({'status': 'Registration approved'})


class RejectRegistrationView(APIView):
    """Reject a registration"""
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def patch(self, request, registration_id):
        # Implementation for rejecting registrations
        return Response({'status': 'Registration rejected'})


class CancelEventView(APIView):
    """Cancel an event"""
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def post(self, request, event_id):
        # Implementation for cancelling events
        return Response({'status': 'Event cancelled'})
