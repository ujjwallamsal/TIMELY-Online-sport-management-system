# events/sse_views.py
"""
Lean SSE fallback endpoints for real-time updates when WebSockets aren't available.
"""
import json
import time
from django.http import StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Event
from results.models import Result, LeaderboardEntry
from fixtures.models import Fixture


@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def event_stream_sse(request, event_id):
    """SSE endpoint for event heartbeat and future hooks"""
    event = get_object_or_404(Event, id=event_id)
    
    def event_generator():
        """Generate SSE heartbeat events"""
        # Send initial connection event
        yield f"data: {json.dumps({'type': 'connected', 'event_id': event_id, 'event_name': event.name})}\n\n"
        
        # Heartbeat loop - no infinite busy loop
        while True:
            try:
                heartbeat_data = {
                    'type': 'heartbeat',
                    'timestamp': timezone.now().isoformat(),
                    'event_id': event_id,
                    'event_status': event.status
                }
                yield f"data: {json.dumps(heartbeat_data)}\n\n"
                time.sleep(30)  # Sleep 30s between heartbeats
                
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


@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def event_results_stream_sse(request, event_id):
    """SSE endpoint for leaderboard and result updates"""
    event = get_object_or_404(Event, id=event_id)
    
    def results_generator():
        """Generate results and leaderboard updates"""
        try:
            # Send initial leaderboard
            leaderboard = LeaderboardEntry.objects.filter(
                event=event
            ).select_related('team').order_by('-points', '-goal_difference', '-goals_for')
            
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
                    'goal_difference': entry.goal_difference
                })
            
            yield f"data: {json.dumps({'type': 'leaderboard_update', 'data': leaderboard_data})}\n\n"
            
            # Monitor for result changes
            last_check = timezone.now()
            while True:
                try:
                    # Check for new results every 15 seconds
                    time.sleep(15)
                    
                    recent_results = Result.objects.filter(
                        fixture__event=event,
                        verified_at__gt=last_check
                    ).select_related('fixture', 'fixture__home', 'fixture__away')
                    
                    if recent_results.exists():
                        # Send individual result updates
                        for result in recent_results:
                            result_data = {
                                'fixture_id': result.fixture.id,
                                'home_team': result.fixture.home.name if result.fixture.home else 'TBD',
                                'away_team': result.fixture.away.name if result.fixture.away else 'TBD',
                                'home_score': result.home_score,
                                'away_score': result.away_score,
                                'winner': result.winner.name if result.winner else None,
                                'verified_at': result.verified_at.isoformat()
                            }
                            yield f"data: {json.dumps({'type': 'result_update', 'data': result_data})}\n\n"
                        
                        # Recompute and send updated leaderboard
                        leaderboard = LeaderboardEntry.objects.filter(
                            event=event
                        ).select_related('team').order_by('-points', '-goal_difference', '-goals_for')
                        
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
                                'goal_difference': entry.goal_difference
                            })
                        
                        yield f"data: {json.dumps({'type': 'leaderboard_update', 'data': leaderboard_data})}\n\n"
                        last_check = timezone.now()
                        
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                    break
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    response = StreamingHttpResponse(
        results_generator(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['Connection'] = 'keep-alive'
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Headers'] = 'Cache-Control'
    return response