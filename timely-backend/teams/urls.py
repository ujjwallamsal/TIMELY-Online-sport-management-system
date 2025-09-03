from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TeamViewSet,
    TeamMemberViewSet,
    TeamEventEntryViewSet,
    EligibilityCheckViewSet,
    AthleteProfileViewSet,
)

# Team management routers
teams_router = DefaultRouter()
teams_router.register(r"", TeamViewSet, basename="teams")

team_members_router = DefaultRouter()
team_members_router.register(r"", TeamMemberViewSet, basename="team-members")

team_entries_router = DefaultRouter()
team_entries_router.register(r"", TeamEventEntryViewSet, basename="team-entries")

eligibility_router = DefaultRouter()
eligibility_router.register(r"", EligibilityCheckViewSet, basename="eligibility")

athletes_router = DefaultRouter()
athletes_router.register(r"", AthleteProfileViewSet, basename="athletes")

urlpatterns = [
    # More specific patterns first
    path("members/", include(team_members_router.urls)),     # /api/teams/members/
    path("entries/", include(team_entries_router.urls)),     # /api/teams/entries/
    path("eligibility/", include(eligibility_router.urls)),  # /api/teams/eligibility/
    path("athletes/", include(athletes_router.urls)),        # /api/teams/athletes/
    
    # General team management last (catches everything else)
    path("", include(teams_router.urls)),                    # /api/teams/
]
