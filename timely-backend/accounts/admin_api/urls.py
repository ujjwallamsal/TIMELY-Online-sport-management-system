# accounts/admin_api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminUserViewSet

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-user')

urlpatterns = [
    path('', include(router.urls)),
]
