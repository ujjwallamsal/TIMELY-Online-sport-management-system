# fixtures/services/conflicts.py
from __future__ import annotations

from datetime import timedelta, datetime
from typing import List, Dict
from django.utils import timezone
from django.db.models import Q

from ..models import Fixture


def check_fixture_conflicts(fixture: Fixture) -> List[Dict]:
    """Check for conflicts with a fixture"""
    conflicts = []
    
    # Check venue conflicts
    if fixture.venue and fixture.start_at:
        venue_conflicts = Fixture.objects.filter(
            venue=fixture.venue,
            start_at__lt=fixture.start_at + timedelta(hours=2),  # Assume 2-hour duration
            start_at__gt=fixture.start_at - timedelta(hours=2),
            status__in=[Fixture.Status.SCHEDULED, Fixture.Status.LIVE]
        ).exclude(id=fixture.id)
        
        for conflict in venue_conflicts:
            conflicts.append({
                'type': 'venue_conflict',
                'fixture_id': conflict.id,
                'message': f'Venue {fixture.venue.name} is already booked at {conflict.start_at}',
                'conflicting_fixture': {
                    'id': conflict.id,
                    'home_team': conflict.home.name if conflict.home else 'TBD',
                    'away_team': conflict.away.name if conflict.away else 'TBD',
                    'start_at': conflict.start_at.isoformat()
                }
            })
    
    # Check team conflicts
    if fixture.home and fixture.start_at:
        home_conflicts = Fixture.objects.filter(
            Q(home=fixture.home) | Q(away=fixture.home),
            start_at__lt=fixture.start_at + timedelta(hours=2),
            start_at__gt=fixture.start_at - timedelta(hours=2),
            status__in=[Fixture.Status.SCHEDULED, Fixture.Status.LIVE]
        ).exclude(id=fixture.id)
        
        for conflict in home_conflicts:
            conflicts.append({
                'type': 'team_conflict',
                'fixture_id': conflict.id,
                'message': f'Team {fixture.home.name} is already playing at {conflict.start_at}',
                'conflicting_fixture': {
                    'id': conflict.id,
                    'home_team': conflict.home.name if conflict.home else 'TBD',
                    'away_team': conflict.away.name if conflict.away else 'TBD',
                    'start_at': conflict.start_at.isoformat()
                }
            })
    
    if fixture.away and fixture.start_at:
        away_conflicts = Fixture.objects.filter(
            Q(home=fixture.away) | Q(away=fixture.away),
            start_at__lt=fixture.start_at + timedelta(hours=2),
            start_at__gt=fixture.start_at - timedelta(hours=2),
            status__in=[Fixture.Status.SCHEDULED, Fixture.Status.LIVE]
        ).exclude(id=fixture.id)
        
        for conflict in away_conflicts:
            conflicts.append({
                'type': 'team_conflict',
                'fixture_id': conflict.id,
                'message': f'Team {fixture.away.name} is already playing at {conflict.start_at}',
                'conflicting_fixture': {
                    'id': conflict.id,
                    'home_team': conflict.home.name if conflict.home else 'TBD',
                    'away_team': conflict.away.name if conflict.away else 'TBD',
                    'start_at': conflict.start_at.isoformat()
                }
            })
    
    return conflicts


def check_venue_availability(venue_id: int, start_at: datetime, duration_hours: int = 2, exclude_fixture_id: int = None) -> bool:
    """Check if venue is available at given time"""
    conflicts = Fixture.objects.filter(
        venue_id=venue_id,
        start_at__lt=start_at + timedelta(hours=duration_hours),
        start_at__gt=start_at - timedelta(hours=duration_hours),
        status__in=[Fixture.Status.SCHEDULED, Fixture.Status.LIVE]
    )
    
    if exclude_fixture_id:
        conflicts = conflicts.exclude(id=exclude_fixture_id)
    
    return not conflicts.exists()


def suggest_alternative_times(venue_id: int, preferred_time: datetime, duration_hours: int = 2) -> List[datetime]:
    """Suggest alternative times for a venue"""
    suggestions = []
    
    # Try different times on the same day
    for hour_offset in [1, 2, 3, -1, -2, -3]:
        new_time = preferred_time + timedelta(hours=hour_offset)
        if check_venue_availability(venue_id, new_time, duration_hours):
            suggestions.append(new_time)
    
    # Try next few days
    for day_offset in [1, 2, 3]:
        new_time = preferred_time + timedelta(days=day_offset)
        if check_venue_availability(venue_id, new_time, duration_hours):
            suggestions.append(new_time)
    
    return suggestions[:5]  # Return top 5 suggestions


def validate_fixture_schedule(fixtures_data: List[Dict], event_id: int) -> Dict:
    """Validate a list of fixtures for conflicts"""
    conflicts = []
    
    for i, fixture_data in enumerate(fixtures_data):
        # Create temporary fixture for validation
        temp_fixture = Fixture(
            event_id=event_id,
            home_id=fixture_data.get('home_team_id'),
            away_id=fixture_data.get('away_team_id'),
            venue_id=fixture_data.get('venue_id'),
            start_at=fixture_data.get('start_at')
        )
        
        fixture_conflicts = check_fixture_conflicts(temp_fixture)
        if fixture_conflicts:
            conflicts.append({
                'fixture_index': i,
                'fixture_data': fixture_data,
                'conflicts': fixture_conflicts
            })
    
    return {
        'valid': len(conflicts) == 0,
        'conflicts': conflicts
    }


def find_conflicts(event_id: int) -> List[Dict]:
    """Find all conflicts in an event"""
    fixtures = Fixture.objects.filter(event_id=event_id)
    all_conflicts = []
    
    for fixture in fixtures:
        conflicts = check_fixture_conflicts(fixture)
        if conflicts:
            all_conflicts.append({
                'fixture_id': fixture.id,
                'fixture_name': str(fixture),
                'conflicts': conflicts
            })
    
    return all_conflicts