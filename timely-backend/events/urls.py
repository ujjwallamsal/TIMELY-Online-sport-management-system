from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, DivisionViewSet
from .public_views import PublicEventViewSet
from .sse_views import EventSSEView, EventResultsSSEView, EventScheduleSSEView, EventAnnouncementsSSEView

# Create routers
router = DefaultRouter()
router.register(r'', EventViewSet, basename='event')

# Public router
public_router = DefaultRouter()
public_router.register(r'', PublicEventViewSet, basename='public-event')

urlpatterns = [
    # Event CRUD and lifecycle actions
    path('', include(router.urls)),
    
    # Division management (nested under events)
    path('<int:event_pk>/divisions/', DivisionViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='event-divisions-list'),
    
    path('<int:event_pk>/divisions/<int:pk>/', DivisionViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='event-divisions-detail'),
    
    # Fixtures endpoint for schedule/results pages
    path('<int:event_id>/fixtures/', EventViewSet.as_view({'get': 'fixtures'}), name='event-fixtures'),
    
    # SSE endpoints for real-time updates
    path('<int:event_id>/stream/', EventSSEView.as_view(), name='event-sse'),
    path('<int:event_id>/stream/results/', EventResultsSSEView.as_view(), name='event-results-sse'),
    path('<int:event_id>/stream/schedule/', EventScheduleSSEView.as_view(), name='event-schedule-sse'),
    path('<int:event_id>/stream/announcements/', EventAnnouncementsSSEView.as_view(), name='event-announcements-sse'),
]
