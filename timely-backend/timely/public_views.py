from rest_framework import viewsets, permissions
from rest_framework.response import Response
from content.models import Announcement
from content.serializers import AnnouncementSerializer

class MainPublicAnnouncementViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = AnnouncementSerializer
    queryset = Announcement.objects.filter(is_published=True).order_by("-created_at")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
