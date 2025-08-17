# content/public_views.py
from __future__ import annotations
from rest_framework import viewsets, permissions, filters
from .models import Announcement
from .serializers import AnnouncementSerializer  # or PublicAnnouncementSerializer if you already created it

class PublicAnnouncementViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = AnnouncementSerializer  # change to PublicAnnouncementSerializer if you added it

    # Keep it simple: search + ordering only (NO DjangoFilterBackend, NO filterset_fields)
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "body", "event__name"]
    ordering_fields = ["created_at", "title"]
    ordering = ["-created_at"]

    lookup_field = "slug"
    lookup_value_regex = r"[-a-z0-9]+"

    def get_queryset(self):
        qs = (
            Announcement.objects
            .filter(is_published=True)
            .select_related("author")
            .order_by("-created_at")
        )
        # Only touch event if it actually exists on the model
        model_fields = {f.name for f in Announcement._meta.get_fields()}
        if "event" in model_fields:
            qs = qs.select_related("event", "event__venue")
            ev = self.request.query_params.get("event")
            if ev:
                qs = qs.filter(event_id=int(ev)) if ev.isdigit() else qs.filter(event__slug=ev)
        return qs
