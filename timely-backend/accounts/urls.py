# accounts/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import AuthViewSet, UserViewSet, UserRoleViewSet, AdminUserViewSet, AuditLogViewSet

app_name = "accounts"

# Create router for ViewSets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', UserRoleViewSet, basename='role')
router.register(r'admin/users', AdminUserViewSet, basename='admin-user')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

auth_login = AuthViewSet.as_view({"post": "login"})
auth_logout = AuthViewSet.as_view({"post": "logout"})
auth_refresh = AuthViewSet.as_view({"post": "refresh"})
auth_register = AuthViewSet.as_view({"post": "register"})

urlpatterns = [
    path('auth/login/', auth_login, name='auth-login'),
    path('auth/logout/', auth_logout, name='auth-logout'),
    path('auth/register/', auth_register, name='auth-register'),
    path('refresh/', auth_refresh, name='auth-refresh'),
    path('', include(router.urls)),
]
