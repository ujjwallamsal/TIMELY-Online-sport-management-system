from django.core.management.base import BaseCommand
from events.models import Division

class Command(BaseCommand):
    help = 'Seed sample divisions for events'

    def handle(self, *args, **options):
        divisions_data = [
            {
                'name': 'U18',
                'description': 'Under 18 years old',
                'min_age': None,
                'max_age': 17,
                'gender': 'OPEN'
            },
            {
                'name': 'U21',
                'description': 'Under 21 years old',
                'min_age': 18,
                'max_age': 20,
                'gender': 'OPEN'
            },
            {
                'name': 'Open',
                'description': 'All ages welcome',
                'min_age': None,
                'max_age': None,
                'gender': 'OPEN'
            },
            {
                'name': 'Masters',
                'description': '35+ years old',
                'min_age': 35,
                'max_age': None,
                'gender': 'OPEN'
            },
            {
                'name': 'Men',
                'description': 'Male participants only',
                'min_age': None,
                'max_age': None,
                'gender': 'MALE'
            },
            {
                'name': 'Women',
                'description': 'Female participants only',
                'min_age': None,
                'max_age': None,
                'gender': 'FEMALE'
            },
            {
                'name': 'Mixed',
                'description': 'Mixed gender teams',
                'min_age': None,
                'max_age': None,
                'gender': 'MIXED'
            }
        ]

        created_count = 0
        for division_data in divisions_data:
            division, created = Division.objects.get_or_create(
                name=division_data['name'],
                defaults=division_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created division: {division.name}'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f'Division already exists: {division.name}'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully seeded {created_count} new divisions'
            )
        )
