# fixtures/services.py
from __future__ import annotations
from typing import List, Tuple
from datetime import timedelta
from django.utils import timezone

from teams.models import Team
from .models import Match
from events.models import Event
from venues.models import Venue


def generate_round_robin_for_event(event: Event, venue: Venue, start_at, spacing_minutes: int = 90) -> List[Match]:
    """
    Simple round-robin generator: each team plays every other team once.
    Slots are placed sequentially at the given venue.
    """
    teams = list(Team.objects.filter(registrations__event=event).distinct())
    if len(teams) < 2:
        return []

    created: List[Match] = []
    t = start_at

    for i in range(len(teams)):
        for j in range(i + 1, len(teams)):
            a, b = teams[i], teams[j]
            m = Match.objects.create(
                event=event,
                venue=venue,
                team_a=a,
                team_b=b,
                start_time=t,
                end_time=None,
                status=Match.Status.SCHEDULED,
                is_published=False,
            )
            created.append(m)
            t = t + timedelta(minutes=spacing_minutes)

    return created
