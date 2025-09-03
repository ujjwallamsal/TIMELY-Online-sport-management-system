# public/views.py
from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.utils import timezone
from typing import Dict, Any

from .cache import get_home_data, set_home_data, get_news_data, set_news_data
from events.models import Event
from fixtures.models import Fixture
from results.models import Result
from content.models import Announcement
from tickets.models import TicketOrder


@api_view(['GET'])
@permission_classes([AllowAny])
def public_home(request) -> Response:
    """
    GET /api/public/home/
    Returns aggregated data for home page: hero events, latest news, highlights
    """
    try:
        # Try to get cached data first
        cached_data = get_home_data()
        if cached_data.get('heroEvents') and cached_data.get('news'):
            return Response(cached_data)
        
        # Build fresh data
        now = timezone.now()
        
        # Get 3 featured upcoming events (next 30 days)
        hero_events = Event.objects.filter(
            lifecycle_status=Event.LifecycleStatus.PUBLISHED,
            start_datetime__gte=now,
            start_datetime__lte=now + timezone.timedelta(days=30)
        ).select_related('venue').order_by('start_datetime')[:3]
        
        # Get latest 3 published news items
        news = Announcement.objects.filter(
            is_published=True
        ).order_by('-created_at')[:3]
        
        # Calculate highlights
        upcoming_count = Event.objects.filter(
            lifecycle_status=Event.LifecycleStatus.PUBLISHED,
            start_datetime__gte=now
        ).count()
        
        tickets_sold = TicketOrder.objects.filter(
            status='paid'
        ).aggregate(total=Count('id'))['total'] or 0
        
        data = {
            'heroEvents': [
                {
                    'id': event.id,
                    'name': event.name,
                    'sport': event.sport,
                    'start_datetime': event.start_datetime,
                    'location': event.location,
                    'venue': event.venue.name if event.venue else None,
                    'fee_cents': event.fee_cents
                }
                for event in hero_events
            ],
            'news': [
                {
                    'id': item.id,
                    'title': item.title,
                    'slug': item.slug,
                    'created_at': item.created_at,
                    'body': item.body[:200] + '...' if len(item.body) > 200 else item.body
                }
                for item in news
            ],
            'highlights': {
                'ticketsSold': tickets_sold,
                'upcomingCount': upcoming_count
            }
        }
        
        # Cache the data
        set_home_data(data, timeout=60)
        
        return Response(data)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to load home data: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def public_events_list(request) -> Response:
    """
    GET /api/public/events/
    Returns published events with filtering and pagination
    """
    try:
        # Get query parameters
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 12))
        sport = request.GET.get('sport', '')
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        search = request.GET.get('q', '')
        
        # Build queryset - published events only
        events = Event.objects.filter(
            lifecycle_status=Event.LifecycleStatus.PUBLISHED
        ).select_related('venue')
        
        # Apply filters
        if search:
            events = events.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) |
                Q(sport__icontains=search)
            )
        
        if sport:
            events = events.filter(sport__iexact=sport)
            
        if date_from:
            events = events.filter(start_datetime__gte=date_from)
            
        if date_to:
            events = events.filter(end_datetime__lte=date_to)
        
        # Order by start date
        events = events.order_by('start_datetime', 'created_at')
        
        # Paginate
        paginator = Paginator(events, page_size)
        page_obj = paginator.get_page(page)
        
        # Serialize results
        results = [
            {
                'id': event.id,
                'name': event.name,
                'sport': event.sport,
                'description': event.description,
                'start_datetime': event.start_datetime,
                'end_datetime': event.end_datetime,
                'location': event.location,
                'venue': {
                    'id': event.venue.id,
                    'name': event.venue.name
                } if event.venue else None,
                'capacity': event.capacity,
                'fee_cents': event.fee_cents,
                'phase': event.phase
            }
            for event in page_obj
        ]
        
        return Response({
            'results': results,
            'count': paginator.count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous()
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to load events: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def public_event_detail(request, event_id: int) -> Response:
    """
    GET /api/public/events/{id}/
    Returns published event detail with divisions
    """
    try:
        event = Event.objects.filter(
            id=event_id,
            lifecycle_status=Event.LifecycleStatus.PUBLISHED
        ).select_related('venue').prefetch_related('divisions').first()
        
        if not event:
            return Response(
                {'error': 'Event not found or not published'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        data = {
            'id': event.id,
            'name': event.name,
            'sport': event.sport,
            'description': event.description,
            'start_datetime': event.start_datetime,
            'end_datetime': event.end_datetime,
            'registration_open_at': event.registration_open_at,
            'registration_close_at': event.registration_close_at,
            'location': event.location,
            'venue': {
                'id': event.venue.id,
                'name': event.venue.name,
                'address': event.venue.address
            } if event.venue else None,
            'capacity': event.capacity,
            'fee_cents': event.fee_cents,
            'phase': event.phase,
            'divisions': [
                {
                    'id': div.id,
                    'name': div.name,
                    'description': div.description,
                    'max_teams': div.max_teams
                }
                for div in event.divisions.all()
            ]
        }
        
        return Response(data)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to load event: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def public_event_fixtures(request, event_id: int) -> Response:
    """
    GET /api/public/events/{id}/fixtures/
    Returns published fixtures for an event, ordered by starts_at
    """
    try:
        # Verify event exists and is published
        event = Event.objects.filter(
            id=event_id,
            lifecycle_status=Event.LifecycleStatus.PUBLISHED
        ).first()
        
        if not event:
            return Response(
                {'error': 'Event not found or not published'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get query parameters
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        
        # Get published fixtures for this event
        fixtures = Fixture.objects.filter(
            event=event,
            status=Fixture.Status.PUBLISHED
        ).select_related('venue').prefetch_related('entries__team', 'entries__participant').order_by('starts_at')
        
        # Paginate
        paginator = Paginator(fixtures, page_size)
        page_obj = paginator.get_page(page)
        
        # Serialize results
        results = []
        for fixture in page_obj:
            # Get home and away entries
            home_entry = fixture.entries.filter(side='home').first()
            away_entry = fixture.entries.filter(side='away').first()
            
            fixture_data = {
                'id': fixture.id,
                'round_no': fixture.round_no,
                'starts_at': fixture.starts_at,
                'ends_at': fixture.ends_at,
                'venue': {
                    'id': fixture.venue.id,
                    'name': fixture.venue.name
                } if fixture.venue else None,
                'home_team': {
                    'id': home_entry.team.id,
                    'name': home_entry.team.name
                } if home_entry and home_entry.team else None,
                'away_team': {
                    'id': away_entry.team.id,
                    'name': away_entry.team.name
                } if away_entry and away_entry.team else None,
                'status': fixture.status
            }
            results.append(fixture_data)
        
        return Response({
            'results': results,
            'count': paginator.count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous()
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to load fixtures: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def public_event_results(request, event_id: int) -> Response:
    """
    GET /api/public/events/{id}/results/
    Returns published results and leaderboard for an event
    """
    try:
        # Verify event exists and is published
        event = Event.objects.filter(
            id=event_id,
            lifecycle_status=Event.LifecycleStatus.PUBLISHED
        ).first()
        
        if not event:
            return Response(
                {'error': 'Event not found or not published'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get results for this event's fixtures
        results = Result.objects.filter(
            fixture__event=event
        ).select_related(
            'fixture__venue'
        ).prefetch_related(
            'fixture__entries__team',
            'fixture__entries__participant'
        ).order_by('-fixture__starts_at')
        
        # Serialize results
        results_data = []
        for result in results:
            # Get home and away entries
            home_entry = result.fixture.entries.filter(side='home').first()
            away_entry = result.fixture.entries.filter(side='away').first()
            
            result_data = {
                'id': result.id,
                'fixture': {
                    'id': result.fixture.id,
                    'round_no': result.fixture.round_no,
                    'starts_at': result.fixture.starts_at,
                    'venue': result.fixture.venue.name if result.fixture.venue else None
                },
                'home_team': {
                    'id': home_entry.team.id,
                    'name': home_entry.team.name
                } if home_entry and home_entry.team else None,
                'away_team': {
                    'id': away_entry.team.id,
                    'name': away_entry.team.name
                } if away_entry and away_entry.team else None,
                'score_home': result.score_home,
                'score_away': result.score_away,
                'notes': result.notes,
                'created_at': result.created_at
            }
            results_data.append(result_data)
        
        # Simple leaderboard calculation (wins/losses)
        team_stats = {}
        for result in results:
            home_entry = result.fixture.entries.filter(side='home').first()
            away_entry = result.fixture.entries.filter(side='away').first()
            
            if home_entry and home_entry.team and away_entry and away_entry.team:
                home_team = home_entry.team.name
                away_team = away_entry.team.name
                
                if home_team not in team_stats:
                    team_stats[home_team] = {'wins': 0, 'losses': 0, 'points_for': 0, 'points_against': 0}
                if away_team not in team_stats:
                    team_stats[away_team] = {'wins': 0, 'losses': 0, 'points_for': 0, 'points_against': 0}
                
                team_stats[home_team]['points_for'] += result.score_home
                team_stats[home_team]['points_against'] += result.score_away
                team_stats[away_team]['points_for'] += result.score_away
                team_stats[away_team]['points_against'] += result.score_home
                
                if result.score_home > result.score_away:
                    team_stats[home_team]['wins'] += 1
                    team_stats[away_team]['losses'] += 1
                elif result.score_away > result.score_home:
                    team_stats[away_team]['wins'] += 1
                    team_stats[home_team]['losses'] += 1
        
        # Sort leaderboard by wins
        leaderboard = [
            {
                'team': team,
                'wins': stats['wins'],
                'losses': stats['losses'],
                'points_for': stats['points_for'],
                'points_against': stats['points_against'],
                'point_difference': stats['points_for'] - stats['points_against']
            }
            for team, stats in sorted(
                team_stats.items(), 
                key=lambda x: (x[1]['wins'], x[1]['point_difference']), 
                reverse=True
            )
        ]
        
        return Response({
            'results': results_data,
            'leaderboard': leaderboard,
            'count': len(results_data)
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to load results: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def public_news_list(request) -> Response:
    """
    GET /api/public/news/
    Returns published news/announcements, newest first
    """
    try:
        # Try to get cached data first
        cached_data = get_news_data()
        if cached_data.get('results'):
            return Response(cached_data)
        
        # Get query parameters
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        
        # Get published announcements
        announcements = Announcement.objects.filter(
            is_published=True
        ).order_by('-created_at')
        
        # Paginate
        paginator = Paginator(announcements, page_size)
        page_obj = paginator.get_page(page)
        
        # Serialize results
        results = [
            {
                'id': item.id,
                'title': item.title,
                'slug': item.slug,
                'body': item.body,
                'author': item.author.username if item.author else None,
                'created_at': item.created_at,
                'updated_at': item.updated_at
            }
            for item in page_obj
        ]
        
        data = {
            'results': results,
            'count': paginator.count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous()
        }
        
        # Cache the data
        set_news_data(data, timeout=60)
        
        return Response(data)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to load news: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
