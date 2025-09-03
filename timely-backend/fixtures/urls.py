# fixtures/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import FixtureViewSet, EventFixtureViewSet

# Create router for fixtures
router = DefaultRouter()
router.register(r'fixtures', FixtureViewSet, basename='fixture')

# URL patterns
urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Event-specific fixture URLs
    path('events/<int:event_id>/fixtures/', EventFixtureViewSet.as_view({
        'get': 'list',
        'post': 'publish_all'
    }), name='event-fixtures'),
    
    # Public fixture URLs (read-only)
    path('public/events/<int:event_id>/fixtures/', EventFixtureViewSet.as_view({
        'get': 'list'
    }), name='public-event-fixtures'),
]