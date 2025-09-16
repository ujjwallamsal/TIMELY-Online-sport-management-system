from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ResultViewSet, FixtureResultView, EventResultsView, EventRecentResultsView,
    EventLeaderboardView, LeaderboardViewSet, RecomputeStandingsView
)
from .public_views import PublicResultViewSet

# Admin router
results_router = DefaultRouter()
results_router.register(r"", ResultViewSet, basename="results")
results_router.register(r"leaderboard", LeaderboardViewSet, basename="leaderboard")

# Public router
public_router = DefaultRouter()
public_router.register(r"results", PublicResultViewSet, basename="public-results")

urlpatterns = [
    # Admin CRUD - mounted at /api/results/
    path("", include(results_router.urls)),
    
    # Fixture-specific result recording
    path("fixtures/<int:fixture_id>/record/", FixtureResultView.as_view(), name="fixture-record-result"),
    path("fixtures/<int:fixture_id>/provisional/", FixtureResultView.as_view(), name="fixture-provisional-result"),
    
    # Event-specific endpoints
    path("event/<int:event_id>/", EventResultsView.as_view(), name="event-results"),
    path("event/<int:event_id>/recent/", EventRecentResultsView.as_view(), name="event-recent-results"),
    path("event/<int:event_id>/leaderboard/", EventLeaderboardView.as_view(), name="event-leaderboard"),
    path("event/<int:event_id>/recompute/", RecomputeStandingsView.as_view(), name="recompute-standings"),
    
    # Public endpoints
    path("public/", include(public_router.urls)),
]
