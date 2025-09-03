# venues/services.py
from __future__ import annotations
from typing import List, Dict, Any
from datetime import datetime
from django.utils import timezone
from django.db.models import Q
from .models import Venue, VenueAvailabilitySlot


def get_venue_conflicts(venue_id: int, start_datetime: datetime, end_datetime: datetime) -> Dict[str, Any]:
    """
    Get conflicts for a venue in a given time range.
    
    Args:
        venue_id: ID of the venue
        start_datetime: Start of the time range
        end_datetime: End of the time range
        
    Returns:
        Dictionary containing conflict information
    """
    try:
        venue = Venue.objects.get(id=venue_id)
    except Venue.DoesNotExist:
        return {"error": "Venue not found"}
    
    # Find overlapping availability slots
    overlapping_slots = VenueAvailabilitySlot.objects.filter(
        venue=venue,
        start_datetime__lt=end_datetime,
        end_datetime__gt=start_datetime
    ).order_by('start_datetime')
    
    # Find blocked/maintenance slots that conflict
    blocked_slots = overlapping_slots.filter(
        status__in=[VenueAvailabilitySlot.Status.BLOCKED, VenueAvailabilitySlot.Status.MAINTENANCE]
    )
    
    # Find available slots that would be affected
    available_slots = overlapping_slots.filter(
        status=VenueAvailabilitySlot.Status.AVAILABLE
    )
    
    # TODO: When Events have venue_id, also check for scheduled fixtures
    # This will be implemented when the Event FK is added
    
    return {
        "venue_id": venue_id,
        "venue_name": venue.name,
        "requested_period": {
            "start": start_datetime,
            "end": end_datetime
        },
        "conflicts": {
            "blocked_slots": [
                {
                    "id": slot.id,
                    "start_datetime": slot.start_datetime,
                    "end_datetime": slot.end_datetime,
                    "status": slot.status,
                    "note": slot.note
                }
                for slot in blocked_slots
            ],
            "available_slots": [
                {
                    "id": slot.id,
                    "start_datetime": slot.start_datetime,
                    "end_datetime": slot.end_datetime,
                    "note": slot.note
                }
                for slot in available_slots
            ],
            "scheduled_fixtures": []  # Will be populated when Event FK is added
        },
        "has_conflicts": blocked_slots.exists()
    }


def get_venue_availability(venue_id: int, date_from: datetime = None, date_to: datetime = None) -> Dict[str, Any]:
    """
    Get venue availability for a date range.
    
    Args:
        venue_id: ID of the venue
        date_from: Start date (defaults to now)
        date_to: End date (defaults to +30 days)
        
    Returns:
        Dictionary containing availability information
    """
    try:
        venue = Venue.objects.get(id=venue_id)
    except Venue.DoesNotExist:
        return {"error": "Venue not found"}
    
    # Default to next 30 days if no dates provided
    if not date_from:
        date_from = timezone.now()
    if not date_to:
        date_to = date_from + timezone.timedelta(days=30)
    
    # Get all availability slots in the range
    slots = VenueAvailabilitySlot.objects.filter(
        venue=venue,
        start_datetime__lt=date_to,
        end_datetime__gt=date_from
    ).order_by('start_datetime')
    
    # Group by status
    available_slots = slots.filter(status=VenueAvailabilitySlot.Status.AVAILABLE)
    blocked_slots = slots.filter(status=VenueAvailabilitySlot.Status.BLOCKED)
    maintenance_slots = slots.filter(status=VenueAvailabilitySlot.Status.MAINTENANCE)
    
    return {
        "venue_id": venue_id,
        "venue_name": venue.name,
        "period": {
            "from": date_from,
            "to": date_to
        },
        "availability": {
            "available": [
                {
                    "id": slot.id,
                    "start_datetime": slot.start_datetime,
                    "end_datetime": slot.end_datetime,
                    "note": slot.note
                }
                for slot in available_slots
            ],
            "blocked": [
                {
                    "id": slot.id,
                    "start_datetime": slot.start_datetime,
                    "end_datetime": slot.end_datetime,
                    "note": slot.note
                }
                for slot in blocked_slots
            ],
            "maintenance": [
                {
                    "id": slot.id,
                    "start_datetime": slot.start_datetime,
                    "end_datetime": slot.end_datetime,
                    "note": slot.note
                }
                for slot in maintenance_slots
            ]
        }
    }


def create_availability_slots(venue_id: int, slots_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Create multiple availability slots for a venue.
    
    Args:
        venue_id: ID of the venue
        slots_data: List of slot data dictionaries
        
    Returns:
        Dictionary containing created slots and any errors
    """
    try:
        venue = Venue.objects.get(id=venue_id)
    except Venue.DoesNotExist:
        return {"error": "Venue not found"}
    
    created_slots = []
    errors = []
    
    for i, slot_data in enumerate(slots_data):
        try:
            slot = VenueAvailabilitySlot.objects.create(
                venue=venue,
                start_datetime=slot_data['start_datetime'],
                end_datetime=slot_data['end_datetime'],
                status=slot_data.get('status', VenueAvailabilitySlot.Status.AVAILABLE),
                note=slot_data.get('note', '')
            )
            created_slots.append(slot)
        except Exception as e:
            errors.append({
                "index": i,
                "data": slot_data,
                "error": str(e)
            })
    
    return {
        "venue_id": venue_id,
        "created_slots": len(created_slots),
        "errors": errors,
        "slots": [
            {
                "id": slot.id,
                "start_datetime": slot.start_datetime,
                "end_datetime": slot.end_datetime,
                "status": slot.status,
                "note": slot.note
            }
            for slot in created_slots
        ]
    }
