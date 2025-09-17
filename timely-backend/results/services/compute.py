# results/services/compute.py
from typing import Dict, List, Tuple, Optional
from django.db import transaction
from django.db.models import Q, F, Sum, Count
from django.utils import timezone

from events.models import Event
from teams.models import Team
from fixtures.models import Fixture
from ..models import Result, LeaderboardEntry


class StandingsComputer:
    """Service for computing team standings and leaderboards"""
    
    WIN_POINTS = 3
    DRAW_POINTS = 1
    LOSS_POINTS = 0
    
    def __init__(self, event: Event):
        self.event = event
    
    def compute_standings(self) -> List[LeaderboardEntry]:
        """
        Compute standings for all teams in the event.
        Returns list of LeaderboardEntry objects ordered by position.
        """
        with transaction.atomic():
            # Get all teams participating in the event
            teams = self._get_participating_teams()
            
            # Calculate stats for each team
            team_stats = {}
            for team in teams:
                stats = self._calculate_team_stats(team)
                team_stats[team.id] = stats
            
            # Sort teams by standings criteria
            sorted_teams = self._sort_teams_by_standings(team_stats)
            
            # Update or create leaderboard entries
            leaderboard_entries = []
            for position, (team_id, stats) in enumerate(sorted_teams, 1):
                entry, created = LeaderboardEntry.objects.update_or_create(
                    event=self.event,
                    team_id=team_id,
                    defaults={
                        'pts': stats['points'],
                        'w': stats['wins'],
                        'd': stats['draws'],
                        'l': stats['losses'],
                        'gf': stats['goals_for'],
                        'ga': stats['goals_against'],
                        'gd': stats['goal_difference'],
                    }
                )
                leaderboard_entries.append(entry)
            
            return leaderboard_entries
    
    def _get_participating_teams(self) -> List[Team]:
        """Get all teams that have participated in fixtures for this event"""
        team_ids = set()
        
        # Get teams from fixtures
        fixtures = Fixture.objects.filter(event=self.event)
        for fixture in fixtures:
            if fixture.home:
                team_ids.add(fixture.home.id)
            if fixture.away:
                team_ids.add(fixture.away.id)
        
        return Team.objects.filter(id__in=team_ids)
    
    def _calculate_team_stats(self, team: Team) -> Dict:
        """Calculate statistics for a specific team"""
        # Get all results for this team
        results = Result.objects.filter(
            Q(fixture__home=team) | Q(fixture__away=team),
            fixture__event=self.event,
            finalized_at__isnull=False
        ).select_related('fixture')
        
        stats = {
            'points': 0,
            'matches_played': 0,
            'wins': 0,
            'draws': 0,
            'losses': 0,
            'goals_for': 0,
            'goals_against': 0,
            'goal_difference': 0,
        }
        
        for result in results:
            stats['matches_played'] += 1
            
            # Determine if team was home or away
            is_home = result.fixture.home == team
            
            if is_home:
                team_score = result.home_score
                opponent_score = result.away_score
            else:
                team_score = result.away_score
                opponent_score = result.home_score
            
            stats['goals_for'] += team_score
            stats['goals_against'] += opponent_score
            
            # Determine match outcome
            if team_score > opponent_score:
                stats['wins'] += 1
                stats['points'] += self.WIN_POINTS
            elif team_score == opponent_score:
                stats['draws'] += 1
                stats['points'] += self.DRAW_POINTS
            else:
                stats['losses'] += 1
                stats['points'] += self.LOSS_POINTS
        
        stats['goal_difference'] = stats['goals_for'] - stats['goals_against']
        
        return stats
    
    def _sort_teams_by_standings(self, team_stats: Dict) -> List[Tuple[int, Dict]]:
        """
        Sort teams by standings criteria:
        1. Points (descending)
        2. Goal difference (descending)
        3. Goals for (descending)
        4. Team name (ascending) - for consistency
        """
        def sort_key(item):
            team_id, stats = item
            return (
                -stats['points'],           # Higher points first
                -stats['goal_difference'],  # Higher goal difference first
                -stats['goals_for'],        # Higher goals for first
                team_id                     # Team ID for consistency
            )
        
        return sorted(team_stats.items(), key=sort_key)
    
    def recompute_standings(self) -> List[LeaderboardEntry]:
        """Recompute standings and return updated leaderboard"""
        return self.compute_standings()




def recompute_event_standings(event_id: int) -> List[LeaderboardEntry]:
    """Convenience function to recompute standings for an event"""
    try:
        event = Event.objects.get(id=event_id)
        computer = StandingsComputer(event)
        return computer.recompute_standings()
    except Event.DoesNotExist:
        return []




def get_leaderboard_summary(event_id: int) -> Dict:
    """Get a summary of the current leaderboard for an event"""
    try:
        event = Event.objects.get(id=event_id)
        entries = LeaderboardEntry.objects.filter(event=event).order_by('position')
        
        return {
            'event_id': event_id,
            'event_name': event.name,
            'total_teams': entries.count(),
            'total_matches': sum(entry.matches_played for entry in entries) // 2,  # Divide by 2 since each match is counted twice
            'leaderboard': [
                {
                    'team_name': entry.team.name,
                    'pts': entry.pts,
                    'matches_played': entry.matches_played,
                    'w': entry.w,
                    'd': entry.d,
                    'l': entry.l,
                    'gf': entry.gf,
                    'ga': entry.ga,
                    'gd': entry.gd,
                    'win_percentage': round(entry.win_percentage, 1),
                    'points_per_match': round(entry.points_per_match, 2),
                }
                for entry in entries
            ]
        }
    except Event.DoesNotExist:
        return {'error': 'Event not found'}
