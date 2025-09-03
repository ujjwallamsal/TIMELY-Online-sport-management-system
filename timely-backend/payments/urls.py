from django.urls import path
from .views import (
    create_payment_intent,
    confirm_payment,
    payment_status,
    stripe_webhook,
    stripe_checkout,
    stripe_webhook_tickets,
    create_refund,
)

urlpatterns = [
    # Registration payments
    path("create-intent/", create_payment_intent, name="create-payment-intent"),
    path("confirm/", confirm_payment, name="confirm-payment"),
    path("status/<int:registration_id>/", payment_status, name="payment-status"),
    path("webhooks/stripe/", stripe_webhook, name="stripe-webhook"),
    
    # Ticket payments
    path("stripe/checkout/", stripe_checkout, name="stripe-checkout"),
    path("stripe/webhook/", stripe_webhook_tickets, name="stripe-webhook-tickets"),
    path("refund/<int:order_id>/", create_refund, name="create-refund"),
]
