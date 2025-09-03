# fixtures/services/scheduling.py
"""
Scheduling services for generating Round-Robin and Knockout tournaments.
Simple greedy placement algorithm for match scheduling.
"""

from __future__ import annotations
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from itertools import combinations, permutations
import math

from django.utils import timezone
from django.db import transaction

from ..models import Match
from events.models import Event, Division
from teams.models import Team


class MatchPrototype:
    """Prototype for a match to be created"""
    def __init__(self, round_no: int, sequence_no: int, team_home_id: Optional[int], 
                 team_away_id: Optional[int], starts_at: Optional[datetime] = None, 
                 venue_id: Optional[int] = None, duration_minutes: int = 60):
        self.round_no = round_no
        self.sequence_no = sequence_no
        self.team_home_id = team_home_id
        self.team_away_id = team_away_id
        self.starts_at = starts_at
        self.venue_id = venue_id
        self.duration_minutes = duration_minutes


def generate_rr(teams: List[int], rounds: int = 1, starts_at: datetime = None, 
                duration: int = 60, gap: int = 30, venue_ids: List[int] = None) -> List[MatchPrototype]:
    """
    Generate Round-Robin tournament matches.
    
    Args:
        teams: List of team IDs
        rounds: Number of rounds (default 1 for single round-robin)
        starts_at: Start time for first match
        duration: Match duration in minutes
        gap: Gap between matches in minutes
        venue_ids: List of venue IDs to distribute matches across
        
    Returns:
        List of MatchPrototype objects
    """
    if len(teams) < 2:
        return []
    
    matches = []
    current_time = starts_at or timezone.now()
    venue_index = 0
    
    # Generate all possible pairings
    team_pairs = list(combinations(teams, 2))
    
    # For multiple rounds, repeat the pairings
    for round_num in range(1, rounds + 1):
        sequence = 1
        
        for home_team, away_team in team_pairs:
            # Alternate home/away for fairness
            if round_num % 2 == 0:
                home_team, away_team = away_team, home_team
            
            # Assign venue if available
            venue_id = None
            if venue_ids:
                venue_id = venue_ids[venue_index % len(venue_ids)]
                venue_index += 1
            
            match = MatchPrototype(
                round_no=round_num,
                sequence_no=sequence,
                team_home_id=home_team,
                team_away_id=away_team,
                starts_at=current_time,
                venue_id=venue_id,
                duration_minutes=duration
            )
            matches.append(match)
            
            # Advance time for next match
            current_time += timedelta(minutes=duration + gap)
            sequence += 1
    
    return matches


def generate_ko(teams: List[int], starts_at: datetime = None, duration: int = 60, 
                gap: int = 30, venue_ids: List[int] = None) -> List[MatchPrototype]:
    """
    Generate Knockout tournament matches.
    
    Args:
        teams: List of team IDs
        starts_at: Start time for first match
        duration: Match duration in minutes
        gap: Gap between matches in minutes
        venue_ids: List of venue IDs to distribute matches across
        
    Returns:
        List of MatchPrototype objects
    """
    if len(teams) < 2:
        return []
    
    matches = []
    current_time = starts_at or timezone.now()
    venue_index = 0
    
    # Calculate bracket size (nearest power of 2)
    bracket_size = 2 ** math.ceil(math.log2(len(teams)))
    num_byes = bracket_size - len(teams)
    
    # Create initial bracket with byes
    bracket_teams = teams.copy()
    for i in range(num_byes):
        bracket_teams.append(None)  # None represents a bye
    
    # Generate matches round by round
    current_round_teams = bracket_teams.copy()
    round_num = 1
    
    while len(current_round_teams) > 1:
        next_round_teams = []
        sequence = 1
        
        # Pair teams for this round
        for i in range(0, len(current_round_teams), 2):
            home_team = current_round_teams[i]
            away_team = current_round_teams[i + 1] if i + 1 < len(current_round_teams) else None
            
            # Skip matches where one team is None (bye)
            if home_team is None and away_team is None:
                continue
            elif home_team is None:
                # Bye for away team
                next_round_teams.append(away_team)
                continue
            elif away_team is None:
                # Bye for home team
                next_round_teams.append(home_team)
                continue
            
            # Assign venue if available
            venue_id = None
            if venue_ids:
                venue_id = venue_ids[venue_index % len(venue_ids)]
                venue_index += 1
            
            match = MatchPrototype(
                round_no=round_num,
                sequence_no=sequence,
                team_home_id=home_team,
                team_away_id=away_team,
                starts_at=current_time,
                venue_id=venue_id,
                duration_minutes=duration
            )
            matches.append(match)
            
            # Advance time for next match
            current_time += timedelta(minutes=duration + gap)
            sequence += 1
            
            # Winner advances (placeholder for now)
            next_round_teams.append(home_team)
        
        current_round_teams = next_round_teams
        round_num += 1
    
    return matches


def create_matches_from_prototypes(event_id: int, division_id: Optional[int], 
                                 prototypes: List[MatchPrototype]) -> List[Match]:
    """
    Create Match objects from prototypes.
    
    Args:
        event_id: Event ID
        division_id: Division ID (optional)
        prototypes: List of MatchPrototype objects
        
    Returns:
        List of created Match objects
    """
    matches = []
    
    with transaction.atomic():
        for proto in prototypes:
            fixture = Fixture.objects.create(
                event_id=event_id,
                round_no=proto.round_no,
                starts_at=proto.starts_at,
                ends_at=proto.starts_at + timedelta(minutes=proto.duration_minutes),
                venue_id=proto.venue_id,
                status=Fixture.Status.DRAFT
            )
            matches.append(fixture)
    
    return matches


def get_available_teams_for_event(event_id: int, division_id: Optional[int] = None) -> List[int]:
    """
    Get available team IDs for an event/division.
    
    Args:
        event_id: Event ID
        division_id: Division ID (optional)
        
    Returns:
        List of team IDs
    """
    try:
        from registrations.models import Registration
        
        # Get teams from confirmed registrations
        registrations = Registration.objects.filter(
            event_id=event_id,
            status='CONFIRMED',
            registration_type='TEAM'
        )
        
        if division_id:
            registrations = registrations.filter(division_id=division_id)
        
        return [reg.team_id for reg in registrations if reg.team_id]
    
    except ImportError:
        # Fallback: get all teams if registrations not available
        return list(Team.objects.values_list('id', flat=True))
