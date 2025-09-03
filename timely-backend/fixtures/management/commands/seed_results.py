from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from fixtures.models import Fixture
from events.models import Event
from teams.models import Team
import random

class Command(BaseCommand):
    help = 'Seed sample results data for development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing results before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            Fixture.objects.all().delete()
            self.stdout.write('Cleared existing fixtures')

        # Get or create sample teams
        teams = []
        team_names = [
            'Blue Dragons', 'Red Phoenix', 'Green Eagles', 'Silver Wolves',
            'Golden Lions', 'Black Panthers', 'White Sharks', 'Blue Dolphins',
            'Orange Tigers', 'Purple Cobras', 'Yellow Bees', 'Green Hornets'
        ]
        
        for name in team_names:
            team, created = Team.objects.get_or_create(
                name=name,
                defaults={
                    'sport_type': random.choice(['Football', 'Basketball', 'Tennis', 'Swimming', 'Athletics']),
                    'description': f'{name} team',
                    'is_active': True
                }
            )
            teams.append(team)
            if created:
                self.stdout.write(f'Created team: {name}')

        # Get existing events
        events = Event.objects.filter(status='PUBLISHED')[:5]
        if not events.exists():
            self.stdout.write('No published events found. Please run seed_events first.')
            return

        # Sample results data
        results_data = [
            {
                'event_name': 'Summer Football Championship',
                'home_team': 'Blue Dragons',
                'away_team': 'Red Phoenix',
                'home_score': 3,
                'away_score': 1,
                'sport': 'Football',
                'venue': 'Central Stadium',
                'match_date': timezone.now() - timedelta(days=5),
                'outcome': 'HOME_WIN',
                'round_number': 1,
                'match_number': 1,
                'highlights': ['Goal by John Doe (15\')', 'Goal by Jane Smith (32\')', 'Goal by Mike Johnson (67\')', 'Goal by Sarah Wilson (89\')']
            },
            {
                'event_name': 'Basketball Tournament',
                'home_team': 'Green Eagles',
                'away_team': 'Silver Wolves',
                'home_score': 89,
                'away_score': 92,
                'sport': 'Basketball',
                'venue': 'Sports Complex',
                'match_date': timezone.now() - timedelta(days=3),
                'outcome': 'AWAY_WIN',
                'round_number': 1,
                'match_number': 2,
                'highlights': ['3-pointer by Alex Brown (Q1)', 'Dunk by Chris Davis (Q2)', 'Fast break by Emma Wilson (Q3)', 'Game-winning shot by Tom Lee (Q4)']
            },
            {
                'event_name': 'Tennis Open',
                'home_team': 'Golden Lions',
                'away_team': 'Black Panthers',
                'home_score': 6,
                'away_score': 4,
                'sport': 'Tennis',
                'venue': 'Tennis Center',
                'match_date': timezone.now() - timedelta(days=2),
                'outcome': 'HOME_WIN',
                'round_number': 1,
                'match_number': 3,
                'highlights': ['Ace serve (1st set)', 'Break point (2nd set)', 'Match point (3rd set)']
            },
            {
                'event_name': 'Swimming Meet',
                'home_team': 'White Sharks',
                'away_team': 'Blue Dolphins',
                'home_score': 2,
                'away_score': 0,
                'sport': 'Swimming',
                'venue': 'Aquatic Center',
                'match_date': timezone.now() - timedelta(days=1),
                'outcome': 'HOME_WIN',
                'round_number': 1,
                'match_number': 4,
                'highlights': ['100m Freestyle Gold', '200m Butterfly Gold', '4x100m Relay Gold']
            },
            {
                'event_name': 'Athletics Championship',
                'home_team': 'Yellow Bees',
                'away_team': 'Green Hornets',
                'home_score': 1,
                'away_score': 0,
                'sport': 'Athletics',
                'venue': 'Track & Field',
                'match_date': timezone.now() - timedelta(hours=12),
                'outcome': 'HOME_WIN',
                'round_number': 1,
                'match_number': 5,
                'highlights': ['100m Sprint Gold', 'Long Jump Gold', '4x400m Relay Gold']
            }
        ]

        created_count = 0
        for result_data in results_data:
            # Find the corresponding event
            event = events.filter(name__icontains=result_data['sport']).first() or events.first()
            
            # Find or create teams
            home_team = Team.objects.filter(name=result_data['home_team']).first()
            away_team = Team.objects.filter(name=result_data['away_team']).first()
            
            if not home_team or not away_team:
                continue

            # Create fixture
            fixture, created = Fixture.objects.get_or_create(
                event=event,
                starts_at=result_data['match_date'],
                defaults={
                    'ends_at': result_data['match_date'] + timedelta(hours=2),
                    'status': 'COMPLETED',
                    'round_no': result_data['round_number']
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'Created fixture: {result_data["home_team"]} vs {result_data["away_team"]}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully seeded {created_count} new fixtures'
            )
        )
