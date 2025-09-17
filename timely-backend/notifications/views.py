"""
Views for notifications and messaging system.
Implements REST endpoints with RBAC and rate limiting.
"""
from __future__ import annotations

from typing import Any
from django.db.models import QuerySet, Q
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import viewsets, permissions, status, pagination
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Notification, MessageThread, MessageParticipant, Message
from .serializers import (
    NotificationSerializer, NotificationCreateSerializer, AnnouncementSerializer,
    MessageThreadSerializer, MessageThreadCreateSerializer, MessageSerializer,
    MessageCreateSerializer, MessageParticipantSerializer
)
from .permissions import (
    NotificationPermissions, AnnouncementPermissions, MessageThreadPermissions,
    MessagePermissions, RateLimitPermission
)
from .services.email_sms import send_notification_email, send_notification_sms

User = get_user_model()


class NotificationPagination(pagination.PageNumberPagination):
    """Pagination for notifications"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class MessagePagination(pagination.PageNumberPagination):
    """Pagination for messages"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for notifications.
    Users can read their own notifications and mark them as read.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, NotificationPermissions]
    pagination_class = NotificationPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['kind', 'topic', 'read_at']
    search_fields = ['title', 'body']
    ordering_fields = ['created_at', 'read_at']
    ordering = ['-created_at']

    def get_queryset(self) -> QuerySet[Notification]:
        """Get notifications for the current user"""
        qs = Notification.objects.filter(user=self.request.user)
        
        # Filter by read status
        read_status = self.request.query_params.get('read')
        if read_status == 'false':
            qs = qs.filter(read_at__isnull=True)
        elif read_status == 'true':
            qs = qs.filter(read_at__isnull=False)
        
        return qs.select_related('user').order_by('-created_at')

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request, *args: Any, **kwargs: Any) -> Response:
        """Mark all notifications as read"""
        count = self.get_queryset().filter(read_at__isnull=True).update(
            read_at=timezone.now()
        )
        return Response({"updated": count}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None, *args: Any, **kwargs: Any) -> Response:
        """Mark a specific notification as read"""
        notification = self.get_object()
        notification.mark_read()
        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)


