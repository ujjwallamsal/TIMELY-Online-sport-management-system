# timely/urls.py
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

# Import views (only what's actually used in this file)
# from reports.views import TicketSummaryReport, TicketCSVExport  # Old views, now handled by ReportsViewSet
# from reports.views_admin import AdminOverviewView  # Old view, now handled by ReportsViewSet
# from tickets.views import StripeWebhookView, PayPalWebhookView  # Views don't exist yet
from tickets.public_views import PublicCheckoutView
# from registrations.views import secure_document_download

from django.http import HttpResponse

def _public_events_new_noop(_request):
    # Quietly acknowledge stray GETs from extensions/prefetchers.
    # We purposely do NOT implement public "new" creation here.
    return HttpResponse(status=204)

@api_view(['GET'])
@permission_classes([AllowAny])
def test_public_endpoint(request):
    return JsonResponse({"message": "Public endpoint works!", "status": "success"})

# Old public endpoints removed - now handled by public app

# ---------------------------------------------------------------------------

router = DefaultRouter()

# Only register viewsets that don't have their own URL files
# router.register(r"users", UserViewSet, basename="user")
# router.register(r"venues", VenueViewSet)
# router.register(r"events", EventViewSet, basename="event")
# router.register(r"divisions", DivisionViewSet, basename="division")
# router.register(r"teams", TeamViewSet)
# router.register(r"athletes", AthleteProfileViewSet)
# router.register(r"registrations", RegistrationViewSet, basename="registration")
# router.register(r"documents", DocumentViewSet, basename="document")  # Temporarily commented out
# router.register(r"fixtures", FixtureViewSet, basename="fixture")
# router.register(r"matches", MatchViewSet, basename="match")
# router.register(r"match-entries", MatchEntryViewSet, basename="matchentry")
# router.register(r"results", ResultViewSet)
# router.register(r"ticket-types", TicketTypeViewSet, basename="tickettype")
# router.register(r"ticket-orders", TicketOrderViewSet, basename="ticketorder")
# router.register(r"tickets", TicketViewSet, basename="ticket")
# router.register(r"payment-records", PaymentRecordViewSet, basename="paymentrecord")
# router.register(r"notifications", NotificationViewSet, basename="notification")

# Public spectator APIs (no auth) - Handled by individual app URLs
# router.register(r"public/events", PublicEventViewSet, basename="public-events")
# router.register(r"public/matches", PublicMatchViewSet, basename="public-matches")
# router.register(r"public/results", PublicResultViewSet, basename="public-results")
# router.register(r"public/news", PublicAnnouncementViewSet, basename="public-news")

# Gallery APIs - Handled by gallery app
# router.register(r"albums", AlbumViewSet, basename="album")
# router.register(r"media", MediaAssetViewSet, basename="media")
# router.register(r"public/albums", PublicAlbumViewSet, basename="public-albums")
# router.register(r"public/media", PublicMediaAssetViewSet, basename="public-media")

# ---------------------------------------------------------------------------

from common.views import HealthView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),

    # Admin
    path("admin/", admin.site.urls),
    
    # Test public endpoint
    path("api/test-public/", test_public_endpoint, name="test-public"),
    
    # Public spectator portal endpoints
    path("api/public/", include("public.urls")),
    
    # API routes - Clean, single-level paths
    path("api/accounts/", include("accounts.urls")),
    path("api/admin/", include("accounts.admin_api.urls")),
    path("api/events/", include("events.urls")),
    path("api/venues/", include("venues.urls")),
    path("api/teams/", include("teams.urls")),
    path("api/registrations/", include("registrations.urls")),
    path("api/fixtures/", include("fixtures.urls")),
    path("api/results/", include("results.urls")),
    path("api/tickets/", include("tickets.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/content/", include("content.urls")),
    path("api/gallery/", include("gallery.urls")),
    path("api/media/", include("mediahub.urls")),
    path("api/admin/", include("adminapi.urls")),
    path("api/kyc/", include("kyc.urls")),
    path("api/audit/", include("audit.urls")),
    path("api/settings/", include("settingshub.urls")),
    path("api/privacy/", include("privacy.urls")),
    
    # Legacy public APIs (kept for backward compatibility)
    path("api/fixtures/public/", include("fixtures.urls")),
    
    # OpenAPI / Docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    
    # --- QUIET STUB to silence stray extension calls ---
    path("api/public/events/new/", _public_events_new_noop),
    
    # Include router URLs last
    path("api/", include(router.urls)),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

