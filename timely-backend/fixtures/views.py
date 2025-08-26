# fixtures/views.py
from __future__ import annotations

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction

from .models import Fixture, Match, MatchEntry
from .serializers import (
    FixtureSerializer, FixtureCreateSerializer, FixtureUpdateSerializer,
    FixtureListSerializer, FixtureGenerateSerializer, FixturePublishSerializer,
    MatchSerializer, MatchEntrySerializer, MatchRescheduleSerializer
)
from .services import FixtureGenerator, FixtureConflictChecker
from .permissions import IsOrganizerOrAdmin


class FixtureViewSet(viewsets.ModelViewSet):
    """ViewSet for fixture management"""
    queryset = Fixture.objects.select_related('event', 'division', 'generated_by').prefetch_related('venues', 'matches').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event', 'division', 'tournament_type', 'status']
    search_fields = ['name', 'event__name', 'division__name']
    ordering_fields = ['start_date', 'end_date', 'created_at', 'generated_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return FixtureCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return FixtureUpdateSerializer
        elif self.action == 'list':
            return FixtureListSerializer
        return FixtureSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'generate', 'publish', 'reschedule']:
            return [IsOrganizerOrAdmin()]
        elif self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticatedOrReadOnly()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by event if specified
        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        # Organizers can see fixtures for their events
        if self.request.user.is_authenticated and self.request.user.role == 'ORGANIZER':
            if self.action in ['list', 'retrieve']:
                queryset = queryset.filter(event__created_by=self.request.user)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """Generate fixtures for a tournament"""
        fixture = self.get_object()
        
        if fixture.status != Fixture.Status.DRAFT:
            return Response({
                'detail': 'Can only generate fixtures in DRAFT status'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = FixtureGenerateSerializer(
            data=request.data, 
            context={'fixture': fixture}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Clear existing matches if any
                fixture.matches.all().delete()
                
                # Generate fixtures
                generator = FixtureGenerator(fixture)
                
                if serializer.validated_data['generation_type'] == 'ROUND_ROBIN':
                    matches = generator.generate_round_robin(
                        rounds=serializer.validated_data.get('rounds', 1),
                        randomize_seeds=serializer.validated_data.get('randomize_seeds', False)
                    )
                elif serializer.validated_data['generation_type'] == 'KNOCKOUT':
                    matches = generator.generate_knockout(
                        seed_teams=serializer.validated_data.get('seed_teams', False),
                        include_playoffs=serializer.validated_data.get('include_playoffs', False)
                    )
                elif serializer.validated_data['generation_type'] == 'GROUP_STAGE':
                    matches = generator.generate_group_stage(
                        group_size=serializer.validated_data['group_size'],
                        teams_per_group=serializer.validated_data['teams_per_group']
                    )
                else:  # SWISS
                    # Swiss system implementation would go here
                    matches = generator.generate_round_robin(rounds=3, randomize_seeds=True)
                
                # Update fixture status
                fixture.status = Fixture.Status.PROPOSED
                fixture.generated_by = request.user
                fixture.generation_notes = f"Generated {len(matches)} matches using {serializer.validated_data['generation_type']} system"
                fixture.save()
                
                return Response({
                    'detail': f'Successfully generated {len(matches)} matches',
                    'matches_count': len(matches),
                    'fixture_status': fixture.status,
                    'generation_notes': fixture.generation_notes
                })
                
        except Exception as e:
            return Response({
                'detail': f'Error generating fixtures: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish fixtures to participants"""
        fixture = self.get_object()
        
        if fixture.status != Fixture.Status.PROPOSED:
            return Response({
                'detail': 'Can only publish fixtures in PROPOSED status'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = FixturePublishSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Check for conflicts before publishing
                conflicts = []
                for match in fixture.matches.all():
                    venue_conflicts = FixtureConflictChecker.check_venue_conflicts(match)
                    participant_conflicts = FixtureConflictChecker.check_participant_conflicts(match)
                    
                    if venue_conflicts or participant_conflicts:
                        conflicts.append({
                            'match_id': match.id,
                            'venue_conflicts': len(venue_conflicts),
                            'participant_conflicts': len(participant_conflicts)
                        })
                
                if conflicts and serializer.validated_data.get('check_conflicts', True):
                    return Response({
                        'detail': 'Cannot publish fixtures with conflicts',
                        'conflicts': conflicts
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Publish matches
                if serializer.validated_data.get('publish_matches', True):
                    fixture.matches.update(is_published=True)
                
                # Update fixture status
                fixture.status = Fixture.Status.PUBLISHED
                fixture.save()
                
                # TODO: Send notifications to participants if requested
                if serializer.validated_data.get('send_notifications', True):
                    pass  # Implement notification system
                
                return Response({
                    'detail': 'Fixtures published successfully',
                    'fixture_status': fixture.status,
                    'matches_published': fixture.matches.filter(is_published=True).count()
                })
                
        except Exception as e:
            return Response({
                'detail': f'Error publishing fixtures: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Regenerate fixtures (clears existing and generates new)"""
        fixture = self.get_object()
        
        if fixture.status == Fixture.Status.PUBLISHED:
            return Response({
                'detail': 'Cannot regenerate published fixtures'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Reset to draft status
        fixture.status = Fixture.Status.DRAFT
        fixture.save()
        
        # Clear existing matches
        fixture.matches.all().delete()
        
        return Response({
            'detail': 'Fixtures reset to draft status. Use generate endpoint to create new fixtures.'
        })

    @action(detail=True, methods=['get'])
    def conflicts(self, request, pk=None):
        """Check for conflicts in fixtures"""
        fixture = self.get_object()
        
        conflicts = {
            'venue_conflicts': [],
            'participant_conflicts': [],
            'summary': {
                'total_matches': fixture.matches.count(),
                'conflicted_matches': 0,
                'total_conflicts': 0
            }
        }
        
        for match in fixture.matches.all():
            venue_conflicts = FixtureConflictChecker.check_venue_conflicts(match)
            participant_conflicts = FixtureConflictChecker.check_participant_conflicts(match)
            
            if venue_conflicts or participant_conflicts:
                conflicts['summary']['conflicted_matches'] += 1
                conflicts['summary']['total_conflicts'] += len(venue_conflicts) + len(participant_conflicts)
                
                if venue_conflicts:
                    conflicts['venue_conflicts'].append({
                        'match_id': match.id,
                        'match_display': str(match),
                        'conflicts': [str(c) for c in venue_conflicts]
                    })
                
                if participant_conflicts:
                    conflicts['participant_conflicts'].append({
                        'match_id': match.id,
                        'match_display': str(match),
                        'conflicts': [str(c) for c in participant_conflicts]
                    })
        
        return Response(conflicts)

    @action(detail=True, methods=['get'])
    def schedule(self, request, pk=None):
        """Get fixture schedule view"""
        fixture = self.get_object()
        
        # Group matches by date and venue
        schedule = {}
        for match in fixture.matches.filter(is_published=True).order_by('scheduled_at'):
            date_key = match.scheduled_at.date().isoformat()
            venue_key = match.venue.name if match.venue else 'TBD'
            
            if date_key not in schedule:
                schedule[date_key] = {}
            
            if venue_key not in schedule[date_key]:
                schedule[date_key][venue_key] = []
            
            schedule[date_key][venue_key].append({
                'id': match.id,
                'time': match.scheduled_at.time().strftime('%H:%M'),
                'round': match.round_number,
                'match_number': match.match_number,
                'home': str(match.entries.filter(position='HOME').first() or 'TBD'),
                'away': str(match.entries.filter(position='AWAY').first() or 'TBD'),
                'status': match.status
            })
        
        return Response({
            'fixture_name': fixture.name,
            'event_name': fixture.event.name,
            'division_name': fixture.division.name,
            'schedule': schedule
        })


class MatchViewSet(viewsets.ModelViewSet):
    """ViewSet for match management"""
    queryset = Match.objects.select_related('fixture', 'venue', 'winner').prefetch_related('entries').all()
    serializer_class = MatchSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['fixture', 'round_number', 'status', 'is_published', 'venue']
    search_fields = ['fixture__name', 'venue__name']
    ordering_fields = ['scheduled_at', 'round_number', 'match_number']
    ordering = ['fixture', 'round_number', 'match_number']

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', 'reschedule']:
            return [IsOrganizerOrAdmin()]
        elif self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticatedOrReadOnly()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by fixture if specified
        fixture_id = self.request.query_params.get('fixture')
        if fixture_id:
            queryset = queryset.filter(fixture_id=fixture_id)
        
        # Organizers can see matches for their fixtures
        if self.request.user.is_authenticated and self.request.user.role == 'ORGANIZER':
            if self.action in ['list', 'retrieve']:
                queryset = queryset.filter(fixture__event__created_by=self.request.user)
        
        return queryset

    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """Reschedule a match"""
        match = self.get_object()
        
        if match.status == Match.Status.COMPLETED:
            return Response({
                'detail': 'Cannot reschedule completed matches'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = MatchRescheduleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Check for conflicts if requested
            if serializer.validated_data.get('check_conflicts', True):
                venue_conflicts = FixtureConflictChecker.check_venue_conflicts(match)
                participant_conflicts = FixtureConflictChecker.check_participant_conflicts(match)
                
                if venue_conflicts or participant_conflicts:
                    suggestions = FixtureConflictChecker.suggest_reschedule_time(match)
                    return Response({
                        'detail': 'New time conflicts with existing matches',
                        'conflicts': {
                            'venue_conflicts': len(venue_conflicts),
                            'participant_conflicts': len(participant_conflicts)
                        },
                        'suggestions': [s.isoformat() for s in suggestions]
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Reschedule the match
            match.reschedule(
                serializer.validated_data['new_scheduled_at'],
                request.user,
                serializer.validated_data.get('reason', '')
            )
            
            return Response({
                'detail': 'Match rescheduled successfully',
                'new_scheduled_at': match.scheduled_at.isoformat(),
                'reschedule_reason': match.reschedule_reason
            })
            
        except Exception as e:
            return Response({
                'detail': f'Error rescheduling match: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a match to participants"""
        match = self.get_object()
        
        if match.is_published:
            return Response({
                'detail': 'Match is already published'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        match.is_published = True
        match.save()
        
        return Response({
            'detail': 'Match published successfully',
            'is_published': True
        })

    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Unpublish a match from participants"""
        match = self.get_object()
        
        if not match.is_published:
            return Response({
                'detail': 'Match is not published'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        match.is_published = False
        match.save()
        
        return Response({
            'detail': 'Match unpublished successfully',
            'is_published': False
        })


class MatchEntryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for match entries (read-only)"""
    queryset = MatchEntry.objects.select_related('fixture', 'match', 'team', 'individual_registration__user').all()
    serializer_class = MatchEntrySerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fixture', 'match', 'entry_type', 'position']
    ordering = ['match', 'position']

    def get_permissions(self):
        return [permissions.IsAuthenticatedOrReadOnly()]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by fixture if specified
        fixture_id = self.request.query_params.get('fixture')
        if fixture_id:
            queryset = queryset.filter(fixture_id=fixture_id)
        
        # Filter by match if specified
        match_id = self.request.query_params.get('match')
        if match_id:
            queryset = queryset.filter(match_id=match_id)
        
        return queryset
