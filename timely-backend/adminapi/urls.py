from django.urls import path
from . import views

app_name = 'adminapi'

urlpatterns = [
    # KPI endpoint
    path('kpis/', views.get_kpis, name='kpis'),
    
    # Drilldown endpoints
    path('drill/users/', views.drill_users, name='drill_users'),
    path('drill/events/', views.drill_events, name='drill_events'),
    path('drill/registrations/', views.drill_registrations, name='drill_registrations'),
    path('drill/orders/', views.drill_orders, name='drill_orders'),
    path('audit/', views.audit_logs, name='audit_logs'),
    
    # CSV export endpoint
    path('export/<str:kind>/', views.export_csv, name='export_csv'),
]
