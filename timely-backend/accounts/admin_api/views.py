# accounts/admin_api/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.contrib.auth import get_user_model

from .serializers import (
    AdminUserSerializer, AdminUserListSerializer, AdminUserCreateSerializer
)
from accounts.permissions import IsAdmin

User = get_user_model()


class AdminUserViewSet(viewsets.ModelViewSet):
    """ViewSet for admin user management"""
    
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['email', 'username', 'first_name', 'last_name']
    filterset_fields = ['role', 'is_active', 'is_verified', 'email_verified']
    ordering_fields = ['email', 'username', 'created_at', 'last_login']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return AdminUserListSerializer
        elif self.action == 'create':
            return AdminUserCreateSerializer
        return AdminUserSerializer
    
    def get_queryset(self):
        """Filter users based on query parameters"""
        queryset = super().get_queryset()
        
        # Search query
        q = self.request.query_params.get('q')
        if q:
            queryset = queryset.filter(
                Q(email__icontains=q) |
                Q(username__icontains=q) |
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q)
            )
        
        # Role filter
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Active status filter
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        """Create user with current admin as creator"""
        user = serializer.save()
        
        # Send realtime update
        self._send_realtime_update(user, 'created')
        
        return user
    
    def perform_update(self, serializer):
        """Update user and send realtime update"""
        user = serializer.save()
        
        # Send realtime update
        self._send_realtime_update(user, 'updated')
        
        return user
    
    def perform_destroy(self, instance):
        """Soft delete user (deactivate)"""
        instance.is_active = False
        instance.save()
        
        # Send realtime update
        self._send_realtime_update(instance, 'deactivated')
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a user"""
        user = self.get_object()
        
        if user.is_active:
            return Response(
                {"detail": "User is already active"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.is_active = True
        user.save()
        
        # Send realtime update
        self._send_realtime_update(user, 'activated')
        
        return Response({"detail": "User activated successfully"})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user"""
        user = self.get_object()
        
        if not user.is_active:
            return Response(
                {"detail": "User is already inactive"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.is_active = False
        user.save()
        
        # Send realtime update
        self._send_realtime_update(user, 'deactivated')
        
        return Response({"detail": "User deactivated successfully"})
    
    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """Change user role"""
        user = self.get_object()
        new_role = request.data.get('role')
        
        if not new_role:
            return Response(
                {"detail": "Role is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_role not in [choice[0] for choice in User.Role.choices]:
            return Response(
                {"detail": "Invalid role"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_role = user.role
        user.role = new_role
        user.save()
        
        # Send realtime update
        self._send_realtime_update(user, 'role_changed', {
            'old_role': old_role,
            'new_role': new_role
        })
        
        return Response({
            "detail": "User role changed successfully",
            "old_role": old_role,
            "new_role": new_role
        })
    
    def _send_realtime_update(self, user, action, extra_data=None):
        """Send realtime update via WebSocket (safe no-op if Channels not available)"""
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            
            channel_layer = get_channel_layer()
            if channel_layer:
                payload = {
                    'type': 'user_update',
                    'user_id': user.id,
                    'action': action,
                    'data': {
                        'id': user.id,
                        'email': user.email,
                        'username': user.username,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role,
                        'is_active': user.is_active,
                        'is_verified': user.is_verified,
                        'email_verified': user.email_verified,
                    }
                }
                if extra_data:
                    payload['data'].update(extra_data)
                
                # Send to admin group
                async_to_sync(channel_layer.group_send)(
                    'admin:users',
                    payload
                )
        except ImportError:
            # Channels not available, silently continue
            pass
