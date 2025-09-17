# events/public_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .public_views import PublicEventViewSet

# Create public router
public_router = DefaultRouter()
public_router.register(r'', PublicEventViewSet, basename='public-event')

urlpatterns = [
    path('', include(public_router.urls)),
]
