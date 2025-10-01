# accounts/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'admin/users', views.AdminUserViewSet, basename='admin-user')
router.register(r'roles', views.UserRoleViewSet, basename='user-role')
router.register(r'audit-logs', views.AuditLogViewSet, basename='audit-log')
router.register(r'role-requests', views.RoleRequestViewSet, basename='role-request')

urlpatterns = [
    # Authentication endpoints
    path('auth/', include([
        path('register/', views.AuthViewSet.as_view({'post': 'register'}), name='register'),
        path('login/', views.AuthViewSet.as_view({'post': 'login'}), name='login'),
        path('logout/', views.AuthViewSet.as_view({'post': 'logout'}), name='logout'),
        path('refresh/', views.AuthViewSet.as_view({'post': 'refresh'}), name='refresh'),
        path('password/forgot/', views.AuthViewSet.as_view({'post': 'password_reset_request'}), name='password-forgot'),
        path('password/reset/confirm/', views.AuthViewSet.as_view({'post': 'password_reset_confirm'}), name='password-reset-confirm'),
        path('verify-email/', views.AuthViewSet.as_view({'post': 'verify_email'}), name='verify-email'),
        # Role application endpoints
        path('apply-athlete/', views.apply_athlete_role, name='apply-athlete'),
        path('apply-coach/', views.apply_coach_role, name='apply-coach'),
        path('apply-organizer/', views.apply_organizer_role, name='apply-organizer'),
        path('applications/', views.get_my_applications, name='my-applications'),
    ])),
    
    # User management endpoints
    path('', include([
        path('', views.UserViewSet.as_view({'get': 'me', 'patch': 'me'}), name='user-me-direct'),
    ])),
    path('users/', include([
        path('me/', views.UserViewSet.as_view({'get': 'me', 'patch': 'me'}), name='user-me'),
        path('<int:pk>/change-password/', views.UserViewSet.as_view({'post': 'change_password'}), name='user-change-password'),
        path('<int:pk>/update-role/', views.UserViewSet.as_view({'patch': 'update_role'}), name='user-update-role'),
    ])),
    
    # Admin user management endpoints
    path('admin/users/', include([
        path('<int:pk>/assign-role/', views.AdminUserViewSet.as_view({'post': 'assign_role'}), name='admin-assign-role'),
        path('<int:pk>/delete-user/', views.AdminUserViewSet.as_view({'delete': 'delete_user'}), name='admin-delete-user'),
    ])),
    
    # Include router URLs
    path('', include(router.urls)),
]
