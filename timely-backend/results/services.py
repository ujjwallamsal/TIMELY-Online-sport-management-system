# results/services.py
from collections import defaultdict
from .models import Result
def compute_event_leaderboard(event_id:int):
    table = defaultdict(lambda: {"played":0,"won":0,"drawn":0,"lost":0,"points":0,"gf":0,"ga":0})
    for r in Result.objects.select_related("match","match__event","match__team_a","match__team_b").filter(match__event_id=event_id):
        a = r.match.team_a_id; b = r.match.team_b_id
        table[a]["played"]+=1; table[b]["played"]+=1
        table[a]["gf"]+=r.score_a; table[a]["ga"]+=r.score_b
        table[b]["gf"]+=r.score_b; table[b]["ga"]+=r.score_a
        if r.score_a>r.score_b: table[a]["won"]+=1; table[b]["lost"]+=1; table[a]["points"]+=3
        elif r.score_a<r.score_b: table[b]["won"]+=1; table[a]["lost"]+=1; table[b]["points"]+=3
        else: table[a]["drawn"]+=1; table[b]["drawn"]+=1; table[a]["points"]+=1; table[b]["points"]+=1
    # return sorted list
    return sorted(
        [{"team_id":k, **v, "gd":v["gf"]-v["ga"]} for k,v in table.items()],
        key=lambda x:(-x["points"], -x["gd"], -x["gf"])
    )
