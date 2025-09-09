# kyc/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import KycProfileViewSet, KycDocumentViewSet

router = DefaultRouter()
router.register(r'profile', KycProfileViewSet, basename='kyc-profile')
router.register(r'documents', KycDocumentViewSet, basename='kyc-document')

urlpatterns = [
    path('', include(router.urls)),
]
