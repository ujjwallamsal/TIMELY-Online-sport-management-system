# results/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from django.db.models import Q, Prefetch

from .models import Result, LeaderboardEntry
from .serializers import (
    ResultSerializer, ResultCreateSerializer, ResultActionSerializer,
    LeaderboardEntrySerializer, LeaderboardSummarySerializer, RecentResultsSerializer, 
    FixtureResultSerializer, EventResultsSummarySerializer
)
from .services.compute import (
    recompute_event_standings, get_leaderboard_summary
)
from fixtures.models import Fixture
from events.models import Event
from teams.models import Team
from accounts.permissions import (
    IsOrganizerOfEvent, IsCoachOfTeam, IsAthleteSelf, 
    IsSpectatorReadOnly, IsAdmin
)
from accounts.audit_mixin import AuditLogMixin
from realtime.services import (
    broadcast_result_update, broadcast_leaderboard_update
)


class ResultViewSet(viewsets.ModelViewSet):
    """ViewSet for managing results"""
    
    queryset = Result.objects.select_related(
        'fixture__event', 'fixture__home', 'fixture__away',
        'winner', 'verified_by'
    ).all()
    serializer_class = ResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ResultCreateSerializer
        return ResultSerializer
    
    def get_queryset(self):
        """Filter results based on user role and permissions"""
        queryset = super().get_queryset()
        
        # Apply role-based filtering
        if not self.request.user.is_authenticated:
            # Public users can only see finalized results
            queryset = queryset.filter(finalized_at__isnull=False)
        elif self.request.user.is_staff or self.request.user.role == 'ADMIN':
            # Admin sees all results
            pass
        elif self.request.user.role == 'ORGANIZER':
            # Organizer sees results for their events + finalized results
            queryset = queryset.filter(
                Q(fixture__event__created_by=self.request.user) |
                Q(finalized_at__isnull=False)
            )
        elif self.request.user.role == 'COACH':
            # Coach sees results for teams they coach + finalized results
            from teams.models import Team
            team_ids = Team.objects.filter(coach=self.request.user).values_list('id', flat=True)
            queryset = queryset.filter(
                Q(fixture__home_id__in=team_ids) |
                Q(fixture__away_id__in=team_ids) |
                Q(finalized_at__isnull=False)
            ).distinct()
        elif self.request.user.role == 'ATHLETE':
            # Athlete sees results for teams they're in + finalized results
            from teams.models import TeamMember
            team_ids = TeamMember.objects.filter(athlete=self.request.user).values_list('team_id', flat=True)
            queryset = queryset.filter(
                Q(fixture__home_id__in=team_ids) |
                Q(fixture__away_id__in=team_ids) |
                Q(finalized_at__isnull=False)
            ).distinct()
        else:
            # Spectator sees only finalized results
            queryset = queryset.filter(finalized_at__isnull=False)
        
        # Filter by event if specified
        event_id = self.request.query_params.get('event_id')
        if event_id:
            queryset = queryset.filter(fixture__event_id=event_id)
        
        # Filter by finalized status
        finalized = self.request.query_params.get('finalized')
        if finalized is not None:
            if finalized.lower() == 'true':
                queryset = queryset.filter(finalized_at__isnull=False)
            else:
                queryset = queryset.filter(finalized_at__isnull=True)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create result with proper permissions"""
        fixture_id = self.request.data.get('fixture_id')
        fixture = get_object_or_404(Fixture, id=fixture_id)
        
        # Check permissions
        if not self._can_manage_result(fixture.event):
            self.permission_denied(self.request)
        
        result = serializer.save(fixture=fixture)
        
        # Broadcast result update
        broadcast_result_update(
            fixture.event.id, 
            result, 
            f"New result recorded: {fixture.home.name if fixture.home else 'TBD'} {result.home_score}-{result.away_score} {fixture.away.name if fixture.away else 'TBD'}"
        )
    
    def _can_manage_result(self, event):
        """Check if user can manage results for this event"""
        if not self.request.user.is_authenticated:
            return False
        
        # Admin can manage all results
        if self.request.user.is_staff or self.request.user.role == 'ADMIN':
            return True
        
        # Organizer can manage results for their events
        if self.request.user.role == 'ORGANIZER' and event.created_by == self.request.user:
            return True
        
        return False
    
    @action(detail=True, methods=['post'], url_path='finalize')
    def finalize(self, request, pk=None):
        """Finalize a result"""
        result = self.get_object()
        
        if not self._can_manage_result(result.fixture.event):
            return Response(
                {'detail': 'You do not have permission to finalize this result.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if result.is_finalized:
            return Response(
                {'detail': 'Result is already finalized.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result.finalize(user=request.user)
        
        # Recompute standings
        recompute_event_standings(result.fixture.event.id)
        
        # Broadcast result and leaderboard updates
        broadcast_result_update(
            result.fixture.event.id, 
            result, 
            f"Result finalized: {result.fixture.home.name if result.fixture.home else 'TBD'} {result.home_score}-{result.away_score} {result.fixture.away.name if result.fixture.away else 'TBD'}"
        )
        broadcast_leaderboard_update(
            result.fixture.event.id, 
            "Leaderboard updated after result finalization"
        )
        
        serializer = self.get_serializer(result)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='verify')
    def verify(self, request, pk=None):
        """Verify a result"""
        result = self.get_object()
        
        if not self._can_manage_result(result.fixture.event):
            return Response(
                {'detail': 'You do not have permission to verify this result.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if result.is_finalized:
            return Response(
                {'detail': 'Result is already finalized.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result.finalize(user=request.user)
        
        serializer = self.get_serializer(result)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='lock')
    def lock(self, request, pk=None):
        """Lock a result"""
        result = self.get_object()
        
        if not self._can_manage_result(result.fixture.event):
            return Response(
                {'detail': 'You do not have permission to lock this result.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if result.is_finalized:
            return Response(
                {'detail': 'Result is already locked.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result.lock()
        
        serializer = self.get_serializer(result)
        return Response(serializer.data)


class FixtureResultView(APIView):
    """View for recording results for specific fixtures"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, fixture_id):
        """Record a result for a fixture"""
        fixture = get_object_or_404(Fixture, id=fixture_id)
        
        # Check permissions
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Admin can manage all results
        if not (request.user.is_staff or request.user.role == 'ADMIN'):
            # Organizer can manage results for their events
            if not (request.user.role == 'ORGANIZER' and fixture.event.created_by == request.user):
                return Response(
                    {'detail': 'You do not have permission to record results for this fixture.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Check if result already exists
        if hasattr(fixture, 'result'):
            return Response(
                {'detail': 'Result already exists for this fixture.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ResultCreateSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save(fixture=fixture)
            
            # Recompute standings
            recompute_event_standings(fixture.event.id)
            
            # Broadcast real-time update
            broadcast_result_update(
                fixture.event.id, 
                result, 
                f"New result recorded: {fixture.home.name if fixture.home else 'TBD'} {result.home_score}-{result.away_score} {fixture.away.name if fixture.away else 'TBD'}"
            )
            broadcast_leaderboard_update(
                fixture.event.id, 
                "Leaderboard updated with new result"
            )
            
            response_serializer = ResultSerializer(result)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventResultsView(APIView):
    """View for event-specific results and leaderboard"""
    
    permission_classes = [permissions.AllowAny]  # Public access for published results
    
    def get(self, request, event_id):
        """Get results and leaderboard for an event"""
        event = get_object_or_404(Event, id=event_id)
        
        # Get recent finalized results
        recent_results = Result.objects.filter(
            fixture__event=event,
            finalized_at__isnull=False
        ).select_related(
            'fixture__home', 'fixture__away', 'winner'
        ).order_by('-created_at')[:10]
        
        # Get leaderboard
        leaderboard = LeaderboardEntry.objects.filter(
            event=event
        ).select_related('team').order_by('position')
        
        # Get event summary
        total_fixtures = Fixture.objects.filter(event=event).count()
        finalized_results = Result.objects.filter(
            fixture__event=event,
            finalized_at__isnull=False
        ).count()
        
        data = {
            'event_id': event.id,
            'event_name': event.name,
            'total_fixtures': total_fixtures,
            'finalized_results': finalized_results,
            'pending_results': total_fixtures - finalized_results,
            'leaderboard': LeaderboardEntrySerializer(leaderboard, many=True).data,
            'recent_results': ResultSerializer(recent_results, many=True).data,
        }
        
        serializer = EventResultsSummarySerializer(data)
        return Response(serializer.data)


class EventRecentResultsView(APIView):
    """View for recent results of an event"""
    
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, event_id):
        """Get recent results for an event"""
        event = get_object_or_404(Event, id=event_id)
        
        # Get query parameters
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))
        
        # Get finalized results
        results = Result.objects.filter(
            fixture__event=event,
            finalized_at__isnull=False
        ).select_related(
            'fixture__home', 'fixture__away', 'winner'
        ).order_by('-created_at')[offset:offset + limit]
        
        total_count = Result.objects.filter(
            fixture__event=event,
            finalized_at__isnull=False
        ).count()
        
        data = {
            'results': ResultSerializer(results, many=True).data,
            'total_count': total_count,
            'has_more': offset + limit < total_count,
        }
        
        serializer = RecentResultsSerializer(data)
        return Response(serializer.data)


class EventLeaderboardView(APIView):
    """View for event leaderboard"""
    
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, event_id):
        """Get leaderboard for an event"""
        event = get_object_or_404(Event, id=event_id)
        
        # Get leaderboard
        leaderboard = LeaderboardEntry.objects.filter(
            event=event
        ).select_related('team').order_by('position')
        
        # Get summary
        summary = get_leaderboard_summary(event_id)
        
        return Response(summary)


class LeaderboardViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for leaderboard entries"""
    
    queryset = LeaderboardEntry.objects.select_related('event', 'team').all()
    serializer_class = LeaderboardEntrySerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Filter leaderboard by event"""
        queryset = super().get_queryset()
        
        event_id = self.request.query_params.get('event_id')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        return queryset.order_by('event', 'position')


class RecomputeStandingsView(APIView):
    """View for recomputing standings"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, event_id):
        """Recompute standings for an event"""
        event = get_object_or_404(Event, id=event_id)
        
        # Check permissions
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Admin can manage all results
        if not (request.user.is_staff or request.user.role == 'ADMIN'):
            # Organizer can manage results for their events
            if not (request.user.role == 'ORGANIZER' and event.created_by == request.user):
                return Response(
                    {'detail': 'You do not have permission to recompute standings.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Recompute standings
        leaderboard = recompute_event_standings(event_id)
        
        # Broadcast leaderboard update
        broadcast_leaderboard_update(event_id, "Standings recomputed successfully")
        
        serializer = LeaderboardEntrySerializer(leaderboard, many=True)
        return Response({
            'message': 'Standings recomputed successfully.',
            'leaderboard': serializer.data
        })