# scheduler/management/commands/run_reminders.py
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.db import transaction

from scheduler.tasks import (
    send_fixture_reminders,
    send_event_reminders,
    cleanup_old_notifications
)


class Command(BaseCommand):
    help = 'Send T-24h and T-2h reminders for fixtures and events'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--fixtures-only',
            action='store_true',
            help='Only send fixture reminders',
        )
        parser.add_argument(
            '--events-only',
            action='store_true',
            help='Only send event reminders',
        )
        parser.add_argument(
            '--cleanup',
            action='store_true',
            help='Also cleanup old notifications',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be sent without actually sending',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS(f'Starting reminder process at {timezone.now()}')
        )
        
        try:
            with transaction.atomic():
                results = {}
                
                # Send fixture reminders
                if not options['events_only']:
                    self.stdout.write('Processing fixture reminders...')
                    if options['dry_run']:
                        # In dry run, just count what would be sent
                        from datetime import timedelta
                        from fixtures.models import Fixture
                        
                        now = timezone.now()
                        t24h_start = now + timedelta(hours=23)
                        t24h_end = now + timedelta(hours=25)
                        t2h_start = now + timedelta(hours=1.5)
                        t2h_end = now + timedelta(hours=2.5)
                        
                        fixtures_24h = Fixture.objects.filter(
                            starts_at__range=[t24h_start, t2h_end],
                            status=Fixture.Status.SCHEDULED
                        ).count()
                        
                        fixtures_2h = Fixture.objects.filter(
                            starts_at__range=[t2h_start, t2h_end],
                            status=Fixture.Status.SCHEDULED
                        ).count()
                        
                        results['fixtures'] = {
                            't24h_count': fixtures_24h,
                            't2h_count': fixtures_2h,
                            'total_reminders': fixtures_24h + fixtures_2h
                        }
                        
                        self.stdout.write(
                            f'  Would send {fixtures_24h} T-24h reminders'
                        )
                        self.stdout.write(
                            f'  Would send {fixtures_2h} T-2h reminders'
                        )
                    else:
                        results['fixtures'] = send_fixture_reminders()
                        self.stdout.write(
                            f'  Sent {results["fixtures"]["t24h_count"]} T-24h reminders'
                        )
                        self.stdout.write(
                            f'  Sent {results["fixtures"]["t2h_count"]} T-2h reminders'
                        )
                
                # Send event reminders
                if not options['fixtures_only']:
                    self.stdout.write('Processing event reminders...')
                    if options['dry_run']:
                        from datetime import timedelta
                        from events.models import Event
                        
                        now = timezone.now()
                        t24h_start = now + timedelta(hours=23)
                        t24h_end = now + timedelta(hours=25)
                        
                        events = Event.objects.filter(
                            start_date__range=[t24h_start.date(), t24h_end.date()],
                            status=Event.Status.PUBLISHED
                        ).count()
                        
                        results['events'] = {'total_reminders': events}
                        self.stdout.write(f'  Would send {events} event reminders')
                    else:
                        send_event_reminders()
                        # Count events for reporting
                        from datetime import timedelta
                        from events.models import Event
                        
                        now = timezone.now()
                        t24h_start = now + timedelta(hours=23)
                        t24h_end = now + timedelta(hours=25)
                        
                        events = Event.objects.filter(
                            start_date__range=[t24h_start.date(), t24h_end.date()],
                            status=Event.Status.PUBLISHED
                        ).count()
                        
                        results['events'] = {'total_reminders': events}
                        self.stdout.write(f'  Sent {events} event reminders')
                
                # Cleanup old notifications
                if options['cleanup']:
                    self.stdout.write('Cleaning up old notifications...')
                    if options['dry_run']:
                        from notifications.models import Notification
                        from datetime import timedelta
                        
                        cutoff_date = timezone.now() - timedelta(days=30)
                        old_notifications = Notification.objects.filter(
                            created_at__lt=cutoff_date,
                            notification_type__in=['fixture_reminder', 'event_reminder']
                        ).count()
                        
                        results['cleanup'] = {'deleted_count': old_notifications}
                        self.stdout.write(f'  Would delete {old_notifications} old notifications')
                    else:
                        results['cleanup'] = cleanup_old_notifications()
                        self.stdout.write(
                            f'  Deleted {results["cleanup"]["deleted_count"]} old notifications'
                        )
                
                # Summary
                total_reminders = 0
                if 'fixtures' in results:
                    total_reminders += results['fixtures'].get('total_reminders', 0)
                if 'events' in results:
                    total_reminders += results['events'].get('total_reminders', 0)
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Reminder process completed successfully. '
                        f'Total reminders: {total_reminders}'
                    )
                )
                
                if options['dry_run']:
                    self.stdout.write(
                        self.style.WARNING('DRY RUN - No actual reminders were sent')
                    )
                
        except Exception as e:
            raise CommandError(f'Reminder process failed: {str(e)}')
