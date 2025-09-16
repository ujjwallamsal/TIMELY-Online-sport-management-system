# tickets/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'tickets'

urlpatterns = [
    # Public/Authenticated ticket type views
    path('events/<int:event_id>/types/', 
         views.TicketTypeListView.as_view(), 
         name='event-ticket-types'),
    
    # Order management
    path('checkout/', 
         views.checkout, 
         name='checkout'),
    path('orders/', 
         views.create_order, 
         name='create-order'),
    path('orders/<int:order_id>/', 
         views.OrderDetailView.as_view(), 
         name='order-detail'),
    path('orders/<int:order_id>/cancel/', 
         views.cancel_order, 
         name='cancel-order'),
    path('orders/<int:order_id>/refund/', 
         views.refund_order, 
         name='refund-order'),
    path('orders/<int:order_id>/refunds/', 
         views.get_order_refunds, 
         name='order-refunds'),
    path('orders/<int:order_id>/summary/', 
         views.order_summary, 
         name='order-summary'),
    
    # My tickets
    path('mine/', 
         views.MyTicketsListView.as_view(), 
         name='my-tickets'),
    path('tickets/<int:ticket_id>/', 
         views.TicketDetailView.as_view(), 
         name='ticket-detail'),
    path('tickets/<int:ticket_id>/qr/', 
         views.ticket_qr, 
         name='ticket-qr'),
    path('tickets/<int:ticket_id>/checkin/', 
         views.checkin_ticket, 
         name='checkin-ticket'),
    
    # Organizer/Admin ticket type management
    path('events/<int:event_id>/types/create/', 
         views.TicketTypeCreateView.as_view(), 
         name='create-ticket-type'),
    path('types/<int:pk>/', 
         views.TicketTypeUpdateView.as_view(), 
         name='update-ticket-type'),
    path('types/<int:pk>/delete/', 
         views.TicketTypeDeleteView.as_view(), 
         name='delete-ticket-type'),
    
    # Organizer/Admin order management
    path('events/<int:event_id>/orders/', 
         views.EventOrdersListView.as_view(), 
         name='event-orders'),
    
    # Ticket validation (for check-in)
    path('tickets/<int:ticket_id>/validate/', 
         views.ticket_validation, 
         name='ticket-validation'),
    path('tickets/<int:ticket_id>/use/', 
         views.use_ticket, 
         name='use-ticket'),
    path('checkin/', 
         views.checkin_ticket, 
         name='checkin-ticket'),
]