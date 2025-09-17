# api/urls.py - Unified API Router
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Create unified router
router = DefaultRouter()

urlpatterns = [
    # Authentication endpoints
    path('auth/', include('accounts.urls')),
    
    # User management
    path('users/', include('accounts.urls')),
    path('me/', include('accounts.urls')),
    
    # Sports & Venues
    path('sports/', include('sports.urls')),
    path('venues/', include('venues.urls')),
    
    # Events & Public Portal
    path('events/', include('events.urls')),
    path('public/events/', include('events.urls')),
    
    # Teams & Registrations
    path('teams/', include('teams.urls')),
    path('registrations/', include('registrations.urls')),
    
    # Fixtures & Results
    path('fixtures/', include('fixtures.urls')),
    path('results/', include('results.urls')),
    
    # Notifications & Announcements
    path('notifications/', include('notifications.urls')),
    
    # Include router URLs (must be last)
    path('', include(router.urls)),
]
