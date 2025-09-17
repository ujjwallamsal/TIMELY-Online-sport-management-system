# api/management/commands/add_performance_indexes.py
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Add performance indexes for API optimization'
    
    def handle(self, *args, **options):
        """Add database indexes for performance optimization"""
        
        indexes = [
            # Event indexes
            {
                'table': 'events_event',
                'name': 'idx_event_status_start_date',
                'columns': ['status', 'start_date'],
                'description': 'Index for event filtering by status and start date'
            },
            {
                'table': 'events_event',
                'name': 'idx_event_organizer_status',
                'columns': ['organizer_id', 'status'],
                'description': 'Index for organizer event queries'
            },
            {
                'table': 'events_event',
                'name': 'idx_event_sport_status',
                'columns': ['sport_id', 'status'],
                'description': 'Index for sport-based event filtering'
            },
            
            # Fixture indexes
            {
                'table': 'fixtures_fixture',
                'name': 'idx_fixture_event_start_at',
                'columns': ['event_id', 'start_at'],
                'description': 'Index for event fixtures ordered by start time'
            },
            {
                'table': 'fixtures_fixture',
                'name': 'idx_fixture_venue_start_at',
                'columns': ['venue_id', 'start_at'],
                'description': 'Index for venue fixture queries'
            },
            {
                'table': 'fixtures_fixture',
                'name': 'idx_fixture_status_published',
                'columns': ['status', 'is_published'],
                'description': 'Index for published fixture filtering'
            },
            
            # Registration indexes
            {
                'table': 'registrations_registration',
                'name': 'idx_registration_event_status',
                'columns': ['event_id', 'status'],
                'description': 'Index for event registration filtering'
            },
            {
                'table': 'registrations_registration',
                'name': 'idx_registration_user_status',
                'columns': ['user_id', 'status'],
                'description': 'Index for user registration queries'
            },
            {
                'table': 'registrations_registration',
                'name': 'idx_registration_created_at',
                'columns': ['created_at'],
                'description': 'Index for registration ordering by creation time'
            },
            
            # Result indexes
            {
                'table': 'results_result',
                'name': 'idx_result_fixture_event',
                'columns': ['fixture_id', 'fixture__event_id'],
                'description': 'Index for result queries by event'
            },
            {
                'table': 'results_result',
                'name': 'idx_result_status_verified',
                'columns': ['status', 'is_verified'],
                'description': 'Index for result status filtering'
            },
            {
                'table': 'results_result',
                'name': 'idx_result_created_at',
                'columns': ['created_at'],
                'description': 'Index for result ordering by creation time'
            },
            
            # User indexes
            {
                'table': 'accounts_user',
                'name': 'idx_user_role_active',
                'columns': ['role', 'is_active'],
                'description': 'Index for user role and status filtering'
            },
            {
                'table': 'accounts_user',
                'name': 'idx_user_email',
                'columns': ['email'],
                'description': 'Index for user email lookups'
            },
            {
                'table': 'accounts_user',
                'name': 'idx_user_created_at',
                'columns': ['created_at'],
                'description': 'Index for user ordering by creation time'
            },
            
            # Venue indexes
            {
                'table': 'venues_venue',
                'name': 'idx_venue_city_state',
                'columns': ['city', 'state'],
                'description': 'Index for venue location filtering'
            },
            {
                'table': 'venues_venue',
                'name': 'idx_venue_capacity',
                'columns': ['capacity'],
                'description': 'Index for venue capacity filtering'
            },
            
            # Notification indexes
            {
                'table': 'notifications_notification',
                'name': 'idx_notification_user_read',
                'columns': ['user_id', 'is_read'],
                'description': 'Index for user notification queries'
            },
            {
                'table': 'notifications_notification',
                'name': 'idx_notification_created_at',
                'columns': ['created_at'],
                'description': 'Index for notification ordering'
            },
        ]
        
        with connection.cursor() as cursor:
            for index in indexes:
                try:
                    # Check if index already exists
                    cursor.execute("""
                        SELECT COUNT(*) FROM pg_indexes 
                        WHERE indexname = %s AND tablename = %s
                    """, [index['name'], index['table']])
                    
                    if cursor.fetchone()[0] > 0:
                        self.stdout.write(
                            self.style.WARNING(f"Index {index['name']} already exists on {index['table']}")
                        )
                        continue
                    
                    # Create the index
                    columns_str = ', '.join(index['columns'])
                    sql = f"""
                        CREATE INDEX {index['name']} 
                        ON {index['table']} ({columns_str})
                    """
                    
                    cursor.execute(sql)
                    self.stdout.write(
                        self.style.SUCCESS(f"Created index {index['name']} on {index['table']}")
                    )
                    
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"Failed to create index {index['name']}: {e}")
                    )
        
        self.stdout.write(
            self.style.SUCCESS('Performance indexes creation completed')
        )
