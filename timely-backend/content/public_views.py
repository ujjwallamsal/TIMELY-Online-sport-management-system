# content/public_views.py
from __future__ import annotations
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Announcement
from .serializers import AnnouncementSerializer

class PublicAnnouncementViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = AnnouncementSerializer
    queryset = Announcement.objects.all()

    @action(detail=False, methods=['get'])
    def test(self, request):
        return Response({"message": "Test endpoint works!"})

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
