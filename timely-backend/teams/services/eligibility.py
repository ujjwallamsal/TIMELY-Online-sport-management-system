# teams/services/eligibility.py
from typing import Dict, List, Tuple
from datetime import date
from django.utils import timezone
from ..models import Team, TeamMember, TeamEventEntry


class EligibilityChecker:
    """Service for checking team eligibility for events/divisions"""
    
    # Configuration constants
    MIN_ROSTER_SIZE = 1
    MAX_ROSTER_SIZE = 30
    
    @classmethod
    def check_team_eligibility(cls, team_id: int, event_id: int, division_id: int = None) -> Dict:
        """
        Check if a team is eligible for an event/division.
        
        Returns:
            Dict with 'eligible' (bool) and 'reasons' (list of strings)
        """
        try:
            team = Team.objects.get(id=team_id)
        except Team.DoesNotExist:
            return {
                'eligible': False,
                'reasons': ['Team not found']
            }
        
        try:
            from events.models import Event
            event = Event.objects.get(id=event_id)
        except:
            return {
                'eligible': False,
                'reasons': ['Event not found']
            }
        
        reasons = []
        eligible = True
        
        # Check sport match
        if not cls._check_sport_match(team, event):
            reasons.append(f"Team sport '{team.sport}' does not match event sport")
            eligible = False
        
        # Check roster size
        roster_check = cls._check_roster_size(team)
        if not roster_check['eligible']:
            reasons.extend(roster_check['reasons'])
            eligible = False
        
        # Check age requirements if division specified
        if division_id:
            age_check = cls._check_age_requirements(team, division_id)
            if not age_check['eligible']:
                reasons.extend(age_check['reasons'])
                eligible = False
        
        # Check if team already has an entry for this event/division
        existing_entry = cls._check_existing_entry(team, event, division_id)
        if existing_entry:
            reasons.append(f"Team already has an entry for this event/division")
            eligible = False
        
        return {
            'eligible': eligible,
            'reasons': reasons
        }
    
    @classmethod
    def _check_sport_match(cls, team: Team, event) -> bool:
        """Check if team sport matches event sport"""
        # Simple sport matching - can be enhanced with sport aliases
        return team.sport.lower() == getattr(event, 'sport_type', '').lower()
    
    @classmethod
    def _check_roster_size(cls, team: Team) -> Dict:
        """Check if team has valid roster size"""
        active_members = team.members.filter(status=TeamMember.Status.ACTIVE).count()
        
        reasons = []
        eligible = True
        
        if active_members < cls.MIN_ROSTER_SIZE:
            reasons.append(f"Team has {active_members} active members, minimum required is {cls.MIN_ROSTER_SIZE}")
            eligible = False
        
        if active_members > cls.MAX_ROSTER_SIZE:
            reasons.append(f"Team has {active_members} active members, maximum allowed is {cls.MAX_ROSTER_SIZE}")
            eligible = False
        
        return {
            'eligible': eligible,
            'reasons': reasons
        }
    
    @classmethod
    def _check_age_requirements(cls, team: Team, division_id: int) -> Dict:
        """Check if team members meet age requirements for division"""
        try:
            from events.models import Division
            division = Division.objects.get(id=division_id)
        except:
            return {
                'eligible': True,  # If division not found, don't block
                'reasons': []
            }
        
        reasons = []
        eligible = True
        
        # Get age requirements from division (assuming these fields exist)
        min_age = getattr(division, 'min_age', None)
        max_age = getattr(division, 'max_age', None)
        
        if not min_age and not max_age:
            return {'eligible': True, 'reasons': []}
        
        today = date.today()
        active_members = team.members.filter(status=TeamMember.Status.ACTIVE)
        
        for member in active_members:
            if not member.date_of_birth:
                reasons.append(f"Member '{member.full_name}' missing date of birth")
                eligible = False
                continue
            
            age = today.year - member.date_of_birth.year
            if (today.month, today.day) < (member.date_of_birth.month, member.date_of_birth.day):
                age -= 1
            
            if min_age and age < min_age:
                reasons.append(f"Member '{member.full_name}' is {age} years old, minimum age is {min_age}")
                eligible = False
            
            if max_age and age > max_age:
                reasons.append(f"Member '{member.full_name}' is {age} years old, maximum age is {max_age}")
                eligible = False
        
        return {
            'eligible': eligible,
            'reasons': reasons
        }
    
    @classmethod
    def _check_existing_entry(cls, team: Team, event, division_id: int = None) -> bool:
        """Check if team already has an entry for this event/division"""
        existing_entries = TeamEventEntry.objects.filter(
            team=team,
            event=event,
            division_id=division_id,
            status__in=[TeamEventEntry.Status.PENDING, TeamEventEntry.Status.APPROVED]
        )
        return existing_entries.exists()
    
    @classmethod
    def get_team_roster_summary(cls, team_id: int) -> Dict:
        """Get summary of team roster for eligibility purposes"""
        try:
            team = Team.objects.get(id=team_id)
        except Team.DoesNotExist:
            return {'error': 'Team not found'}
        
        active_members = team.members.filter(status=TeamMember.Status.ACTIVE)
        
        return {
            'team_id': team.id,
            'team_name': team.name,
            'sport': team.sport,
            'total_members': active_members.count(),
            'members_with_dob': active_members.filter(date_of_birth__isnull=False).count(),
            'members_missing_dob': active_members.filter(date_of_birth__isnull=True).count(),
            'eligible_for_roster_size': cls.MIN_ROSTER_SIZE <= active_members.count() <= cls.MAX_ROSTER_SIZE
        }
