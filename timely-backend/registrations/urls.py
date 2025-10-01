"""
URL configuration for registrations app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegistrationViewSet, RegistrationDocumentViewSet
from .views_checkout import registration_checkout, registration_success

router = DefaultRouter()
router.register(r'', RegistrationViewSet, basename='registration')

# Nested router for documents
documents_router = DefaultRouter()
documents_router.register(r'documents', RegistrationDocumentViewSet, basename='registration-document')

urlpatterns = [
    path('checkout/', registration_checkout, name='registration-checkout'),
    path('success/', registration_success, name='registration-success'),
    path('', include(router.urls)),
    path('<int:registration_pk>/', include(documents_router.urls)),
]