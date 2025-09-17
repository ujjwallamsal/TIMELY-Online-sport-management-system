# events/sse_views.py
"""
Server-Sent Events (SSE) fallback endpoints for real-time updates.
Provides HTTP-based real-time updates when WebSockets are not available.
"""
import json
import asyncio
from django.http import StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.db import models
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Event
from results.services import compute_event_leaderboard
from results.models import Result
from fixtures.models import Fixture


class SSEEventStreamView(View):
    """SSE endpoint for event-specific updates"""
    
    def get(self, request, event_id):
        """Stream event updates via SSE"""
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response(
                {"error": "Event not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if not self._can_view_event(request.user, event):
            return Response(
                {"error": "Permission denied"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        def event_generator():
            """Generate SSE events"""
            channel_layer = get_channel_layer()
            group_name = f'event_{event_id}'
            
            # Send initial connection event
            yield f"data: {json.dumps({'type': 'connected', 'event_id': event_id})}\n\n"
            
            # Listen for updates from the channel layer
            while True:
                try:
                    # This is a simplified version - in production you'd want to use
                    # a proper message queue or Redis pub/sub
                    yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': timezone.now().isoformat()})}\n\n"
                    asyncio.sleep(30)  # Send heartbeat every 30 seconds
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                    break
        
        response = StreamingHttpResponse(
            event_generator(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Headers'] = 'Cache-Control'
        return response
    
    def _can_view_event(self, user, event):
        """Check if user can view the event"""
        if event.visibility == 'PUBLIC':
            return True
        if user.is_authenticated:
            # Add more permission logic here
            return True
        return False


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def event_results_sse(request, event_id):
    """SSE endpoint for event results updates"""
    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        return Response(
            {"error": "Event not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    def results_generator():
        """Generate results updates"""
        # Send initial leaderboard
        leaderboard = compute_event_leaderboard(event_id)
        yield f"data: {json.dumps({'type': 'leaderboard_update', 'data': leaderboard})}\n\n"
        
        # Monitor for result changes
        last_update = timezone.now()
        while True:
            try:
                # Check for new results
                recent_results = Result.objects.filter(
                    fixture__event_id=event_id,
                    updated_at__gt=last_update
                ).select_related('fixture', 'fixture__home', 'fixture__away')
                
                if recent_results.exists():
                    # Recompute leaderboard
                    leaderboard = compute_event_leaderboard(event_id)
                    yield f"data: {json.dumps({'type': 'leaderboard_update', 'data': leaderboard})}\n\n"
                    
                    # Send individual result updates
                    for result in recent_results:
                        yield f"data: {json.dumps({'type': 'result_update', 'data': {
                            'fixture_id': result.fixture.id,
                            'home_score': result.home_score,
                            'away_score': result.away_score,
                            'winner': result.winner.id if result.winner else None,
                            'finalized_at': result.finalized_at.isoformat() if result.finalized_at else None
                        }})}\n\n"
                    
                    last_update = timezone.now()
                
                asyncio.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                break
    
    response = StreamingHttpResponse(
        results_generator(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['Connection'] = 'keep-alive'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def event_schedule_sse(request, event_id):
    """SSE endpoint for event schedule updates"""
    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        return Response(
            {"error": "Event not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    def schedule_generator():
        """Generate schedule updates"""
        # Send initial schedule
        fixtures = Fixture.objects.filter(event_id=event_id).select_related('home', 'away', 'venue')
        schedule_data = []
        for fixture in fixtures:
            schedule_data.append({
                'id': fixture.id,
                'home_team': fixture.home.name if fixture.home else None,
                'away_team': fixture.away.name if fixture.away else None,
                'start_at': fixture.start_at.isoformat(),
                'venue': fixture.venue.name if fixture.venue else None,
                'status': fixture.status,
                'round': fixture.round,
                'phase': fixture.phase
            })
        
        yield f"data: {json.dumps({'type': 'schedule_update', 'data': schedule_data})}\n\n"
        
        # Monitor for schedule changes
        last_update = timezone.now()
        while True:
            try:
                # Check for fixture changes
                recent_fixtures = Fixture.objects.filter(
                    event_id=event_id,
                    updated_at__gt=last_update
                ).select_related('home', 'away', 'venue')
                
                if recent_fixtures.exists():
                    # Send updated schedule
                    schedule_data = []
                    for fixture in Fixture.objects.filter(event_id=event_id).select_related('home', 'away', 'venue'):
                        schedule_data.append({
                            'id': fixture.id,
                            'home_team': fixture.home.name if fixture.home else None,
                            'away_team': fixture.away.name if fixture.away else None,
                            'start_at': fixture.start_at.isoformat(),
                            'venue': fixture.venue.name if fixture.venue else None,
                            'status': fixture.status,
                            'round': fixture.round,
                            'phase': fixture.phase
                        })
                    
                    yield f"data: {json.dumps({'type': 'schedule_update', 'data': schedule_data})}\n\n"
                    last_update = timezone.now()
                
                asyncio.sleep(10)  # Check every 10 seconds
                
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                break
    
    response = StreamingHttpResponse(
        schedule_generator(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['Connection'] = 'keep-alive'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_updates_sse(request, team_id):
    """SSE endpoint for team-specific updates"""
    try:
        from teams.models import Team
        team = Team.objects.get(id=team_id)
    except Team.DoesNotExist:
        return Response(
            {"error": "Team not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    def team_generator():
        """Generate team updates"""
        # Send initial team data
        yield f"data: {json.dumps({'type': 'team_connected', 'team_id': team_id, 'team_name': team.name})}\n\n"
        
        # Monitor for team-related updates
        last_update = timezone.now()
        while True:
            try:
                # Check for fixture updates for this team
                recent_fixtures = Fixture.objects.filter(
                    models.Q(home_id=team_id) | models.Q(away_id=team_id),
                    updated_at__gt=last_update
                ).select_related('home', 'away', 'venue', 'event')
                
                if recent_fixtures.exists():
                    for fixture in recent_fixtures:
                        yield f"data: {json.dumps({'type': 'fixture_update', 'data': {
                            'fixture_id': fixture.id,
                            'home_team': fixture.home.name if fixture.home else None,
                            'away_team': fixture.away.name if fixture.away else None,
                            'start_at': fixture.start_at.isoformat(),
                            'venue': fixture.venue.name if fixture.venue else None,
                            'status': fixture.status,
                            'event_id': fixture.event.id
                        }})}\n\n"
                    
                    last_update = timezone.now()
                
                asyncio.sleep(10)  # Check every 10 seconds
                
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                break
    
    response = StreamingHttpResponse(
        team_generator(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['Connection'] = 'keep-alive'
    return response