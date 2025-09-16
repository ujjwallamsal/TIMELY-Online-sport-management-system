# reports/urls.py
from django.urls import path
from .views import export_pdf, get_report_data_api, get_available_events, get_report_summary

app_name = 'reports'

urlpatterns = [
    # Reports endpoints
    path('export/', export_pdf, name='export-pdf'),
    path('data/', get_report_data_api, name='report-data'),
    path('events/', get_available_events, name='available-events'),
    path('summary/', get_report_summary, name='report-summary'),
]