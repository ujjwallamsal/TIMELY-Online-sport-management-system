# results/services/compute.py
from typing import Dict, List, Tuple, Optional
from django.db import transaction
from django.db.models import Q, F, Sum, Count
from django.utils import timezone

from events.models import Event
from teams.models import Team
from fixtures.models import Fixture
from ..models import Result, LeaderboardEntry, AthleteStat


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
                        'position': position,
                        'points': stats['points'],
                        'matches_played': stats['matches_played'],
                        'wins': stats['wins'],
                        'draws': stats['draws'],
                        'losses': stats['losses'],
                        'goals_for': stats['goals_for'],
                        'goals_against': stats['goals_against'],
                        'goal_difference': stats['goal_difference'],
                    }
                )
                leaderboard_entries.append(entry)
            
            return leaderboard_entries
    
    def _get_participating_teams(self) -> List[Team]:
        """Get all teams that have participated in fixtures for this event"""
        team_ids = set()
        
        # Get teams from fixture entries
        fixtures = Fixture.objects.filter(event=self.event)
        for fixture in fixtures:
            for entry in fixture.entries.all():
                if entry.team:
                    team_ids.add(entry.team.id)
        
        return Team.objects.filter(id__in=team_ids)
    
    def _calculate_team_stats(self, team: Team) -> Dict:
        """Calculate statistics for a specific team"""
        # Get all results for this team
        results = Result.objects.filter(
            Q(fixture__entries__team=team) & 
            Q(fixture__event=self.event) &
            Q(status=Result.Status.FINAL)
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
            is_home = result.fixture.home_team == team
            
            if is_home:
                team_score = result.score_home
                opponent_score = result.score_away
            else:
                team_score = result.score_away
                opponent_score = result.score_home
            
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


class AthleteStatsComputer:
    """Service for computing individual athlete statistics"""
    
    def __init__(self, event: Event):
        self.event = event
    
    def compute_athlete_rankings(self, metrics_key: str = 'score') -> List[AthleteStat]:
        """
        Compute athlete rankings based on a specific metric.
        Higher values are better (e.g., score, distance, etc.)
        """
        with transaction.atomic():
            # Get all athlete stats for this event
            athlete_stats = AthleteStat.objects.filter(event=self.event)
            
            # Sort by the specified metric (descending)
            sorted_stats = sorted(
                athlete_stats,
                key=lambda x: x.metrics.get(metrics_key, 0),
                reverse=True
            )
            
            # Update positions
            for position, stat in enumerate(sorted_stats, 1):
                stat.position = position
                stat.save()
            
            return sorted_stats
    
    def compute_athlete_rankings_by_time(self, metrics_key: str = 'time') -> List[AthleteStat]:
        """
        Compute athlete rankings based on time (lower is better).
        For sports like running, swimming, etc.
        """
        with transaction.atomic():
            athlete_stats = AthleteStat.objects.filter(event=self.event)
            
            # Sort by time (ascending - lower is better)
            sorted_stats = sorted(
                athlete_stats,
                key=lambda x: x.metrics.get(metrics_key, float('inf'))
            )
            
            # Update positions
            for position, stat in enumerate(sorted_stats, 1):
                stat.position = position
                stat.save()
            
            return sorted_stats


def recompute_event_standings(event_id: int) -> List[LeaderboardEntry]:
    """Convenience function to recompute standings for an event"""
    try:
        event = Event.objects.get(id=event_id)
        computer = StandingsComputer(event)
        return computer.recompute_standings()
    except Event.DoesNotExist:
        return []


def recompute_athlete_rankings(event_id: int, metrics_key: str = 'score') -> List[AthleteStat]:
    """Convenience function to recompute athlete rankings for an event"""
    try:
        event = Event.objects.get(id=event_id)
        computer = AthleteStatsComputer(event)
        return computer.compute_athlete_rankings(metrics_key)
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
                    'position': entry.position,
                    'team_name': entry.team.name,
                    'points': entry.points,
                    'matches_played': entry.matches_played,
                    'wins': entry.wins,
                    'draws': entry.draws,
                    'losses': entry.losses,
                    'goals_for': entry.goals_for,
                    'goals_against': entry.goals_against,
                    'goal_difference': entry.goal_difference,
                    'win_percentage': round(entry.win_percentage, 1),
                    'points_per_match': round(entry.points_per_match, 2),
                }
                for entry in entries
            ]
        }
    except Event.DoesNotExist:
        return {'error': 'Event not found'}
