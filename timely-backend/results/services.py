# results/services.py
from collections import defaultdict
from .models import Result, LeaderboardEntry
from fixtures.models import Fixture

def compute_event_leaderboard(event_id):
    """Compute leaderboard for an event based on results"""
    table = defaultdict(lambda: {
        "played": 0, "won": 0, "drawn": 0, "lost": 0, 
        "points": 0, "gf": 0, "ga": 0
    })
    
    # Get all results for the event
    results = Result.objects.select_related(
        "fixture", "fixture__event", "fixture__home", "fixture__away"
    ).filter(fixture__event_id=event_id)
    
    for result in results:
        if not result.fixture.home or not result.fixture.away:
            continue
            
        home_id = result.fixture.home.id
        away_id = result.fixture.away.id
        
        # Update played matches
        table[home_id]["played"] += 1
        table[away_id]["played"] += 1
        
        # Update goals
        table[home_id]["gf"] += result.home_score
        table[home_id]["ga"] += result.away_score
        table[away_id]["gf"] += result.away_score
        table[away_id]["ga"] += result.home_score
        
        # Update wins/losses/draws and points
        if result.home_score > result.away_score:
            # Home team wins
            table[home_id]["won"] += 1
            table[away_id]["lost"] += 1
            table[home_id]["points"] += 3
        elif result.away_score > result.home_score:
            # Away team wins
            table[away_id]["won"] += 1
            table[home_id]["lost"] += 1
            table[away_id]["points"] += 3
        else:
            # Draw
            table[home_id]["drawn"] += 1
            table[away_id]["drawn"] += 1
            table[home_id]["points"] += 1
            table[away_id]["points"] += 1
    
    # Return sorted list with goal difference
    return sorted(
        [{"team_id": k, **v, "gd": v["gf"] - v["ga"]} for k, v in table.items()],
        key=lambda x: (-x["points"], -x["gd"], -x["gf"])
    )

def recompute_event_leaderboard(event_id):
    """Recompute and update LeaderboardEntry models for an event"""
    from django.db import transaction
    
    with transaction.atomic():
        # Clear existing entries
        LeaderboardEntry.objects.filter(event_id=event_id).delete()
        
        # Get leaderboard data
        leaderboard_data = compute_event_leaderboard(event_id)
        
        # Create new entries
        for entry_data in leaderboard_data:
            LeaderboardEntry.objects.create(
                event_id=event_id,
                team_id=entry_data["team_id"],
                pts=entry_data["points"],
                w=entry_data["won"],
                d=entry_data["drawn"],
                l=entry_data["lost"],
                gf=entry_data["gf"],
                ga=entry_data["ga"],
                gd=entry_data["gd"]
            )
    
    return leaderboard_data
