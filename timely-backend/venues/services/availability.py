# venues/services/availability.py
from typing import List, Dict, Any, Optional
from django.utils import timezone
from django.db.models import Q
from ..models import Venue, VenueSlot


def find_conflicts(
    venue_id: int,
    starts_at: timezone.datetime,
    ends_at: timezone.datetime,
    exclude_slot_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Find conflicting slots for a given time range.
    
    Args:
        venue_id: ID of the venue to check
        starts_at: Start time of the slot to check
        ends_at: End time of the slot to check
        exclude_slot_id: Optional slot ID to exclude from conflict check
    
    Returns:
        List of conflicting slot dictionaries
    """
    try:
        venue = Venue.objects.get(id=venue_id)
    except Venue.DoesNotExist:
        return []
    
    # Build query for overlapping slots
    query = Q(
        venue=venue,
        starts_at__lt=ends_at,
        ends_at__gt=starts_at
    )
    
    # Exclude specific slot if provided
    if exclude_slot_id:
        query &= ~Q(id=exclude_slot_id)
    
    conflicting_slots = VenueSlot.objects.filter(query).order_by('starts_at')
    
    conflicts = []
    for slot in conflicting_slots:
        conflicts.append({
            'id': slot.id,
            'starts_at': slot.starts_at,
            'ends_at': slot.ends_at,
            'status': slot.status,
            'reason': slot.reason,
            'overlap_start': max(starts_at, slot.starts_at),
            'overlap_end': min(ends_at, slot.ends_at),
        })
    
    return conflicts


def check_availability(
    venue_id: int,
    from_date: timezone.datetime,
    to_date: timezone.datetime
) -> Dict[str, Any]:
    """
    Check venue availability for a date range.
    
    Args:
        venue_id: ID of the venue to check
        from_date: Start of the date range
        to_date: End of the date range
    
    Returns:
        Dictionary with availability information
    """
    try:
        venue = Venue.objects.get(id=venue_id)
    except Venue.DoesNotExist:
        return {'error': 'Venue not found'}
    
    # Get all slots in the date range
    slots = VenueSlot.objects.filter(
        venue=venue,
        starts_at__lt=to_date,
        ends_at__gt=from_date
    ).order_by('starts_at')
    
    # Separate available and blocked slots
    available_slots = []
    blocked_slots = []
    
    for slot in slots:
        slot_data = {
            'id': slot.id,
            'starts_at': slot.starts_at,
            'ends_at': slot.ends_at,
            'status': slot.status,
            'reason': slot.reason,
            'duration_minutes': slot.duration_minutes,
        }
        
        if slot.status == VenueSlot.Status.AVAILABLE:
            available_slots.append(slot_data)
        else:
            blocked_slots.append(slot_data)
    
    return {
        'venue_id': venue_id,
        'venue_name': venue.name,
        'from_date': from_date,
        'to_date': to_date,
        'available_slots': available_slots,
        'blocked_slots': blocked_slots,
        'total_slots': len(slots),
    }


def merge_overlapping_slots(venue_id: int) -> int:
    """
    Merge overlapping slots of the same status for a venue.
    
    Args:
        venue_id: ID of the venue to process
    
    Returns:
        Number of slots merged
    """
    try:
        venue = Venue.objects.get(id=venue_id)
    except Venue.DoesNotExist:
        return 0
    
    # Get all slots ordered by start time
    slots = list(VenueSlot.objects.filter(venue=venue).order_by('starts_at', 'status'))
    
    if not slots:
        return 0
    
    merged_count = 0
    i = 0
    
    while i < len(slots) - 1:
        current_slot = slots[i]
        next_slot = slots[i + 1]
        
        # Check if slots can be merged (same status and overlapping/adjacent)
        if (current_slot.status == next_slot.status and
            current_slot.ends_at >= next_slot.starts_at):
            
            # Merge slots
            current_slot.ends_at = max(current_slot.ends_at, next_slot.starts_at)
            current_slot.save()
            
            # Remove the next slot
            next_slot.delete()
            slots.pop(i + 1)
            merged_count += 1
        else:
            i += 1
    
    return merged_count


def create_availability_slots(
    venue_id: int,
    slots_data: List[Dict[str, Any]]
) -> List[VenueSlot]:
    """
    Create multiple availability slots for a venue.
    
    Args:
        venue_id: ID of the venue
        slots_data: List of slot data dictionaries
    
    Returns:
        List of created VenueSlot instances
    """
    try:
        venue = Venue.objects.get(id=venue_id)
    except Venue.DoesNotExist:
        raise ValueError(f"Venue with id {venue_id} not found")
    
    created_slots = []
    
    for slot_data in slots_data:
        slot = VenueSlot.objects.create(
            venue=venue,
            starts_at=slot_data['starts_at'],
            ends_at=slot_data['ends_at'],
            status=slot_data.get('status', VenueSlot.Status.AVAILABLE),
            reason=slot_data.get('reason', '')
        )
        created_slots.append(slot)
    
    return created_slots


def get_venue_bookings(
    from_date: timezone.datetime,
    to_date: timezone.datetime
) -> Dict[str, Any]:
    """
    Get all venue bookings (fixtures and venue slots) in a date range.
    
    Args:
        from_date: Start of the date range
        to_date: End of the date range
    
    Returns:
        Dictionary with booking information
    """
    from fixtures.models import Fixture
    
    # Get fixture bookings
    fixtures = Fixture.objects.filter(
        venue__isnull=False,
        start_at__lt=to_date,
        start_at__gte=from_date
    ).select_related('venue', 'home', 'away', 'event').order_by('start_at')
    
    # Get venue slot bookings
    venue_slots = VenueSlot.objects.filter(
        starts_at__lt=to_date,
        ends_at__gt=from_date
    ).select_related('venue').order_by('starts_at')
    
    # Format fixture bookings
    fixture_bookings = []
    for fixture in fixtures:
        fixture_bookings.append({
            'type': 'fixture',
            'id': fixture.id,
            'venue_id': fixture.venue.id,
            'venue_name': fixture.venue.name,
            'starts_at': fixture.start_at,
            'ends_at': fixture.start_at + timezone.timedelta(hours=2),  # Assume 2-hour duration
            'home_team': fixture.home.name if fixture.home else 'TBD',
            'away_team': fixture.away.name if fixture.away else 'TBD',
            'event_name': fixture.event.name,
            'status': fixture.status,
            'round': fixture.round,
            'phase': fixture.phase
        })
    
    # Format venue slot bookings
    slot_bookings = []
    for slot in venue_slots:
        slot_bookings.append({
            'type': 'venue_slot',
            'id': slot.id,
            'venue_id': slot.venue.id,
            'venue_name': slot.venue.name,
            'starts_at': slot.starts_at,
            'ends_at': slot.ends_at,
            'status': slot.status,
            'reason': slot.reason
        })
    
    # Combine and sort all bookings
    all_bookings = fixture_bookings + slot_bookings
    all_bookings.sort(key=lambda x: x['starts_at'])
    
    return {
        'from_date': from_date,
        'to_date': to_date,
        'bookings': all_bookings,
        'fixture_count': len(fixture_bookings),
        'slot_count': len(slot_bookings),
        'total_count': len(all_bookings)
    }


def get_venue_bookings(
    venue_id: int,
    from_date: timezone.datetime,
    to_date: timezone.datetime
) -> List[Dict[str, Any]]:
    """
    Get venue bookings for a date range.
    
    Args:
        venue_id: ID of the venue to check
        from_date: Start of the date range
        to_date: End of the date range
    
    Returns:
        List of booking dictionaries
    """
    try:
        venue = Venue.objects.get(id=venue_id)
    except Venue.DoesNotExist:
        return []
    
    # Get all slots in the date range
    slots = VenueSlot.objects.filter(
        venue=venue,
        starts_at__lt=to_date,
        ends_at__gt=from_date
    ).order_by('starts_at')
    
    bookings = []
    for slot in slots:
        bookings.append({
            'id': slot.id,
            'starts_at': slot.starts_at,
            'ends_at': slot.ends_at,
            'status': slot.status,
            'reason': slot.reason,
            'duration_minutes': slot.duration_minutes,
        })
    
    return bookings


def validate_slot_data(slot_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate slot data before creation/update.
    
    Args:
        slot_data: Dictionary containing slot data
    
    Returns:
        Dictionary with validation results
    """
    errors = {}
    
    starts_at = slot_data.get('starts_at')
    ends_at = slot_data.get('ends_at')
    status = slot_data.get('status', VenueSlot.Status.AVAILABLE)
    reason = slot_data.get('reason', '')
    
    # Validate datetime fields
    if not starts_at:
        errors['starts_at'] = 'Start time is required'
    elif not isinstance(starts_at, timezone.datetime):
        errors['starts_at'] = 'Start time must be a valid datetime'
    
    if not ends_at:
        errors['ends_at'] = 'End time is required'
    elif not isinstance(ends_at, timezone.datetime):
        errors['ends_at'] = 'End time must be a valid datetime'
    
    # Validate time order
    if starts_at and ends_at and ends_at <= starts_at:
        errors['ends_at'] = 'End time must be after start time'
    
    # Validate status
    if status not in [choice[0] for choice in VenueSlot.Status.choices]:
        errors['status'] = f'Status must be one of: {[choice[0] for choice in VenueSlot.Status.choices]}'
    
    # Validate reason for blocked slots
    if status == VenueSlot.Status.BLOCKED and not reason:
        errors['reason'] = 'Blocked slots must have a reason'
    
    return {
        'is_valid': len(errors) == 0,
        'errors': errors
    }
