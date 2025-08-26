# results/public_views.py
from __future__ import annotations

from rest_framework import viewsets, permissions

from .models import Result
from .serializers import ResultSerializer


class PublicResultViewSet(viewsets.ReadOnlyModelViewSet):
    """
    FR44 — Public results.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = ResultSerializer

    queryset = (
        Result.objects
        .select_related("match", "match__venue")
        .all()
    )
