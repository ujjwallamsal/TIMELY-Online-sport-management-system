from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Event
from .serializers import EventSerializer

class IsOrganizerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return True  # safe methods allowed by default
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return user.is_authenticated and (user.is_superuser or user.role in ("ORGANIZER","ADMIN"))

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.select_related("venue").all().order_by("-start_date")
    serializer_class = EventSerializer
    permission_classes = [IsOrganizerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "sport_type", "venue"]
    search_fields = ["name", "sport_type", "eligibility_notes"]
    ordering_fields = ["start_date", "end_date", "name"]