class AnnouncementView(APIView):
    """
    Create announcements for scoped audiences.
    Organizer can only target their own event/team participants.
    Admin can target any participants.
    """
    permission_classes = [permissions.IsAuthenticated, AnnouncementPermissions]

    def post(self, request, *args, **kwargs):
        """Create announcement and fan-out to participants"""
        serializer = AnnouncementSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        scope = data['scope']
        scope_id = data['scope_id']
        
        # Get target users based on scope
        target_users = self._get_target_users(scope, scope_id, request.user)
        
        if not target_users:
            return Response(
                {"detail": "No participants found for the specified scope"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create notifications for all target users
        notifications = []
        for user in target_users:
            notification = Notification.objects.create(
                user=user,
                kind=data['kind'],
                topic=data['topic'],
                title=data['title'],
                body=data['body'],
                link_url=data.get('link_url')
            )
            notifications.append(notification)
            
            # Send email/SMS (stubs)
            send_notification_email(notification)
            send_notification_sms(notification)

        return Response({
            "detail": f"Announcement sent to {len(notifications)} participants",
            "notifications_created": len(notifications)
        }, status=status.HTTP_201_CREATED)

    def _get_target_users(self, scope: str, scope_id: str, user) -> QuerySet[User]:
        """Get target users based on scope and user permissions"""
        if scope == 'event':
            from events.models import Event
            try:
                event = Event.objects.get(id=scope_id)
                # Check if user is organizer for this event
                if not user.is_staff and not event.organizers.filter(id=user.id).exists():
                    return User.objects.none()
                
                # Get all participants of this event
                return User.objects.filter(
                    registrations__event=event,
                    registrations__is_paid=True
                ).distinct()
            except Event.DoesNotExist:
                return User.objects.none()
        
        elif scope == 'team':
            from teams.models import Team
            try:
                team = Team.objects.get(id=scope_id)
                # Check if user is organizer for this team
                if not user.is_staff and not team.organizers.filter(id=user.id).exists():
                    return User.objects.none()
                
                # Get all team members
                return team.members.all()
            except Team.DoesNotExist:
                return User.objects.none()
        
        elif scope == 'registration':
            from registrations.models import Registration
            try:
                registration = Registration.objects.get(id=scope_id)
                # Check if user is organizer for the event
                if not user.is_staff and not registration.event.organizers.filter(id=user.id).exists():
                    return User.objects.none()
                
                return User.objects.filter(id=registration.user.id)
            except Registration.DoesNotExist:
                return User.objects.none()
        
        return User.objects.none()


class MessageThreadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for message threads.
    Users can create threads and view threads they participate in.
    """
    serializer_class = MessageThreadSerializer
    permission_classes = [permissions.IsAuthenticated, MessageThreadPermissions]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['scope', 'scope_id']
    search_fields = ['title']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self) -> QuerySet[MessageThread]:
        """Get threads where user is a participant"""
        return MessageThread.objects.filter(
            participants__user=self.request.user
        ).select_related('created_by').prefetch_related('participants__user').order_by('-created_at')

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return MessageThreadCreateSerializer
        return MessageThreadSerializer

    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def add_participant(self, request, pk=None, *args, **kwargs):
        """Add participant to thread"""
        thread = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {"detail": "user_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is already a participant
        if thread.participants.filter(user=user).exists():
            return Response(
                {"detail": "User is already a participant"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create participant
        participant = MessageParticipant.objects.create(
            thread=thread,
            user=user,
            role='participant'
        )
        
        return Response(
            MessageParticipantSerializer(participant).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['delete'], url_path='participants/(?P<user_id>[^/.]+)')
    def remove_participant(self, request, pk=None, user_id=None, *args, **kwargs):
        """Remove participant from thread"""
        thread = self.get_object()
        
        try:
            participant = thread.participants.get(user_id=user_id)
            participant.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except MessageParticipant.DoesNotExist:
            return Response(
                {"detail": "Participant not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None, *args, **kwargs):
        """Get messages for a thread"""
        thread = self.get_object()
        
        # Check if user is participant
        if not thread.participants.filter(user=request.user).exists():
            return Response(
                {"detail": "Not a participant in this thread"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update last_read_at for current user
        participant = thread.participants.get(user=request.user)
        participant.last_read_at = timezone.now()
        participant.save(update_fields=['last_read_at'])
        
        # Get messages
        messages = thread.messages.filter(deleted_at__isnull=True).select_related('sender')
        
        # Pagination
        paginator = MessagePagination()
        page = paginator.paginate_queryset(messages, request)
        
        if page is not None:
            serializer = MessageSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None, *args, **kwargs):
        """Send message to thread"""
        thread = self.get_object()
        
        # Check if user is participant
        if not thread.participants.filter(user=request.user).exists():
            return Response(
                {"detail": "Not a participant in this thread"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = MessageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Create message
        message = Message.objects.create(
            thread=thread,
            sender=request.user,
            body=serializer.validated_data['body']
        )
        
        # Update last_read_at for sender
        participant = thread.participants.get(user=request.user)
        participant.last_read_at = timezone.now()
        participant.save(update_fields=['last_read_at'])
        
        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED
        )


class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for individual messages.
    Users can edit/delete their own messages.
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, MessagePermissions, RateLimitPermission]

    def get_queryset(self) -> QuerySet[Message]:
        """Get messages from threads where user is a participant"""
        return Message.objects.filter(
            thread__participants__user=self.request.user,
            deleted_at__isnull=True
        ).select_related('sender', 'thread')

    def perform_update(self, serializer):
        """Set edited_at timestamp"""
        serializer.save(edited_at=timezone.now())

    def perform_destroy(self, instance):
        """Soft delete message"""
        instance.soft_delete()