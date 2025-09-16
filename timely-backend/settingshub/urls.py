# settingshub/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Site settings
    path('site/', views.site_settings, name='site-settings'),
    path('site/public/', views.public_site_settings, name='public-site-settings'),
    path('site/maintenance/toggle/', views.toggle_maintenance_mode, name='toggle-maintenance-mode'),
    
    # Feature flags
    path('flags/', views.feature_flags, name='feature-flags'),
    path('admin/flags/', views.admin_feature_flags, name='admin-feature-flags'),
    path('admin/flags/<int:flag_id>/', views.admin_feature_flag_detail, name='admin-feature-flag-detail'),
    
    # System status
    path('status/', views.system_status, name='system-status'),
]
