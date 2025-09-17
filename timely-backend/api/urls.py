# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'announcements', views.AnnouncementViewSet, basename='announcement')

urlpatterns = [
    # Include accounts app URLs
    path('accounts/', include('accounts.urls')),
    
    # Include other enabled app URLs
    path('events/', include('events.urls')),
    path('venues/', include('venues.urls')),
    path('teams/', include('teams.urls')),
    path('sports/', include('sports.urls')),
    path('registrations/', include('registrations.urls')),
    path('fixtures/', include('fixtures.urls')),
    path('tickets/', include('tickets.urls')),
    path('results/', include('results.urls')),
    path('notifications/', include('notifications.urls')),
    path('public/', include('public.urls')),
    
    # Include router URLs
    path('', include(router.urls)),
]
