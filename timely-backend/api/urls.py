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
## Notifications are exposed via notifications.urls; keep router clean here
router.register(r'announcements', views.AnnouncementViewSet, basename='announcement')
router.register(r'reports', views.ReportViewSet, basename='report')

urlpatterns = [
    # Health check
    path('health/', views.HealthView.as_view(), name='health'),
    path('health', views.HealthView.as_view(), name='health-noslash'),
    
    # Auth endpoints
    path('auth/login/', views.LoginView.as_view(), name='auth-login'),
    path('auth/refresh/', views.TokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/register/', views.RegisterView.as_view(), name='auth-register'),
    path('me/', views.MeView.as_view(), name='me'),

    # Include router URLs (main API endpoints)
    path('', include(router.urls)),
    
    # Include app-specific endpoints
    path('tickets/', include('tickets.urls')),
    path('notifications/', include('notifications.urls')),
    # path('', include('accounts.urls')),
    # path('venues/', include('venues.urls')),
    path('events/', include('events.urls')),
    # path('teams/', include('teams.urls')),  # COMMENTED OUT - has import issues, will re-add after core flows are green
    # path('registrations/', include('registrations.urls')),  # COMMENTED OUT - may have import issues, will re-add after core flows are green
    # path('', include('fixtures.urls')),  # COMMENTED OUT - may have import issues, will re-add after core flows are green
    # path('results/', include('results.urls')),  # COMMENTED OUT - may have import issues, will re-add after core flows are green
    
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
    
    # Public endpoints - normalized structure
    path('public/events/', views.PublicEventListView.as_view(), name='public-events'),
    path('public/events/<int:event_id>/', views.PublicEventDetailView.as_view(), name='public-event-detail'),
    path('public/events/<int:event_id>/fixtures/', views.PublicEventFixturesView.as_view(), name='public-event-fixtures'),
    path('public/events/<int:event_id>/results/', views.PublicEventResultsView.as_view(), name='public-event-results'),
    path('public/events/<int:event_id>/leaderboard/', views.PublicEventLeaderboardView.as_view(), name='public-event-leaderboard'),
    path('public/media/', views.PublicMediaListView.as_view(), name='public-media-list'),
    path('public/stats/', views.PublicStatsView.as_view(), name='public-stats'),
    
    # Content (pages/news/banners)
    path('news/', include('content.urls')),

    # Gallery
    path('gallery/', include('gallery.urls')),
]
