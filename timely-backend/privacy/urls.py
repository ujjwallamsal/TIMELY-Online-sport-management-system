# privacy/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # User endpoints
    path('export/request/', views.request_data_export, name='request-data-export'),
    path('export/<uuid:request_id>/status/', views.get_export_status, name='get-export-status'),
    path('export/<uuid:request_id>/download/', views.download_export, name='download-export'),
    path('exports/', views.get_user_exports, name='get-user-exports'),
    
    path('deletion/request/', views.request_data_deletion, name='request-data-deletion'),
    path('deletion/<uuid:request_id>/status/', views.get_deletion_status, name='get-deletion-status'),
    path('deletions/', views.get_user_deletions, name='get-user-deletions'),
    
    # Admin endpoints
    path('admin/deletions/', views.admin_deletion_requests, name='admin-deletion-requests'),
    path('admin/deletions/<uuid:request_id>/approve/', views.admin_approve_deletion, name='admin-approve-deletion'),
    path('admin/deletions/<uuid:request_id>/reject/', views.admin_reject_deletion, name='admin-reject-deletion'),
]
