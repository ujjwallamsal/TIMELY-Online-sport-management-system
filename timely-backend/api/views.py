# api/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Announcement
from .v1.serializers import AnnouncementSerializer, AnnouncementCreateSerializer
from realtime.services import broadcast_announcement_update
from events.models import Event
from accounts.permissions import IsOrganizer


class AnnouncementViewSet(viewsets.ModelViewSet):
    """ViewSet for managing announcements"""
    
    queryset = Announcement.objects.select_related('event', 'sent_by').all()
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AnnouncementCreateSerializer
        return AnnouncementSerializer
    
    def get_queryset(self):
        """Filter announcements based on user permissions"""
        queryset = super().get_queryset()
        
        # Filter by event if specified
        event_id = self.request.query_params.get('event_id')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        # Filter by audience if specified
        audience = self.request.query_params.get('audience')
        if audience:
            queryset = queryset.filter(audience=audience)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create announcement with proper permissions"""
        event_id = self.request.data.get('event_id')
        event = get_object_or_404(Event, id=event_id)
        
        # Check permissions - only organizers can create announcements
        if not IsOrganizer().has_permission(self.request, self):
            self.permission_denied(self.request)
        
        announcement = serializer.save(
            event=event,
            sent_by=self.request.user
        )
        
        # Broadcast real-time update
        broadcast_announcement_update(
            event.id,
            announcement,
            f"New announcement: {announcement.subject}"
        )
    
    def perform_update(self, serializer):
        """Update announcement and broadcast changes"""
        announcement = serializer.save()
        
        # Broadcast real-time update
        broadcast_announcement_update(
            announcement.event.id,
            announcement,
            f"Announcement updated: {announcement.subject}"
        )
    
    def perform_destroy(self, instance):
        """Delete announcement and broadcast removal"""
        event_id = instance.event.id
        subject = instance.subject
        
        instance.delete()
        
        # Broadcast real-time update
        broadcast_announcement_update(
            event_id,
            None,
            f"Announcement removed: {subject}"
        )
    
    @action(detail=False, methods=['post'], url_path='broadcast')
    def broadcast_announcement(self, request):
        """Broadcast announcement to all event subscribers"""
        event_id = request.data.get('event_id')
        subject = request.data.get('subject')
        body = request.data.get('body')
        audience = request.data.get('audience', 'ALL')
        
        if not event_id or not subject or not body:
            return Response(
                {'detail': 'event_id, subject, and body are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        event = get_object_or_404(Event, id=event_id)
        
        # Check permissions
        if not IsOrganizer().has_permission(request, self):
            return Response(
                {'detail': 'You do not have permission to broadcast announcements.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create announcement
        announcement = Announcement.objects.create(
            event=event,
            subject=subject,
            body=body,
            audience=audience,
            sent_by=request.user
        )
        
        # Broadcast real-time update
        broadcast_announcement_update(
            event.id,
            announcement,
            f"Live announcement: {announcement.subject}"
        )
        
        serializer = self.get_serializer(announcement)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
