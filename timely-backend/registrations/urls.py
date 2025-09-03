"""
URL configuration for registrations app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegistrationViewSet, RegistrationDocumentViewSet

router = DefaultRouter()
router.register(r'', RegistrationViewSet, basename='registration')

# Nested router for documents
documents_router = DefaultRouter()
documents_router.register(r'documents', RegistrationDocumentViewSet, basename='registration-document')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:registration_pk>/', include(documents_router.urls)),
]