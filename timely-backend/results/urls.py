from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ResultViewSet,
)
from .public_views import PublicResultViewSet

# Admin router
results_router = DefaultRouter()
results_router.register(r"", ResultViewSet, basename="results")

# Public router
public_router = DefaultRouter()
public_router.register(r"results", PublicResultViewSet, basename="public-results")

urlpatterns = [
    path("", include(results_router.urls)),         # Admin CRUD - mounted at /api/results/
    path("public/", include(public_router.urls)),           # Public - mounted at /api/results/public/
]
