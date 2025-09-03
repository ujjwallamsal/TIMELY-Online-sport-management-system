from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from events.models import Event, Division, Venue
from accounts.models import User
import random

class Command(BaseCommand):
    help = 'Seed sample events data for development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing events before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            Event.objects.all().delete()
            self.stdout.write('Cleared existing events')

        # Get or create sample divisions
        divisions = []
        division_names = ['U18', 'U21', 'Open', 'Masters']
        for name in division_names:
            division, created = Division.objects.get_or_create(
                name=name,
                defaults={
                    'description': f'{name} division',
                    'min_age': 0 if name == 'Open' else 18 if name == 'U18' else 21 if name == 'U21' else 35,
                    'max_age': 999 if name == 'Open' else 18 if name == 'U18' else 21 if name == 'U21' else 999,
                    'gender': 'ALL'
                }
            )
            divisions.append(division)
            if created:
                self.stdout.write(f'Created division: {name}')

        # Get or create sample venues
        venues = []
        venue_data = [
            {'name': 'Central Stadium', 'address': '123 Main St', 'city': 'Sydney', 'state': 'NSW', 'postal_code': '2000', 'country': 'Australia', 'capacity': 200},
            {'name': 'Sports Complex', 'address': '456 Oak Ave', 'city': 'Melbourne', 'state': 'VIC', 'postal_code': '3000', 'country': 'Australia', 'capacity': 150},
            {'name': 'Aquatic Center', 'address': '789 Pine Rd', 'city': 'Brisbane', 'state': 'QLD', 'postal_code': '4000', 'country': 'Australia', 'capacity': 100},
            {'name': 'Tennis Center', 'address': '321 Elm St', 'city': 'Perth', 'state': 'WA', 'postal_code': '6000', 'country': 'Australia', 'capacity': 80},
            {'name': 'Track & Field', 'address': '654 Maple Dr', 'city': 'Adelaide', 'state': 'SA', 'postal_code': '5000', 'country': 'Australia', 'capacity': 120}
        ]
        
        for venue_info in venue_data:
            venue, created = Venue.objects.get_or_create(
                name=venue_info['name'],
                defaults=venue_info
            )
            venues.append(venue)
            if created:
                self.stdout.write(f'Created venue: {venue_info["name"]}')

        # Sample events data
        events_data = [
            {
                'name': 'Summer Football Championship',
                'sport_type': 'Football',
                'description': 'Annual football championship for all divisions',
                'start_date': timezone.now() + timedelta(days=30),
                'end_date': timezone.now() + timedelta(days=35),
                'registration_open': timezone.now() - timedelta(days=10),
                'registration_close': timezone.now() + timedelta(days=25),
                'fee_cents': 5000,
                'capacity': 200,
                'status': 'PUBLISHED',
                'is_registration_open': True
            },
            {
                'name': 'Basketball Tournament',
                'sport_type': 'Basketball',
                'description': 'Fast-paced basketball tournament',
                'start_date': timezone.now() + timedelta(days=45),
                'end_date': timezone.now() + timedelta(days=48),
                'registration_open': timezone.now() - timedelta(days=5),
                'registration_close': timezone.now() + timedelta(days=40),
                'fee_cents': 3000,
                'capacity': 150,
                'status': 'PUBLISHED',
                'is_registration_open': True
            },
            {
                'name': 'Swimming Meet',
                'sport_type': 'Swimming',
                'description': 'Competitive swimming meet',
                'start_date': timezone.now() + timedelta(days=60),
                'end_date': timezone.now() + timedelta(days=62),
                'registration_open': timezone.now() + timedelta(days=10),
                'registration_close': timezone.now() + timedelta(days=55),
                'fee_cents': 2500,
                'capacity': 100,
                'status': 'PUBLISHED',
                'is_registration_open': False
            },
            {
                'name': 'Tennis Open',
                'sport_type': 'Tennis',
                'description': 'Open tennis championship',
                'start_date': timezone.now() + timedelta(days=75),
                'end_date': timezone.now() + timedelta(days=78),
                'registration_open': timezone.now() + timedelta(days=20),
                'registration_close': timezone.now() + timedelta(days=70),
                'fee_cents': 4000,
                'capacity': 80,
                'status': 'DRAFT',
                'is_registration_open': False
            },
            {
                'name': 'Athletics Championship',
                'sport_type': 'Athletics',
                'description': 'Track and field championship',
                'start_date': timezone.now() + timedelta(days=90),
                'end_date': timezone.now() + timedelta(days=92),
                'registration_open': timezone.now() + timedelta(days=30),
                'registration_close': timezone.now() + timedelta(days=85),
                'fee_cents': 3500,
                'capacity': 120,
                'status': 'PUBLISHED',
                'is_registration_open': False
            }
        ]

        created_count = 0
        for event_data in events_data:
            event, created = Event.objects.get_or_create(
                name=event_data['name'],
                defaults={
                    **event_data,
                    'division': random.choice(divisions),
                    'venue': random.choice(venues),
                    'created_by': User.objects.filter(is_superuser=True).first() or User.objects.first()
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f'Created event: {event_data["name"]}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully seeded {created_count} new events'
            )
        )
