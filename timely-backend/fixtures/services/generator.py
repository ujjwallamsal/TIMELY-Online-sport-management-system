# fixtures/services/generator.py
from __future__ import annotations

import random
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError

from ..models import Fixture
from venues.models import Venue
from teams.models import Team
from registrations.models import Registration


def generate_round_robin(teams: List[int], event_id: int, start_date: datetime = None, venues: List[int] = None) -> List[Dict]:
    """
    Generate round-robin fixtures for teams
    
    Args:
        teams: List of team IDs
        event_id: Event ID
        start_date: Start date for fixtures (defaults to now + 1 day)
        venues: List of venue IDs to use
    
    Returns:
        List of fixture dictionaries
    """
    if len(teams) < 2:
        raise ValidationError("Need at least 2 teams for round-robin")
    
    # Handle odd number of teams
    if len(teams) % 2 == 1:
        teams = teams + [None]  # Add bye
    
    # Default start date
    if not start_date:
        start_date = timezone.now() + timedelta(days=1)
    
    # Get venues
    if venues:
        venue_objects = Venue.objects.filter(id__in=venues)
    else:
        venue_objects = Venue.objects.all()[:3]  # Default to first 3 venues
    
    if not venue_objects.exists():
        raise ValidationError("No venues available")
    
    venue_list = list(venue_objects)
    
    fixtures = []
    num_teams = len(teams)
    rounds = num_teams - 1
    
    for round_num in range(rounds):
        # Generate matches for this round
        for i in range(num_teams // 2):
            home_idx = i
            away_idx = num_teams - 1 - i
            
            # Skip if either team is bye
            if teams[home_idx] is None or teams[away_idx] is None:
                continue
            
            # Calculate match time
            match_date = start_date + timedelta(days=round_num)
            match_time = match_date.replace(hour=10 + (i * 2), minute=0, second=0, microsecond=0)
            
            # Assign venue
            venue = venue_list[i % len(venue_list)]
            
            fixture_data = {
                'event_id': event_id,
                'round': round_num + 1,
                'phase': 'RR',
                'home_team_id': teams[home_idx],
                'away_team_id': teams[away_idx],
                'venue_id': venue.id,
                'start_at': match_time.isoformat(),
                'status': 'SCHEDULED'
            }
            
            fixtures.append(fixture_data)
        
        # Rotate teams (except first team)
        teams = [teams[0]] + teams[1:] + [teams[1]]
    
    return fixtures


def generate_knockout(teams: List[int], event_id: int, start_date: datetime = None, venues: List[int] = None) -> List[Dict]:
    """
    Generate knockout fixtures for teams
    
    Args:
        teams: List of team IDs
        event_id: Event ID
        start_date: Start date for fixtures (defaults to now + 1 day)
        venues: List of venue IDs to use
    
    Returns:
        List of fixture dictionaries
    """
    if len(teams) < 2:
        raise ValidationError("Need at least 2 teams for knockout")
    
    # Default start date
    if not start_date:
        start_date = timezone.now() + timedelta(days=1)
    
    # Get venues
    if venues:
        venue_objects = Venue.objects.filter(id__in=venues)
    else:
        venue_objects = Venue.objects.all()[:3]  # Default to first 3 venues
    
    if not venue_objects.exists():
        raise ValidationError("No venues available")
    
    venue_list = list(venue_objects)
    
    fixtures = []
    num_teams = len(teams)
    rounds = (num_teams - 1).bit_length()
    
    # Add byes to make it a power of 2
    while len(teams) < 2 ** rounds:
        teams.append(None)
    
    match_number = 1
    current_teams = teams.copy()
    
    for round_num in range(1, rounds + 1):
        matches_in_round = len(current_teams) // 2
        next_round_teams = []
        
        for match_idx in range(matches_in_round):
            home_idx = match_idx * 2
            away_idx = home_idx + 1
            
            # Calculate match time
            match_date = start_date + timedelta(days=(round_num - 1) * 2)
            match_time = match_date.replace(hour=10 + (match_idx * 3), minute=0, second=0, microsecond=0)
            
            # Assign venue
            venue = venue_list[match_idx % len(venue_list)]
            
            fixture_data = {
                'event_id': event_id,
                'round': round_num,
                'phase': 'KO',
                'home_team_id': current_teams[home_idx],
                'away_team_id': current_teams[away_idx],
                'venue_id': venue.id,
                'start_at': match_time.isoformat(),
                'status': 'SCHEDULED',
                'match_number': match_number
            }
            
            fixtures.append(fixture_data)
            match_number += 1
            
            # Add winner to next round (placeholder for now)
            next_round_teams.append(None)
        
        current_teams = next_round_teams
    
    return fixtures


def get_available_teams_for_event(event_id: int) -> List[Dict]:
    """Get available teams for an event"""
    teams = Team.objects.filter(
        event_id=event_id,
        registrations__status=Registration.Status.APPROVED
    ).distinct().values('id', 'name')
    
    return list(teams)


def validate_participants(participants: List[int], event_id: int) -> Dict:
    """Validate participant IDs for an event"""
    available_teams = get_available_teams_for_event(event_id)
    available_team_ids = [team['id'] for team in available_teams]
    
    invalid_ids = [pid for pid in participants if pid not in available_team_ids]
    
    return {
        'valid': len(invalid_ids) == 0,
        'invalid_ids': invalid_ids,
        'available_teams': available_teams
    }