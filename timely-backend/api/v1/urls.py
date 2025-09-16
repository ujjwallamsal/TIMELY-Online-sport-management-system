# api/v1/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for API v1
router = DefaultRouter()

# Register viewsets
router.register(r'auth', views.AuthViewSet, basename='auth')
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'events', views.EventViewSet, basename='event')
router.register(r'venues', views.VenueViewSet, basename='venue')
router.register(r'registrations', views.RegistrationViewSet, basename='registration')
router.register(r'fixtures', views.FixtureViewSet, basename='fixture')
router.register(r'results', views.ResultViewSet, basename='result')
router.register(r'announcements', views.AnnouncementViewSet, basename='announcement')
router.register(r'reports', views.ReportViewSet, basename='report')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
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
]
