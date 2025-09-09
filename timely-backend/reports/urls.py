# reports/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportsViewSet

# Create router
router = DefaultRouter()
router.register(r'', ReportsViewSet, basename='reports')

app_name = 'reports'

urlpatterns = [
    # Reports endpoints
    path('', include(router.urls)),
]