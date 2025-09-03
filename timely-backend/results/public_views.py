# results/public_views.py
from __future__ import annotations

from rest_framework import viewsets, permissions

from .models import Result
from .serializers import ResultSerializer


class PublicResultViewSet(viewsets.ReadOnlyModelViewSet):
    """
    FR44 — Public results.
    """
    permission_classes = [permissions.AllowAny]  # Use DRF's built-in AllowAny
    authentication_classes = []  # Override global authentication - no auth required
    serializer_class = ResultSerializer
    filter_backends = []  # Disable all filters to avoid issues
    filterset_fields = []  # No filters

    queryset = (
        Result.objects
        .select_related("match")
        .all()
    )
