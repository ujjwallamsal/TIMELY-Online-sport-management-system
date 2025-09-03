# fixtures/services/conflicts.py
from typing import List, Dict, Any, Optional
from django.utils import timezone
from django.db.models import Q
from datetime import datetime

from ..models import Fixture
from venues.models import VenueSlot


def find_conflicts(
    starts_at: datetime,
    ends_at: datetime,
    venue_id: Optional[int] = None,
    exclude_fixture_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Find conflicts for a given time slot.
    
    Args:
        starts_at: Start time of the slot to check
        ends_at: End time of the slot to check
        venue_id: Optional venue ID to check conflicts for
        exclude_fixture_id: Optional fixture ID to exclude from conflict check
    
    Returns:
        List of conflicting fixtures and venue slots
    """
    conflicts = []
    
    # Check for fixture conflicts
    fixture_query = Q(
        starts_at__lt=ends_at,
        ends_at__gt=starts_at
    )
    
    if venue_id:
        fixture_query &= Q(venue_id=venue_id)
    
    if exclude_fixture_id:
        fixture_query &= ~Q(id=exclude_fixture_id)
    
    conflicting_fixtures = Fixture.objects.filter(fixture_query).select_related('event', 'venue')
    
    for fixture in conflicting_fixtures:
        conflicts.append({
            'type': 'fixture',
            'id': fixture.id,
            'event_name': fixture.event.name,
            'round_no': fixture.round_no,
            'starts_at': fixture.starts_at,
            'ends_at': fixture.ends_at,
            'venue_name': fixture.venue.name if fixture.venue else None,
            'overlap_start': max(starts_at, fixture.starts_at),
            'overlap_end': min(ends_at, fixture.ends_at),
        })
    
    # Check for venue slot conflicts
    if venue_id:
        venue_slot_query = Q(
            venue_id=venue_id,
            starts_at__lt=ends_at,
            ends_at__gt=starts_at,
            status=VenueSlot.Status.BLOCKED
        )
        
        conflicting_slots = VenueSlot.objects.filter(venue_slot_query).select_related('venue')
        
        for slot in conflicting_slots:
            conflicts.append({
                'type': 'venue_slot',
                'id': slot.id,
                'venue_name': slot.venue.name,
                'starts_at': slot.starts_at,
                'ends_at': slot.ends_at,
                'reason': slot.reason,
                'overlap_start': max(starts_at, slot.starts_at),
                'overlap_end': min(ends_at, slot.ends_at),
            })
    
    return conflicts


def check_fixture_conflicts(fixture: Fixture) -> List[Dict[str, Any]]:
    """
    Check conflicts for a specific fixture.
    
    Args:
        fixture: Fixture instance to check
    
    Returns:
        List of conflicts
    """
    return find_conflicts(
        fixture.starts_at,
        fixture.ends_at,
        fixture.venue_id if fixture.venue else None,
        fixture.id
    )


def validate_fixture_schedule(
    fixtures_data: List[Dict[str, Any]],
    event_id: int
) -> Dict[str, Any]:
    """
    Validate a list of fixtures for conflicts.
    
    Args:
        fixtures_data: List of fixture data dictionaries
        event_id: ID of the event
    
    Returns:
        Validation result with conflicts
    """
    all_conflicts = []
    
    for i, fixture_data in enumerate(fixtures_data):
        starts_at = fixture_data.get('starts_at')
        ends_at = fixture_data.get('ends_at')
        venue_id = fixture_data.get('venue_id')
        
        if not starts_at or not ends_at:
            continue
        
        # Convert string dates to datetime if needed
        if isinstance(starts_at, str):
            starts_at = datetime.fromisoformat(starts_at.replace('Z', '+00:00'))
        if isinstance(ends_at, str):
            ends_at = datetime.fromisoformat(ends_at.replace('Z', '+00:00'))
        
        conflicts = find_conflicts(starts_at, ends_at, venue_id)
        
        if conflicts:
            all_conflicts.append({
                'fixture_index': i,
                'fixture_data': fixture_data,
                'conflicts': conflicts
            })
    
    return {
        'valid': len(all_conflicts) == 0,
        'conflicts': all_conflicts
    }


def check_venue_availability(
    venue_id: int,
    starts_at: datetime,
    ends_at: datetime
) -> Dict[str, Any]:
    """
    Check venue availability for a time slot.
    
    Args:
        venue_id: ID of the venue
        starts_at: Start time
        ends_at: End time
    
    Returns:
        Availability information
    """
    try:
        venue = Venue.objects.get(id=venue_id)
    except Venue.DoesNotExist:
        return {'available': False, 'reason': 'Venue not found'}
    
    # Check for blocked venue slots
    blocked_slots = VenueSlot.objects.filter(
        venue_id=venue_id,
        starts_at__lt=ends_at,
        ends_at__gt=starts_at,
        status=VenueSlot.Status.BLOCKED
    )
    
    if blocked_slots.exists():
        return {
            'available': False,
            'reason': 'Venue is blocked during this time',
            'blocked_slots': [
                {
                    'starts_at': slot.starts_at,
                    'ends_at': slot.ends_at,
                    'reason': slot.reason
                }
                for slot in blocked_slots
            ]
        }
    
    return {'available': True}


def get_available_venues(
    starts_at: datetime,
    ends_at: datetime
) -> List[Dict[str, Any]]:
    """
    Get available venues for a time slot.
    
    Args:
        starts_at: Start time
        ends_at: End time
    
    Returns:
        List of available venues
    """
    # Get all venues
    all_venues = Venue.objects.all()
    available_venues = []
    
    for venue in all_venues:
        availability = check_venue_availability(venue.id, starts_at, ends_at)
        if availability['available']:
            available_venues.append({
                'id': venue.id,
                'name': venue.name,
                'address': venue.address,
                'capacity': venue.capacity
            })
    
    return available_venues


def suggest_alternative_times(
    venue_id: int,
    preferred_start: datetime,
    preferred_end: datetime,
    duration_minutes: int = 60,
    max_suggestions: int = 5
) -> List[Dict[str, Any]]:
    """
    Suggest alternative times for a venue.
    
    Args:
        venue_id: ID of the venue
        preferred_start: Preferred start time
        preferred_end: Preferred end time
        duration_minutes: Duration in minutes
        max_suggestions: Maximum number of suggestions
    
    Returns:
        List of alternative time suggestions
    """
    suggestions = []
    duration = timezone.timedelta(minutes=duration_minutes)
    
    # Try times around the preferred time
    time_offsets = [
        timezone.timedelta(minutes=30),   # 30 minutes later
        timezone.timedelta(minutes=-30),  # 30 minutes earlier
        timezone.timedelta(hours=1),      # 1 hour later
        timezone.timedelta(hours=-1),     # 1 hour earlier
        timezone.timedelta(hours=2),      # 2 hours later
        timezone.timedelta(hours=-2),     # 2 hours earlier
    ]
    
    for offset in time_offsets:
        if len(suggestions) >= max_suggestions:
            break
        
        suggested_start = preferred_start + offset
        suggested_end = suggested_start + duration
        
        # Check if this time is available
        availability = check_venue_availability(venue_id, suggested_start, suggested_end)
        if availability['available']:
            suggestions.append({
                'starts_at': suggested_start,
                'ends_at': suggested_end,
                'offset_minutes': int(offset.total_seconds() / 60)
            })
    
    return suggestions