# teams/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from events.sse_views import team_updates_sse

router = DefaultRouter()
router.register(r'', views.TeamViewSet, basename='team')
router.register(r'members', views.TeamMemberViewSet, basename='team-member')

urlpatterns = [
    path('', include(router.urls)),
    # Team-specific SSE endpoints
    path('<int:team_id>/stream/', team_updates_sse, name='team-sse'),
]
