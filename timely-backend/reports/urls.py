# reports/urls.py
from django.urls import path
from .views import export_pdf, export_csv, get_report_data_api, get_available_events, get_report_summary
from .views_csv import (
    stream_registrations_csv, stream_fixtures_csv, 
    stream_results_csv, stream_ticket_sales_csv
)

app_name = 'reports'

urlpatterns = [
    # Reports endpoints
    path('export/', export_pdf, name='export-pdf'),
    path('<str:report_type>.csv', export_csv, name='export-csv'),
    path('data/', get_report_data_api, name='report-data'),
    path('events/', get_available_events, name='available-events'),
    path('summary/', get_report_summary, name='report-summary'),
    
    # Streaming CSV endpoints
    path('registrations.csv', stream_registrations_csv, name='stream-registrations-csv'),
    path('fixtures.csv', stream_fixtures_csv, name='stream-fixtures-csv'),
    path('results.csv', stream_results_csv, name='stream-results-csv'),
    path('ticket_sales.csv', stream_ticket_sales_csv, name='stream-ticket-sales-csv'),
]