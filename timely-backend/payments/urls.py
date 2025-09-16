from django.urls import path
from .views import (
    create_payment_intent,
    confirm_payment,
    payment_status,
    stripe_webhook,
    stripe_checkout,
    stripe_webhook_tickets,
    create_refund,
    create_payment_session,
    process_refund,
    get_available_providers,
    paypal_webhook,
    confirm_offline_payment,
)

urlpatterns = [
    # Registration payments
    path("create-intent/", create_payment_intent, name="create-payment-intent"),
    path("confirm/", confirm_payment, name="confirm-payment"),
    path("status/<int:registration_id>/", payment_status, name="payment-status"),
    path("webhooks/stripe/", stripe_webhook, name="stripe-webhook"),
    
    # Multi-provider payments
    path("session/", create_payment_session, name="create-payment-session"),
    path("refund/", process_refund, name="process-refund"),
    path("providers/", get_available_providers, name="get-providers"),
    path("webhooks/paypal/", paypal_webhook, name="paypal-webhook"),
    path("offline/confirm/", confirm_offline_payment, name="confirm-offline-payment"),
    
    # Ticket payments (legacy)
    path("stripe/checkout/", stripe_checkout, name="stripe-checkout"),
    path("stripe/webhook/", stripe_webhook_tickets, name="stripe-webhook-tickets"),
    path("refund/<int:order_id>/", create_refund, name="create-refund"),
]
