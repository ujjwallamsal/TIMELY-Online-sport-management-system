# venues/services.py
from django.db.models import Q
from django.utils import timezone
from .models import Venue, VenueSlot


def find_conflicts(venue_id, starts_at, ends_at, exclude_slot_id=None):
    """
    Find conflicts for a proposed venue slot.
    
    Args:
        venue_id: ID of the venue
        starts_at: Proposed start time
        ends_at: Proposed end time
        exclude_slot_id: ID of slot to exclude from conflict check (for updates)
    
    Returns:
        List of conflicting slots
    """
    # Build query for overlapping slots
    query = Q(
        venue_id=venue_id,
        starts_at__lt=ends_at,
        ends_at__gt=starts_at
    )
    
    # Exclude specific slot if provided (for updates)
    if exclude_slot_id:
        query &= ~Q(id=exclude_slot_id)
    
    # Get conflicting slots
    conflicts = VenueSlot.objects.filter(query).select_related('venue')
    
    return [
        {
            'id': slot.id,
            'venue_id': slot.venue_id,
            'venue_name': slot.venue.name,
            'starts_at': slot.starts_at.isoformat(),
            'ends_at': slot.ends_at.isoformat(),
            'status': slot.status,
            'reason': slot.reason
        }
        for slot in conflicts
    ]


def check_availability(venue_id, from_date, to_date):
    """
    Check venue availability for a date range.
    
    Args:
        venue_id: ID of the venue
        from_date: Start of availability window
        to_date: End of availability window
    
    Returns:
        Dict with availability data or error
    """
    try:
        venue = Venue.objects.get(id=venue_id)
    except Venue.DoesNotExist:
        return {'error': 'Venue not found'}
    
    # Get all slots in the date range
    slots = VenueSlot.objects.filter(
        venue_id=venue_id,
        starts_at__lt=to_date,
        ends_at__gt=from_date
    ).order_by('starts_at')
    
    # Calculate availability
    available_slots = []
    blocked_slots = []
    
    for slot in slots:
        slot_data = {
            'id': slot.id,
            'starts_at': slot.starts_at.isoformat(),
            'ends_at': slot.ends_at.isoformat(),
            'duration_minutes': slot.duration_minutes,
            'reason': slot.reason
        }
        
        if slot.status == VenueSlot.Status.AVAILABLE:
            available_slots.append(slot_data)
        else:
            blocked_slots.append(slot_data)
    
    return {
        'venue_id': venue_id,
        'venue_name': venue.name,
        'from_date': from_date.isoformat(),
        'to_date': to_date.isoformat(),
        'available_slots': available_slots,
        'blocked_slots': blocked_slots,
        'total_available': len(available_slots),
        'total_blocked': len(blocked_slots)
    }


def validate_slot_data(slot_data):
    """
    Validate slot data before creation.
    
    Args:
        slot_data: Dict with slot data
    
    Returns:
        Dict with validation result
    """
    errors = []
    
    # Check required fields
    required_fields = ['starts_at', 'ends_at']
    for field in required_fields:
        if field not in slot_data:
            errors.append(f'{field} is required')
    
    if errors:
        return {'is_valid': False, 'errors': errors}
    
    # Validate datetime format
    try:
        starts_at = timezone.datetime.fromisoformat(
            slot_data['starts_at'].replace('Z', '+00:00')
        )
        ends_at = timezone.datetime.fromisoformat(
            slot_data['ends_at'].replace('Z', '+00:00')
        )
    except (ValueError, AttributeError):
        errors.append('Invalid datetime format. Use ISO format.')
        return {'is_valid': False, 'errors': errors}
    
    # Validate time order
    if ends_at <= starts_at:
        errors.append('End time must be after start time')
    
    # Validate slot duration (max 24 hours)
    duration = ends_at - starts_at
    if duration.total_seconds() > 24 * 3600:
        errors.append('Slot duration cannot exceed 24 hours')
    
    # Validate slot is not in the past
    now = timezone.now()
    if starts_at < now:
        errors.append('Slot cannot be in the past')
    
    return {'is_valid': len(errors) == 0, 'errors': errors}


def create_availability_slots(venue_id, slots_data):
    """
    Create multiple availability slots for a venue.
    
    Args:
        venue_id: ID of the venue
        slots_data: List of slot data dicts
    
    Returns:
        Dict with creation results
    """
    try:
        venue = Venue.objects.get(id=venue_id)
    except Venue.DoesNotExist:
        return {'error': 'Venue not found'}
    
    created_slots = []
    errors = []
    
    for i, slot_data in enumerate(slots_data):
        # Validate slot data
        validation = validate_slot_data(slot_data)
        if not validation['is_valid']:
            errors.append({
                'index': i,
                'errors': validation['errors']
            })
            continue
        
        # Check for conflicts
        starts_at = timezone.datetime.fromisoformat(
            slot_data['starts_at'].replace('Z', '+00:00')
        )
        ends_at = timezone.datetime.fromisoformat(
            slot_data['ends_at'].replace('Z', '+00:00')
        )
        
        conflicts = find_conflicts(venue_id, starts_at, ends_at)
        if conflicts:
            errors.append({
                'index': i,
                'error': 'Slot conflicts with existing slots',
                'conflicts': conflicts
            })
            continue
        
        # Create slot
        try:
            slot = VenueSlot.objects.create(
                venue=venue,
                starts_at=starts_at,
                ends_at=ends_at,
                status=slot_data.get('status', VenueSlot.Status.AVAILABLE),
                reason=slot_data.get('reason', '')
            )
            created_slots.append({
                'id': slot.id,
                'starts_at': slot.starts_at.isoformat(),
                'ends_at': slot.ends_at.isoformat(),
                'status': slot.status
            })
        except Exception as e:
            errors.append({
                'index': i,
                'error': str(e)
            })
    
    return {
        'created_slots': created_slots,
        'errors': errors,
        'success_count': len(created_slots),
        'error_count': len(errors)
    }