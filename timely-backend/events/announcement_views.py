# events/announcement_views.py
"""
API views for announcements.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import Announcement, Event
from .serializers import AnnouncementSerializer
from .permissions import CanManageEvent


class AnnouncementViewSet(viewsets.ModelViewSet):
    """ViewSet for managing announcements"""
    
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated, CanManageEvent]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['event', 'type', 'priority', 'is_active']
    
    def get_queryset(self):
        """Get announcements for events the user can manage"""
        if self.request.user.is_staff:
            return Announcement.objects.all()
        
        # Only show announcements for events the user created or manages
        return Announcement.objects.filter(
            event__created_by=self.request.user
        ).select_related('event', 'created_by')
    
    def perform_create(self, serializer):
        """Create announcement and broadcast it"""
        announcement = serializer.save(created_by=self.request.user)
        
        # Broadcast the announcement
        if announcement.is_active:
            announcement.broadcast()
    
    def perform_update(self, serializer):
        """Update announcement and broadcast if needed"""
        old_instance = self.get_object()
        announcement = serializer.save()
        
        # Broadcast if announcement became active or was updated
        if announcement.is_active and (
            not old_instance.is_active or 
            old_instance.message != announcement.message or
            old_instance.title != announcement.title
        ):
            announcement.broadcast()
    
    @action(detail=True, methods=['post'])
    def broadcast(self, request, pk=None):
        """Manually broadcast an announcement"""
        announcement = self.get_object()
        
        if not announcement.is_active:
            return Response(
                {'error': 'Cannot broadcast inactive announcement'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        announcement.broadcast()
        
        return Response({
            'message': 'Announcement broadcasted successfully',
            'timestamp': timezone.now().isoformat()
        })
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active announcements for events"""
        queryset = self.get_queryset().filter(
            is_active=True,
            expires_at__isnull=True
        ) | self.get_queryset().filter(
            is_active=True,
            expires_at__gt=timezone.now()
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_event(self, request):
        """Get announcements for a specific event"""
        event_id = request.query_params.get('event_id')
        if not event_id:
            return Response(
                {'error': 'event_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response(
                {'error': 'Event not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user can view this event
        if not self._can_view_event(request.user, event):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        announcements = Announcement.objects.filter(
            event=event,
            is_active=True
        ).select_related('created_by').order_by('-priority', '-created_at')
        
        serializer = self.get_serializer(announcements, many=True)
        return Response(serializer.data)
    
    def _can_view_event(self, user, event):
        """Check if user can view the event"""
        # Public events can be viewed by anyone
        if event.visibility == 'PUBLIC':
            return True
        
        # Event creator can always view
        if event.created_by == user:
            return True
        
        # Check if user is registered for the event
        from registrations.models import Registration
        return Registration.objects.filter(
            event=event,
            applicant=user,
            status='APPROVED'
        ).exists()
