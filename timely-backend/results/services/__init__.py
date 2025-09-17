# results/services/__init__.py
from .compute import (
    StandingsComputer,
    recompute_event_standings,
    get_leaderboard_summary
)

def compute_event_leaderboard(event_id: int):
    """Alias for recompute_event_standings for backward compatibility"""
    return recompute_event_standings(event_id)
