# results/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from django.db.models import Q, Prefetch

from .models import Result, LeaderboardEntry, AthleteStat
from .serializers import (
    ResultSerializer, ResultCreateSerializer, ResultActionSerializer,
    LeaderboardEntrySerializer, AthleteStatSerializer, AthleteStatCreateSerializer,
    LeaderboardSummarySerializer, RecentResultsSerializer, FixtureResultSerializer,
    EventResultsSummarySerializer
)
from .services.compute import (
    recompute_event_standings, recompute_athlete_rankings, get_leaderboard_summary
)
from fixtures.models import Fixture
from events.models import Event
from teams.models import Team
from accounts.permissions import IsOrganizer, CanManageResults


class ResultViewSet(viewsets.ModelViewSet):
    """ViewSet for managing results"""
    
    queryset = Result.objects.select_related(
        'fixture__event', 'fixture__home_team', 'fixture__away_team',
        'winner', 'verified_by'
    ).all()
    serializer_class = ResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ResultCreateSerializer
        return ResultSerializer
    
    def get_queryset(self):
        """Filter results based on user permissions"""
        queryset = super().get_queryset()
        
        # Filter by event if specified
        event_id = self.request.query_params.get('event_id')
        if event_id:
            queryset = queryset.filter(fixture__event_id=event_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by published status
        published = self.request.query_params.get('published')
        if published is not None:
            queryset = queryset.filter(published=published.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        """Create result with proper permissions"""
        fixture_id = self.request.data.get('fixture_id')
        fixture = get_object_or_404(Fixture, id=fixture_id)
        
        # Check permissions
        if not self._can_manage_result(fixture.event):
            self.permission_denied(self.request)
        
        serializer.save(fixture=fixture)
    
    def _can_manage_result(self, event):
        """Check if user can manage results for this event"""
        return (
            IsOrganizer().has_permission(self.request, self) or
            CanManageResults().has_permission(self.request, self)
        )
    
    @action(detail=True, methods=['post'], url_path='finalize')
    def finalize(self, request, pk=None):
        """Finalize a result"""
        result = self.get_object()
        
        if not self._can_manage_result(result.fixture.event):
            return Response(
                {'detail': 'You do not have permission to finalize this result.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if result.status == result.Status.FINAL:
            return Response(
                {'detail': 'Result is already finalized.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result.finalize(user=request.user)
        
        # Recompute standings
        recompute_event_standings(result.fixture.event.id)
        
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
        
        if result.is_verified:
            return Response(
                {'detail': 'Result is already verified.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result.finalize(user=request.user)
        
        serializer = self.get_serializer(result)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        """Publish a result"""
        result = self.get_object()
        
        if not self._can_manage_result(result.fixture.event):
            return Response(
                {'detail': 'You do not have permission to publish this result.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not result.can_be_published:
            return Response(
                {'detail': 'Result cannot be published (must be final and verified).'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result.publish()
        
        serializer = self.get_serializer(result)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='unpublish')
    def unpublish(self, request, pk=None):
        """Unpublish a result"""
        result = self.get_object()
        
        if not self._can_manage_result(result.fixture.event):
            return Response(
                {'detail': 'You do not have permission to unpublish this result.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        result.unpublish()
        
        serializer = self.get_serializer(result)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='invalidate')
    def invalidate(self, request, pk=None):
        """Invalidate a result"""
        result = self.get_object()
        
        if not self._can_manage_result(result.fixture.event):
            return Response(
                {'detail': 'You do not have permission to invalidate this result.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        result.invalidate()
        
        # Recompute standings
        recompute_event_standings(result.fixture.event.id)
        
        serializer = self.get_serializer(result)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='provisional')
    def provisional(self, request, pk=None):
        """Create provisional result"""
        result = self.get_object()
        
        if not self._can_manage_result(result.fixture.event):
            return Response(
                {'detail': 'You do not have permission to create provisional results.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update result with provisional data
        serializer = ResultActionSerializer(data=request.data)
        if serializer.is_valid():
            result.score_home = serializer.validated_data.get('score_home', result.score_home)
            result.score_away = serializer.validated_data.get('score_away', result.score_away)
            result.notes = serializer.validated_data.get('notes', result.notes)
            result.status = Result.Status.PROVISIONAL
            result.save()
            
            serializer = self.get_serializer(result)
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FixtureResultView(APIView):
    """View for recording results for specific fixtures"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, fixture_id):
        """Record a result for a fixture"""
        fixture = get_object_or_404(Fixture, id=fixture_id)
        
        # Check permissions
        if not (
            IsOrganizer().has_permission(request, self) or
            CanManageResults().has_permission(request, self)
        ):
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
            
            response_serializer = ResultSerializer(result)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventResultsView(APIView):
    """View for event-specific results and leaderboard"""
    
    permission_classes = [permissions.AllowAny]  # Public access for published results
    
    def get(self, request, event_id):
        """Get results and leaderboard for an event"""
        event = get_object_or_404(Event, id=event_id)
        
        # Get recent published results
        recent_results = Result.objects.filter(
            fixture__event=event,
            published=True
        ).select_related(
            'fixture__home_team', 'fixture__away_team', 'winner'
        ).order_by('-created_at')[:10]
        
        # Get leaderboard
        leaderboard = LeaderboardEntry.objects.filter(
            event=event
        ).select_related('team').order_by('position')
        
        # Get event summary
        total_fixtures = Fixture.objects.filter(event=event).count()
        completed_fixtures = Result.objects.filter(
            fixture__event=event,
            status=Result.Status.FINAL
        ).count()
        published_results = Result.objects.filter(
            fixture__event=event,
            published=True
        ).count()
        
        data = {
            'event_id': event.id,
            'event_name': event.name,
            'total_fixtures': total_fixtures,
            'completed_fixtures': completed_fixtures,
            'published_results': published_results,
            'pending_results': completed_fixtures - published_results,
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
        
        # Get published results
        results = Result.objects.filter(
            fixture__event=event,
            published=True
        ).select_related(
            'fixture__home_team', 'fixture__away_team', 'winner'
        ).order_by('-created_at')[offset:offset + limit]
        
        total_count = Result.objects.filter(
            fixture__event=event,
            published=True
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


class AthleteStatViewSet(viewsets.ModelViewSet):
    """ViewSet for athlete statistics"""
    
    queryset = AthleteStat.objects.select_related('event', 'athlete', 'verified_by').all()
    serializer_class = AthleteStatSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AthleteStatCreateSerializer
        return AthleteStatSerializer
    
    def get_queryset(self):
        """Filter athlete stats by event"""
        queryset = super().get_queryset()
        
        event_id = self.request.query_params.get('event_id')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        return queryset.order_by('event', 'position')
    
    def perform_create(self, serializer):
        """Create athlete stat with proper permissions"""
        event_id = self.request.data.get('event_id')
        event = get_object_or_404(Event, id=event_id)
        
        # Check permissions
        if not (
            IsOrganizer().has_permission(self.request, self) or
            CanManageResults().has_permission(self.request, self)
        ):
            self.permission_denied(self.request)
        
        serializer.save(event=event)
    
    @action(detail=True, methods=['post'], url_path='verify')
    def verify(self, request, pk=None):
        """Verify athlete stats"""
        athlete_stat = self.get_object()
        
        if not (
            IsOrganizer().has_permission(request, self) or
            CanManageResults().has_permission(request, self)
        ):
            return Response(
                {'detail': 'You do not have permission to verify these stats.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if athlete_stat.verified:
            return Response(
                {'detail': 'Athlete stats are already verified.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        athlete_stat.verify(user=request.user)
        
        # Recompute rankings
        recompute_athlete_rankings(athlete_stat.event.id)
        
        serializer = self.get_serializer(athlete_stat)
        return Response(serializer.data)


class RecomputeStandingsView(APIView):
    """View for recomputing standings"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, event_id):
        """Recompute standings for an event"""
        event = get_object_or_404(Event, id=event_id)
        
        # Check permissions
        if not (
            IsOrganizer().has_permission(request, self) or
            CanManageResults().has_permission(request, self)
        ):
            return Response(
                {'detail': 'You do not have permission to recompute standings.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Recompute standings
        leaderboard = recompute_event_standings(event_id)
        
        serializer = LeaderboardEntrySerializer(leaderboard, many=True)
        return Response({
            'message': 'Standings recomputed successfully.',
            'leaderboard': serializer.data
        })