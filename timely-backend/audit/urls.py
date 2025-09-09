"""
URL patterns for audit app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditLogViewSet

# Create router
router = DefaultRouter()
router.register(r'logs', AuditLogViewSet, basename='auditlog')

urlpatterns = [
    path('', include(router.urls)),
]
