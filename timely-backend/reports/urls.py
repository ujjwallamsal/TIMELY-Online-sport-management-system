# reports/urls.py


from django.urls import path
from . import views

urlpatterns = [
    path("registrations/", views.registration_report),
    path("tickets/", views.ticket_sales_report),
    path("attendance/", views.attendance_report),
]
