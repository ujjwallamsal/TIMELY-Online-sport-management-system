# fixtures/services/generator.py
from typing import List, Dict, Any, Optional
from django.utils import timezone
from datetime import timedelta
import random
import math

from events.models import Event
from teams.models import Team
from venues.models import Venue
from django.contrib.auth import get_user_model

User = get_user_model()


def generate_round_robin(participants: List[int], slot_hints: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Generate Round-Robin fixtures.
    
    Args:
        participants: List of team IDs or user IDs
        slot_hints: Optional hints for scheduling (venue_id, starts_at, spacing_minutes)
    
    Returns:
        List of fixture proposals
    """
    if len(participants) < 2:
        raise ValueError("At least 2 participants required for Round-Robin")
    
    # Ensure even number of participants (add bye if odd)
    if len(participants) % 2 == 1:
        participants = participants + [None]  # None represents a bye
    
    n = len(participants)
    fixtures = []
    
    # Generate Round-Robin schedule
    for round_num in range(n - 1):
        round_fixtures = []
        
        # Pair participants for this round
        for i in range(n // 2):
            home_idx = i
            away_idx = n - 1 - i
            
            home_participant = participants[home_idx]
            away_participant = participants[away_idx]
            
            # Skip if either participant is a bye
            if home_participant is None or away_participant is None:
                continue
            
            round_fixtures.append({
                'round_no': round_num + 1,
                'entries': [
                    {'side': 'home', 'team_id': home_participant if isinstance(home_participant, int) else None, 'participant_id': home_participant if not isinstance(home_participant, int) else None},
                    {'side': 'away', 'team_id': away_participant if isinstance(away_participant, int) else None, 'participant_id': away_participant if not isinstance(away_participant, int) else None}
                ]
            })
        
        fixtures.extend(round_fixtures)
        
        # Rotate participants (except first one)
        participants = [participants[0]] + participants[-1:] + participants[1:-1]
    
    # Add scheduling information
    fixtures = _add_scheduling_info(fixtures, slot_hints)
    
    return fixtures


def generate_knockout(participants: List[int], slot_hints: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Generate Knockout fixtures.
    
    Args:
        participants: List of team IDs or user IDs
        slot_hints: Optional hints for scheduling (venue_id, starts_at, spacing_minutes)
    
    Returns:
        List of fixture proposals
    """
    if len(participants) < 2:
        raise ValueError("At least 2 participants required for Knockout")
    
    # Ensure power of 2 participants (add byes if needed)
    n = len(participants)
    power_of_2 = 2 ** math.ceil(math.log2(n))
    
    if n < power_of_2:
        # Add byes to make it a power of 2
        byes_needed = power_of_2 - n
        participants = participants + [None] * byes_needed
    
    fixtures = []
    current_participants = participants.copy()
    round_num = 1
    
    # Generate knockout rounds
    while len(current_participants) > 1:
        round_fixtures = []
        next_round_participants = []
        
        # Pair participants for this round
        for i in range(0, len(current_participants), 2):
            home_participant = current_participants[i]
            away_participant = current_participants[i + 1]
            
            # Skip if both participants are byes
            if home_participant is None and away_participant is None:
                next_round_participants.append(None)
                continue
            
            # If one participant is a bye, the other advances
            if home_participant is None:
                next_round_participants.append(away_participant)
                continue
            if away_participant is None:
                next_round_participants.append(home_participant)
                continue
            
            # Create fixture for this pair
            round_fixtures.append({
                'round_no': round_num,
                'entries': [
                    {'side': 'home', 'team_id': home_participant if isinstance(home_participant, int) else None, 'participant_id': home_participant if not isinstance(home_participant, int) else None},
                    {'side': 'away', 'team_id': away_participant if isinstance(away_participant, int) else None, 'participant_id': away_participant if not isinstance(away_participant, int) else None}
                ]
            })
            
            # Winner advances (placeholder for now)
            next_round_participants.append(None)
        
        fixtures.extend(round_fixtures)
        current_participants = next_round_participants
        round_num += 1
    
    # Add scheduling information
    fixtures = _add_scheduling_info(fixtures, slot_hints)
    
    return fixtures


def _add_scheduling_info(fixtures: List[Dict[str, Any]], slot_hints: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Add scheduling information to fixtures.
    
    Args:
        fixtures: List of fixture proposals
        slot_hints: Optional hints for scheduling
    
    Returns:
        Fixtures with scheduling information added
    """
    if not slot_hints:
        slot_hints = {}
    
    # Default scheduling parameters
    starts_at = slot_hints.get('starts_at', timezone.now() + timedelta(days=1))
    spacing_minutes = slot_hints.get('spacing_minutes', 60)
    venue_id = slot_hints.get('venue_id')
    
    # Add scheduling to each fixture
    for i, fixture in enumerate(fixtures):
        fixture_start = starts_at + timedelta(minutes=i * spacing_minutes)
        fixture_end = fixture_start + timedelta(minutes=spacing_minutes)
        
        fixture['starts_at'] = fixture_start.isoformat()
        fixture['ends_at'] = fixture_end.isoformat()
        fixture['venue_id'] = venue_id
    
    return fixtures


def get_available_teams_for_event(event_id: int) -> List[Dict[str, Any]]:
    """
    Get available teams for an event.
    
    Args:
        event_id: ID of the event
    
    Returns:
        List of available teams with their details
    """
    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        return []
    
    # Get teams from registrations for this event
    from registrations.models import Registration
    
    registrations = Registration.objects.filter(
        event=event,
        status=Registration.Status.APPROVED
    ).select_related('team', 'user')
    
    teams = []
    for registration in registrations:
        if registration.team:
            teams.append({
                'id': registration.team.id,
                'name': registration.team.name,
                'type': 'team'
            })
        elif registration.user:
            teams.append({
                'id': registration.user.id,
                'name': registration.user.get_full_name() or registration.user.username,
                'type': 'participant'
            })
    
    return teams


def validate_participants(participants: List[int], event_id: int) -> Dict[str, Any]:
    """
    Validate participants for fixture generation.
    
    Args:
        participants: List of participant IDs
        event_id: ID of the event
    
    Returns:
        Validation result with details
    """
    available_teams = get_available_teams_for_event(event_id)
    available_ids = [team['id'] for team in available_teams]
    
    invalid_ids = [pid for pid in participants if pid not in available_ids]
    
    return {
        'valid': len(invalid_ids) == 0,
        'invalid_ids': invalid_ids,
        'available_teams': available_teams
    }
