from __future__ import annotations

from datetime import timedelta

from django.utils import timezone
from django.db import models  # <-- needed for models.Sum
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from accounts.models import User
from events.models import Event
from fixtures.models import Fixture
from tickets.models import Ticket
from results.models import Result
from payments.models import PaymentIntent
# If you later want registration stats, import your model:
# from registrations.models import Registration


class AdminOverviewView(APIView):
    """
    Simple admin dashboard snapshot (FR56–FR60-ish): totals, recent activity, and upcoming.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        last_7d = now - timedelta(days=7)
        next_7d = now + timedelta(days=7)

        data = {
            "totals": {
                "users": User.objects.count(),
                "events": Event.objects.count(),
                "fixtures": Fixture.objects.count(),
                "tickets": Ticket.objects.count(),
                "results": Result.objects.count(),
                "payments": PaymentIntent.objects.count(),
            },
            "activity": {
                "new_users_7d": User.objects.filter(date_joined__gte=last_7d).count(),
                # Uncomment when you want real registration numbers:
                # "registrations_7d": Registration.objects.filter(created_at__gte=last_7d).count(),
                "tickets_7d": Ticket.objects.filter(purchased_at__gte=last_7d).count(),
                "revenue_cents_7d": (
                    PaymentIntent.objects.filter(created_at__gte=last_7d, status="succeeded")
                    .aggregate(total=models.Sum("amount_cents"))
                    .get("total") or 0
                ),
            },
            "upcoming": {
                # Events that intersect the next 7 days
                "events_next_7d": Event.objects.filter(
                    start_date__lte=next_7d.date(),
                    end_date__gte=now.date(),
                ).count(),
                # Matches starting within the next 7 days
                "fixtures_next_7d": Fixture.objects.filter(
                    starts_at__gte=now, starts_at__lte=next_7d
                ).order_by("starts_at").count(),
            },
        }
        return Response(data)
