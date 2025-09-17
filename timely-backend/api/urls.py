# api/urls.py - Unified API Router
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create unified router for all API endpoints
router = DefaultRouter()

# Register all viewsets
router.register(r'auth', views.AuthViewSet, basename='auth')
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'events', views.EventViewSet, basename='event')
router.register(r'venues', views.VenueViewSet, basename='venue')
router.register(r'sports', views.SportViewSet, basename='sport')
router.register(r'teams', views.TeamViewSet, basename='team')
router.register(r'registrations', views.RegistrationViewSet, basename='registration')
router.register(r'fixtures', views.FixtureViewSet, basename='fixture')
router.register(r'results', views.ResultViewSet, basename='result')
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'announcements', views.AnnouncementViewSet, basename='announcement')
router.register(r'reports', views.ReportViewSet, basename='report')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Include tickets endpoints
    path('tickets/', include('tickets.urls')),
    
    # Include reports endpoints
    path('reports/', include('reports.urls')),
    
    # Include gallery endpoints
    path('gallery/', include('gallery.urls')),
    
    # Include content endpoints (News, Pages, Banners)
    path('content/', include('content.urls')),
    
    # Media endpoints
    path('media/upload/', views.MediaUploadView.as_view(), name='media-upload'),
    path('media/<int:pk>/', views.MediaModerationView.as_view(), name='media-moderation'),
    path('public/media/', views.PublicMediaListView.as_view(), name='public-media-list'),
    
    # Additional endpoints not covered by viewsets
    path('events/<int:event_id>/registrations/', views.EventRegistrationsView.as_view(), name='event-registrations'),
    path('events/<int:event_id>/fixtures/', views.EventFixturesView.as_view(), name='event-fixtures'),
    path('events/<int:event_id>/fixtures/generate/', views.GenerateFixturesView.as_view(), name='generate-fixtures'),
    path('events/<int:event_id>/leaderboard/', views.EventLeaderboardView.as_view(), name='event-leaderboard'),
    path('events/<int:event_id>/announce/', views.EventAnnounceView.as_view(), name='event-announce'),
    path('events/<int:event_id>/announcements/', views.EventAnnouncementsView.as_view(), name='event-announcements'),
    path('fixtures/<int:fixture_id>/result/', views.FixtureResultView.as_view(), name='fixture-result'),
    path('results/<int:result_id>/lock/', views.LockResultView.as_view(), name='lock-result'),
    path('registrations/<int:registration_id>/approve/', views.ApproveRegistrationView.as_view(), name='approve-registration'),
    path('registrations/<int:registration_id>/reject/', views.RejectRegistrationView.as_view(), name='reject-registration'),
    path('events/<int:event_id>/cancel/', views.CancelEventView.as_view(), name='cancel-event'),
    
    # Public endpoints
    path('public/events/', views.PublicEventListView.as_view(), name='public-events'),
    path('public/events/<int:event_id>/', views.PublicEventDetailView.as_view(), name='public-event-detail'),
    path('public/events/<int:event_id>/fixtures/', views.PublicEventFixturesView.as_view(), name='public-event-fixtures'),
    path('public/events/<int:event_id>/results/', views.PublicEventResultsView.as_view(), name='public-event-results'),
    path('public/events/<int:event_id>/leaderboard/', views.PublicEventLeaderboardView.as_view(), name='public-event-leaderboard'),
    
    # Health check
    path('health/', views.HealthView.as_view(), name='health'),
]
