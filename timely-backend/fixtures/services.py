# fixtures/services.py
from __future__ import annotations

import random
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError

from .models import Fixture, FixtureEntry
from venues.models import Venue
from teams.models import Team
from registrations.models import Registration


class FixtureGenerator:
    """Service class for generating tournament fixtures"""
    
    def __init__(self, fixture: Fixture):
        self.fixture = fixture
        self.venues = list(fixture.venues.all())
        self.teams = list(fixture.get_available_teams())
        self.individuals = list(fixture.get_available_individuals())
        self.participants = self._get_participants()
        
    def _get_participants(self) -> List[Dict]:
        """Get all participants (teams and individuals)"""
        participants = []
        
        # Add teams
        for team_reg in self.teams:
            participants.append({
                'type': 'TEAM',
                'id': team_reg.team.id,
                'name': team_reg.team.name,
                'registration': team_reg,
                'seed': team_reg.seed if hasattr(team_reg, 'seed') else None
            })
        
        # Add individuals
        for ind_reg in self.individuals:
            participants.append({
                'type': 'INDIVIDUAL',
                'id': ind_reg.id,
                'name': ind_reg.user.get_full_name(),
                'registration': ind_reg,
                'seed': ind_reg.seed if hasattr(ind_reg, 'seed') else None
            })
        
        return participants
    
    def generate_round_robin(self, rounds: int = 1, randomize_seeds: bool = False) -> List[Match]:
        """Generate Round Robin tournament"""
        if len(self.participants) < 2:
            raise ValidationError("Need at least 2 participants for Round Robin")
        
        # Handle odd number of participants with bye
        if len(self.participants) % 2 == 1:
            self.participants.append({
                'type': 'BYE',
                'id': None,
                'name': 'Bye',
                'registration': None,
                'seed': None
            })
        
        # Create rounds
        matches = []
        num_participants = len(self.participants)
        
        for round_num in range(rounds):
            # Rotate participants for each round (except first)
            if round_num > 0 and randomize_seeds:
                # Randomize order for variety
                random.shuffle(self.participants[1:])
            
            # Generate matches for this round
            round_matches = self._generate_round_robin_round(
                round_num + 1, 
                self.participants, 
                num_participants
            )
            matches.extend(round_matches)
        
        return matches
    
    def _generate_round_robin_round(self, round_num: int, participants: List, num_participants: int) -> List[Match]:
        """Generate matches for a single round"""
        matches = []
        half_size = num_participants // 2
        
        for i in range(half_size):
            home_idx = i
            away_idx = num_participants - 1 - i
            
            # Skip matches with bye
            if (participants[home_idx]['type'] == 'BYE' or 
                participants[away_idx]['type'] == 'BYE'):
                continue
            
            match = self._create_match(
                round_num=round_num,
                match_number=i + 1,
                home_participant=participants[home_idx],
                away_participant=participants[away_idx]
            )
            matches.append(match)
        
        return matches
    
    def generate_knockout(self, seed_teams: bool = False, include_playoffs: bool = False) -> List[Match]:
        """Generate Knockout tournament"""
        if len(self.participants) < 2:
            raise ValidationError("Need at least 2 participants for Knockout")
        
        # Sort by seed if requested
        if seed_teams:
            self.participants.sort(key=lambda x: x['seed'] or 999)
        
        # Calculate rounds needed
        num_participants = len(self.participants)
        rounds = (num_participants - 1).bit_length()
        total_slots = 2 ** rounds
        
        # Add byes to fill empty slots
        while len(self.participants) < total_slots:
            self.participants.append({
                'type': 'BYE',
                'id': None,
                'name': 'Bye',
                'registration': None,
                'seed': None
            })
        
        matches = []
        match_number = 1
        
        # Generate first round
        first_round_matches = self._generate_knockout_first_round(rounds, match_number)
        matches.extend(first_round_matches)
        match_number += len(first_round_matches)
        
        # Generate subsequent rounds
        for round_num in range(2, rounds + 1):
            round_matches = self._generate_knockout_round(round_num, match_number)
            matches.extend(round_matches)
            match_number += len(round_matches)
        
        # Add playoff matches if requested
        if include_playoffs:
            playoff_matches = self._generate_playoff_matches(rounds + 1, match_number)
            matches.extend(playoff_matches)
        
        return matches
    
    def _generate_knockout_first_round(self, rounds: int, start_match_number: int) -> List[Match]:
        """Generate first round of knockout tournament"""
        matches = []
        total_slots = 2 ** rounds
        half_slots = total_slots // 2
        
        for i in range(half_slots):
            home_idx = i
            away_idx = total_slots - 1 - i
            
            match = self._create_match(
                round_num=1,
                match_number=start_match_number + i,
                home_participant=self.participants[home_idx],
                away_participant=self.participants[away_idx]
            )
            matches.append(match)
        
        return matches
    
    def _generate_knockout_round(self, round_num: int, start_match_number: int) -> List[Match]:
        """Generate subsequent rounds of knockout tournament"""
        matches = []
        matches_in_round = 2 ** (round_num - 1)
        
        for i in range(matches_in_round):
            match = self._create_match(
                round_num=round_num,
                match_number=start_match_number + i,
                home_participant=None,  # Will be filled when previous matches complete
                away_participant=None
            )
            matches.append(match)
        
        return matches
    
    def _generate_playoff_matches(self, round_num: int, start_match_number: int) -> List[Match]:
        """Generate playoff matches for 3rd/4th place etc."""
        matches = []
        
        # 3rd place playoff
        third_place_match = self._create_match(
            round_num=round_num,
            match_number=start_match_number,
            home_participant=None,
            away_participant=None
        )
        matches.append(third_place_match)
        
        return matches
    
    def generate_group_stage(self, group_size: int, teams_per_group: int) -> List[Match]:
        """Generate Group Stage + Knockout tournament"""
        if len(self.participants) < group_size * teams_per_group:
            raise ValidationError(f"Not enough participants for {group_size} groups of {teams_per_group} teams")
        
        matches = []
        match_number = 1
        
        # Create groups
        groups = self._create_groups(group_size, teams_per_group)
        
        # Generate group stage matches
        for group_idx, group in enumerate(groups):
            group_matches = self._generate_group_matches(
                group_idx + 1, 
                group, 
                match_number
            )
            matches.extend(group_matches)
            match_number += len(group_matches)
        
        # Generate knockout stage
        knockout_matches = self._generate_knockout_from_groups(groups, match_number)
        matches.extend(knockout_matches)
        
        return matches
    
    def _create_groups(self, group_size: int, teams_per_group: int) -> List[List[Dict]]:
        """Create groups of participants"""
        groups = []
        participants_copy = self.participants.copy()
        
        # Randomize participants for group assignment
        random.shuffle(participants_copy)
        
        for i in range(group_size):
            group = participants_copy[i * teams_per_group:(i + 1) * teams_per_group]
            groups.append(group)
        
        return groups
    
    def _generate_group_matches(self, group_num: int, group: List[Dict], start_match_number: int) -> List[Match]:
        """Generate matches within a group"""
        matches = []
        match_number = start_match_number
        
        # Round robin within group
        for i in range(len(group)):
            for j in range(i + 1, len(group)):
                match = self._create_match(
                    round_num=group_num,  # Use group number as round
                    match_number=match_number,
                    home_participant=group[i],
                    away_participant=group[j]
                )
                matches.append(match)
                match_number += 1
        
        return matches
    
    def _generate_knockout_from_groups(self, groups: List[List[Dict]], start_match_number: int) -> List[Match]:
        """Generate knockout stage from group winners"""
        # Get group winners (simplified - could be based on group results)
        winners = []
        for group in groups:
            if group:
                winners.append(group[0])  # First team in group
        
        # Generate knockout with winners
        knockout_generator = FixtureGenerator(self.fixture)
        knockout_generator.participants = winners
        return knockout_generator.generate_knockout(seed_teams=True)
    
    def _create_match(self, round_num: int, match_number: int, 
                     home_participant: Optional[Dict], 
                     away_participant: Optional[Dict]) -> Match:
        """Create a match with participants"""
        # Calculate scheduled time
        scheduled_at = self._calculate_match_time(round_num, match_number)
        
        # Assign venue
        venue = self._assign_venue(scheduled_at)
        
        # Create match
        match = Match.objects.create(
            fixture=self.fixture,
            round_number=round_num,
            match_number=match_number,
            venue=venue,
            scheduled_at=scheduled_at,
            status=Match.Status.SCHEDULED,
            is_published=False
        )
        
        # Create match entries
        if home_participant and home_participant['type'] != 'BYE':
            self._create_match_entry(match, home_participant, 'HOME')
        
        if away_participant and away_participant['type'] != 'BYE':
            self._create_match_entry(match, away_participant, 'AWAY')
        
        return match
    
    def _create_match_entry(self, match: Match, participant: Dict, position: str):
        """Create a match entry for a participant"""
        if participant['type'] == 'TEAM':
            MatchEntry.objects.create(
                fixture=self.fixture,
                match=match,
                entry_type=MatchEntry.EntryType.TEAM,
                team_id=participant['id'],
                position=position,
                seed=participant['seed']
            )
        elif participant['type'] == 'INDIVIDUAL':
            MatchEntry.objects.create(
                fixture=self.fixture,
                match=match,
                entry_type=MatchEntry.EntryType.INDIVIDUAL,
                individual_registration=participant['registration'],
                position=position,
                seed=participant['seed']
            )
    
    def _calculate_match_time(self, round_num: int, match_number: int) -> datetime:
        """Calculate scheduled time for a match"""
        # Start from fixture start date
        current_date = self.fixture.start_date
        
        # Calculate day offset based on round and match
        day_offset = (round_num - 1) + ((match_number - 1) // self.fixture.max_matches_per_venue_per_day)
        current_date += timedelta(days=day_offset)
        
        # Calculate time within day
        matches_in_day = (match_number - 1) % self.fixture.max_matches_per_venue_per_day
        start_hour = self.fixture.earliest_start_time.hour
        start_minute = self.fixture.earliest_start_time.minute
        
        # Add time for previous matches and breaks
        total_minutes = matches_in_day * (
            self.fixture.match_duration_minutes + self.fixture.break_between_matches_minutes
        )
        
        start_hour += total_minutes // 60
        start_minute += total_minutes % 60
        
        if start_minute >= 60:
            start_hour += start_minute // 60
            start_minute = start_minute % 60
        
        # Ensure time is within constraints
        if start_hour > self.fixture.latest_end_time.hour:
            # Move to next day
            current_date += timedelta(days=1)
            start_hour = self.fixture.earliest_start_time.hour
            start_minute = self.fixture.earliest_start_time.minute
        
        return datetime.combine(current_date, 
                               datetime.min.time().replace(hour=start_hour, minute=start_minute))
    
    def _assign_venue(self, scheduled_at: datetime) -> Venue:
        """Assign venue to match based on availability"""
        if not self.venues:
            return None
        
        # Find venue with least conflicts
        best_venue = None
        min_conflicts = float('inf')
        
        for venue in self.venues:
            conflicts = Match.objects.filter(
                venue=venue,
                scheduled_at__lt=scheduled_at + timedelta(minutes=self.fixture.match_duration_minutes),
                scheduled_at__gt=scheduled_at - timedelta(minutes=self.fixture.break_between_matches_minutes),
                status__in=[Match.Status.SCHEDULED, Match.Status.LIVE]
            ).count()
            
            if conflicts < min_conflicts:
                min_conflicts = conflicts
                best_venue = venue
        
        return best_venue


class FixtureConflictChecker:
    """Service for checking and resolving fixture conflicts"""
    
    @staticmethod
    def check_venue_conflicts(match: Match) -> List[Match]:
        """Check for venue conflicts with a match"""
        if not match.venue or not match.scheduled_at:
            return []
        
        conflicting_matches = Match.objects.filter(
            venue=match.venue,
            scheduled_at__lt=match.end_time,
            scheduled_at__gt=match.scheduled_at - timedelta(minutes=match.fixture.break_between_matches_minutes),
            status__in=[Match.Status.SCHEDULED, Match.Status.LIVE],
            id__ne=match.id
        )
        
        return list(conflicting_matches)
    
    @staticmethod
    def check_participant_conflicts(match: Match) -> List[Match]:
        """Check for participant conflicts (double-booking)"""
        if not match.scheduled_at:
            return []
        
        participant_ids = []
        for entry in match.entries.all():
            if entry.entry_type == MatchEntry.EntryType.TEAM:
                participant_ids.append(f"team_{entry.team.id}")
            elif entry.entry_type == MatchEntry.EntryType.INDIVIDUAL:
                participant_ids.append(f"individual_{entry.individual_registration.id}")
        
        conflicting_matches = []
        for entry in match.entries.all():
            if entry.entry_type == MatchEntry.EntryType.TEAM:
                conflicts = Match.objects.filter(
                    entries__team=entry.team,
                    scheduled_at__lt=match.end_time,
                    scheduled_at__gt=match.scheduled_at - timedelta(minutes=match.fixture.break_between_matches_minutes),
                    status__in=[Match.Status.SCHEDULED, Match.Status.LIVE],
                    id__ne=match.id
                )
                conflicting_matches.extend(conflicts)
            
            elif entry.entry_type == MatchEntry.EntryType.INDIVIDUAL:
                conflicts = Match.objects.filter(
                    entries__individual_registration=entry.individual_registration,
                    scheduled_at__lt=match.end_time,
                    scheduled_at__gt=match.scheduled_at - timedelta(minutes=match.fixture.break_between_matches_minutes),
                    status__in=[Match.Status.SCHEDULED, Match.Status.LIVE],
                    id__ne=match.id
                )
                conflicting_matches.extend(conflicts)
        
        return list(set(conflicting_matches))
    
    @staticmethod
    def suggest_reschedule_time(match: Match, reason: str = "") -> List[datetime]:
        """Suggest alternative times for a conflicted match"""
        if not match.venue:
            return []
        
        suggestions = []
        current_time = match.scheduled_at
        
        # Try different times on the same day
        for hour_offset in [1, 2, 3, -1, -2, -3]:
            new_time = current_time + timedelta(hours=hour_offset)
            
            # Check if new time is within venue constraints
            if (new_time.time() >= match.fixture.earliest_start_time and
                new_time.time() <= match.fixture.latest_end_time):
                
                # Check for conflicts at new time
                temp_match = Match(
                    venue=match.venue,
                    scheduled_at=new_time,
                    fixture=match.fixture
                )
                
                if not FixtureConflictChecker.check_venue_conflicts(temp_match):
                    suggestions.append(new_time)
        
        # Try next few days
        for day_offset in [1, 2, 3]:
            new_date = current_time.date() + timedelta(days=day_offset)
            new_time = datetime.combine(new_date, match.fixture.earliest_start_time)
            
            temp_match = Match(
                venue=match.venue,
                scheduled_at=new_time,
                fixture=match.fixture
            )
            
            if not FixtureConflictChecker.check_venue_conflicts(temp_match):
                suggestions.append(new_time)
        
        return suggestions[:5]  # Return top 5 suggestions
