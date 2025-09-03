from __future__ import annotations
from datetime import datetime
from typing import Optional

from django.db.models import Sum, Count
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response

from tickets.models import Ticket
from fixtures.models import Fixture
from .permissions import IsOrganizerOrAdmin


from django.db.models import Count, Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from rest_framework.permissions import IsAdminUser
from registrations.models import Registration









@api_view(["GET"])
@permission_classes([IsAdminUser])
def registration_report(request):
    data = Registration.objects.values("event__name").annotate(total=Count("id"))
    return Response(list(data))

@api_view(["GET"])
@permission_classes([IsAdminUser])
def ticket_sales_report(request):
    data = Ticket.objects.values("match__event__name").annotate(total_sales=Sum("price_cents"))
    return Response(list(data))

@api_view(["GET"])
@permission_classes([IsAdminUser])
def attendance_report(request):
    data = Fixture.objects.values("event__name").annotate(total_matches=Count("id"))
    return Response(list(data))



def parse_date(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    return datetime.strptime(s, "%Y-%m-%d")


def filtered_tickets(request):
    """Filter ACTIVE tickets by optional from/to (match.start_time) and event."""
    qs = Ticket.objects.filter(status=Ticket.Status.ACTIVE).select_related("match", "match__event")
    dfrom = parse_date(request.query_params.get("from"))
    dto = parse_date(request.query_params.get("to"))
    event_id = request.query_params.get("event")
    if dfrom:
        qs = qs.filter(match__start_time__date__gte=dfrom.date())
    if dto:
        qs = qs.filter(match__start_time__date__lte=dto.date())
    if event_id:
        qs = qs.filter(match__event_id=event_id)
    return qs


class TicketSummaryReport(APIView):
    """
    FR59, FR62 — totals and revenue
    GET /api/reports/tickets/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&event=<id>
    """
    permission_classes = [IsOrganizerOrAdmin]

    def get(self, request):
        qs = filtered_tickets(request)
        agg = qs.aggregate(
            tickets=Count("id"),
            quantity=Sum("quantity"),
            revenue_cents=Sum("price_cents"),
        )
        # top events by revenue
        top_events = (
            qs.values("match__event_id", "match__event__name")
              .annotate(revenue_cents=Sum("price_cents"), qty=Sum("quantity"))
              .order_by("-revenue_cents")[:10]
        )
        return Response({
            "filters": {
                "from": request.query_params.get("from"),
                "to": request.query_params.get("to"),
                "event": request.query_params.get("event"),
            },
            "totals": {
                "ticket_rows": agg["tickets"] or 0,
                "quantity": agg["quantity"] or 0,
                "revenue_cents": agg["revenue_cents"] or 0,
            },
            "top_events": list(top_events),
        })


class TicketCSVExport(APIView):
    """
    FR65 — CSV export
    GET /api/reports/tickets/export.csv?from=YYYY-MM-DD&to=YYYY-MM-DD&event=<id>
    """
    permission_classes = [IsOrganizerOrAdmin]

    def get(self, request):
        qs = filtered_tickets(request).select_related("purchaser")
        # Build CSV in memory
        rows = [
            "ticket_id,created_at,match_id,event_id,event_name,quantity,price_cents,purchaser_email\n"
        ]
        for t in qs:
            rows.append(",".join([
                str(t.id),
                t.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                str(t.match_id),
                str(t.match.event_id),
                f"\"{t.match.event.name}\"",
                str(t.quantity),
                str(t.price_cents),
                f"\"{getattr(t.purchaser, 'email', '')}\"",
            ]) + "\n")

        resp = HttpResponse("".join(rows), content_type="text/csv")
        resp["Content-Disposition"] = "attachment; filename=ticket_report.csv"
        return resp


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def registrations_summary(request):
    data = (
        Registration.objects
        .values("event")
        .annotate(total=Count("id"), paid=Count("id", filter=~Registration.objects.filter(is_paid=False).query.where))
        .order_by("-total")[:10]
    )
    return Response({"top_events": list(data)})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def attendance_by_match(request):
    data = (
        Ticket.objects
        .values("match")
        .annotate(quantity=Sum("quantity"))
        .order_by("-quantity")[:20]
    )
    return Response({"attendance": list(data)})
