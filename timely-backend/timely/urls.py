# timely/urls.py
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

# Private (authenticated) viewsets
from accounts.views import UserViewSet
from venues.views import VenueViewSet
from events.views import EventViewSet, DivisionViewSet
from teams.views import TeamViewSet, AthleteProfileViewSet
from registrations.views import RegistrationViewSet, secure_document_download
# from registrations.views import RegistrationViewSet, DocumentViewSet, secure_document_download
from payments.views import create_payment_intent, confirm_payment, payment_status, stripe_webhook
from fixtures.views import FixtureViewSet, MatchViewSet, MatchEntryViewSet
from results.views import ResultViewSet
from tickets.views import (
    TicketTypeViewSet, TicketOrderViewSet, TicketViewSet, PaymentRecordViewSet,
    StripeWebhookView, PayPalWebhookView, TicketValidationView
)
from notifications.views import NotificationViewSet

# Public (read-only) viewsets
from events.public_views import PublicEventViewSet
from fixtures.public_views import PublicMatchViewSet
from results.public_views import PublicResultViewSet
from content.public_views import PublicAnnouncementViewSet

# Public (create-only) endpoint (FR43)
from tickets.public_views import PublicCheckoutView

from reports.views import TicketSummaryReport, TicketCSVExport

from reports.views_admin import AdminOverviewView


from django.http import HttpResponse  # add this import (you already import JsonResponse)

def _public_events_new_noop(_request):
    # Quietly acknowledge stray GETs from extensions/prefetchers.
    # We purposely do NOT implement public "new" creation here.
    return HttpResponse(status=204)


# Gallery (private + public)
from gallery.views import (
    AlbumViewSet, MediaAssetViewSet,
    PublicAlbumViewSet, PublicMediaViewSet,
)

# ---------------------------------------------------------------------------

router = DefaultRouter()

# Auth-required APIs


router.register(r"users", UserViewSet, basename="user")
router.register(r"venues", VenueViewSet)
router.register(r"events", EventViewSet, basename="event")
router.register(r"divisions", DivisionViewSet, basename="division")
router.register(r"teams", TeamViewSet)
router.register(r"athletes", AthleteProfileViewSet)
router.register(r"registrations", RegistrationViewSet, basename="registration")
# router.register(r"documents", DocumentViewSet, basename="document")  # Temporarily commented out
router.register(r"fixtures", FixtureViewSet, basename="fixture")
router.register(r"matches", MatchViewSet, basename="match")
router.register(r"match-entries", MatchEntryViewSet, basename="matchentry")
router.register(r"results", ResultViewSet)
router.register(r"ticket-types", TicketTypeViewSet, basename="tickettype")
router.register(r"ticket-orders", TicketOrderViewSet, basename="ticketorder")
router.register(r"tickets", TicketViewSet, basename="ticket")
router.register(r"payment-records", PaymentRecordViewSet, basename="paymentrecord")
router.register(r"notifications", NotificationViewSet, basename="notification")

# Public spectator APIs (no auth)
router.register(r"public/events", PublicEventViewSet, basename="public-events")
router.register(r"public/matches", PublicMatchViewSet, basename="public-matches")
router.register(r"public/results", PublicResultViewSet, basename="public-results")
router.register(r"public/news", PublicAnnouncementViewSet, basename="public-news")

# Gallery APIs
router.register(r"albums", AlbumViewSet, basename="album")
router.register(r"media", MediaAssetViewSet, basename="media")
router.register(r"public/albums", PublicAlbumViewSet, basename="public-albums")
router.register(r"public/media", PublicMediaViewSet, basename="public-media")


# ---------------------------------------------------------------------------

def health(_request):
    return JsonResponse({"status": "ok", "app": "Timely API"})

urlpatterns = [
    path("", health, name="health"),

    # Admin
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),


    # OpenAPI / Docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
 # --- QUIET STUB to silence stray extension calls ---
    path("api/public/events/new/", _public_events_new_noop),
    # API routes
    path("api/", include(router.urls)),
    path("api/reports/", include("reports.urls")),

    # Browsable API session auth (dev helper)
    path("api/auth/", include("rest_framework.urls")),
    

    # JWT endpoints (obtain/refresh/verify in timely/jwt_urls.py)
    path("api/token/", include("timely.jwt_urls")),

    # Public checkout (FR43)
    path("api/public/checkout/", PublicCheckoutView.as_view(), name="public-checkout"),
    
    # Secure document download
    path("api/documents/<uuid:token>/download/", secure_document_download, name="secure-document-download"),
    
    # Payment endpoints
    path("api/payments/create-intent/", create_payment_intent, name="create-payment-intent"),
    path("api/payments/confirm/", confirm_payment, name="confirm-payment"),
    path("api/payments/status/<int:registration_id>/", payment_status, name="payment-status"),
    path("api/webhooks/stripe/", stripe_webhook, name="stripe-webhook"),
    
    # Ticketing endpoints
    path("api/webhooks/stripe-tickets/", StripeWebhookView.as_view({'post': 'stripe_webhook'}), name="stripe-tickets-webhook"),
    path("api/webhooks/paypal-tickets/", PayPalWebhookView.as_view({'post': 'paypal_webhook'}), name="paypal-tickets-webhook"),
    path("api/tickets/validate/", TicketValidationView.as_view({'post': 'validate_ticket'}), name="validate-ticket"),

    path("api/reports/tickets/summary", TicketSummaryReport.as_view(), name="report-ticket-summary"),
    path("api/reports/tickets/export.csv", TicketCSVExport.as_view(), name="report-ticket-export"),
    path("api/reports/admin/overview/", AdminOverviewView.as_view(), name="admin-overview"),

]

# Serve uploaded media in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

