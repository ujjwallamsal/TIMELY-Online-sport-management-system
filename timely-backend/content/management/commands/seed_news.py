from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from content.models import News
from gallery.models import GalleryAlbum, GalleryMedia
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed news articles and gallery content'

    def handle(self, *args, **options):
        if os.environ.get("ALLOW_DEMO_SEED") != "1":
            self.stdout.write(self.style.WARNING("Skipping news/gallery seeding (set ALLOW_DEMO_SEED=1 to enable)."))
            return
        # Get or create admin user for authoring
        admin_user, created = User.objects.get_or_create(
            email='admin@timely.local',
            defaults={
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'ADMIN',
                'is_active': True,
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Created admin user: {admin_user.email}')
            )

        # Create news articles
        news_data = [
            {
                'title': 'Welcome to Timely Sports Management',
                'slug': 'welcome-to-timely-sports-management',
                'excerpt': 'Your comprehensive platform for managing sports events, registrations, and results.',
                'body': '''Welcome to Timely, the premier sports management platform designed to streamline your sporting events from registration to results.

## What Makes Timely Special

Timely provides a comprehensive solution for sports organizers, athletes, coaches, and spectators. Whether you're running a local tournament or managing a league, we've got you covered.

### Key Features:
- **Event Management**: Create and manage sporting events with ease
- **Registration System**: Handle athlete and team registrations efficiently  
- **Real-time Results**: Live scoring and leaderboards
- **Media Gallery**: Share photos and videos from your events
- **News & Updates**: Keep your community informed

### Getting Started

New to Timely? Here's how to get started:

1. **Register** for an account
2. **Browse Events** to see what's happening
3. **Register** for events you're interested in
4. **Follow** the action with live updates

We're excited to have you on board and look forward to helping you make your sporting events more organized and engaging!''',
                'is_published': True,
                'published_at': timezone.now(),
                'author': admin_user,
                'seo_title': 'Welcome to Timely Sports Management Platform',
                'seo_description': 'Comprehensive sports management platform for events, registrations, and results. Get started today!'
            },
            {
                'title': 'Championship Season 2024 Kicks Off',
                'slug': 'championship-season-2024-kicks-off',
                'excerpt': 'The 2024 championship season is officially underway with exciting competitions across multiple sports.',
                'body': '''The 2024 championship season has officially begun, and we couldn't be more excited to bring you another year of thrilling sports competitions!

## What to Expect This Season

This year's championship season promises to be bigger and better than ever, featuring:

- **Multi-sport competitions** across football, basketball, tennis, and more
- **Enhanced live streaming** for remote spectators
- **Improved scoring systems** for real-time results
- **Expanded media coverage** with professional photography

### Key Dates

- **Registration Opens**: March 1st, 2024
- **Qualifying Rounds**: April 15th - May 30th, 2024  
- **Championship Finals**: June 15th - 30th, 2024
- **Awards Ceremony**: July 1st, 2024

### How to Participate

Athletes and teams can register for events through our online platform. Simply browse the available competitions and submit your registration before the deadline.

Coaches and organizers can manage their teams and events through the dedicated dashboard, complete with real-time updates and comprehensive reporting.

### Stay Connected

Follow our news feed for regular updates, check out the media gallery for highlights, and don't forget to share your own photos and videos from the competitions.

Good luck to all participants, and may the best athletes win!''',
                'is_published': True,
                'published_at': timezone.now(),
                'author': admin_user,
                'seo_title': 'Championship Season 2024 - Registration Now Open',
                'seo_description': 'Join the 2024 championship season. Multi-sport competitions, live streaming, and real-time results. Register today!'
            }
        ]

        for news_item_data in news_data:
            news_item, created = News.objects.get_or_create(
                slug=news_item_data['slug'],
                defaults=news_item_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created news article: {news_item.title}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'News article already exists: {news_item.title}')
                )

        # Create gallery album
        album, created = GalleryAlbum.objects.get_or_create(
            title='Championship Highlights 2024',
            defaults={
                'description': 'Best moments from the 2024 championship season',
                'is_public': True,
                'created_by': admin_user
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Created gallery album: {album.title}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Gallery album already exists: {album.title}')
            )

        # Create gallery media items (placeholder content)
        media_data = [
            {
                'title': 'Championship Opening Ceremony',
                'media_type': 'image',
                'album': album,
                'is_public': True,
                'uploaded_by': admin_user
            },
            {
                'title': 'Finals Action Shot',
                'media_type': 'image', 
                'album': album,
                'is_public': True,
                'uploaded_by': admin_user
            },
            {
                'title': 'Victory Celebration',
                'media_type': 'image',
                'album': album,
                'is_public': True,
                'uploaded_by': admin_user
            }
        ]

        for media_item_data in media_data:
            media_item, created = GalleryMedia.objects.get_or_create(
                title=media_item_data['title'],
                album=media_item_data['album'],
                defaults=media_item_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created gallery media: {media_item.title}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Gallery media already exists: {media_item.title}')
                )

        self.stdout.write(
            self.style.SUCCESS('Successfully seeded news and gallery content!')
        )
