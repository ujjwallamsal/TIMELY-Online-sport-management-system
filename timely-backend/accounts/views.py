# accounts/views.py
from __future__ import annotations

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import login, logout
from django.utils import timezone
from django.db.models import Q
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.db import models

from .models import User, UserRole, EmailVerificationToken, PasswordResetToken, AuditLog
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.auth import set_jwt_cookies, clear_jwt_cookies
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    UserRoleSerializer, UserRoleAssignmentSerializer, PasswordChangeSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    EmailVerificationSerializer, UserListSerializer, AuditLogSerializer
)
from .permissions import IsUserManager, IsSelfOrAdmin
from .utils import get_client_ip, get_user_agent
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator


class AuthViewSet(viewsets.ViewSet):
    """Authentication endpoints"""
    permission_classes = [AllowAny]
    authentication_classes = []  # avoid SessionAuthentication CSRF on login/register
    
    # CSRF exemption is handled by authentication_classes = []
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """User registration endpoint"""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Create email verification token
            token = EmailVerificationToken.objects.create(
                user=user,
                token=get_random_string(64),
                expires_at=timezone.now() + timezone.timedelta(hours=24)
            )
            
            # Send verification email (stub for now)
            # send_verification_email(user, token.token)
            
            return Response({
                'message': 'User registered successfully. Please check your email for verification.',
                'user_id': user.id,
                'email': user.email
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """User login endpoint"""
        payload = request.data.copy()
        if 'username' in payload and 'email' not in payload:
            payload['email'] = payload['username']
        serializer = UserLoginSerializer(data=payload)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)

            # Issue JWT tokens and set HttpOnly cookies
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])

            resp = Response({
                'message': 'Login successful',
                'user': UserProfileSerializer(user, context={'request': request}).data
            })

            set_jwt_cookies(resp, access_token, refresh_token)

            return resp
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """User logout endpoint"""
        if request.user.is_authenticated:
            # Log logout action
            AuditLog.log_action(
                user=request.user,
                action=AuditLog.ActionType.LOGOUT,
                resource_type='User',
                resource_id=str(request.user.id),
                details={'email': request.user.email},
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request)
            )
            
            logout(request)

            resp = Response({'message': 'Logout successful'})
            # Clear cookies with matching attributes
            try:
                from django.utils.http import http_date
                import time
                expires = http_date(0)
                resp.set_cookie('access', '', max_age=0, expires=expires, path='/', samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'))
                resp.set_cookie('refresh', '', max_age=0, expires=expires, path='/', samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'))
            except Exception:
                clear_jwt_cookies(resp)
            return resp
        
        return Response({'message': 'Not logged in'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def verify_email(self, request):
        """Email verification endpoint"""
        serializer = EmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            user = token.user
            
            # Mark email as verified
            user.verify_email()
            token.use_token()
            
            # Log verification
            AuditLog.log_action(
                user=user,
                action=AuditLog.ActionType.EMAIL_VERIFICATION,
                resource_type='User',
                resource_id=str(user.id),
                details={'email': user.email},
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request)
            )
            
            return Response({'message': 'Email verified successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def request_password_reset(self, request):
        """Password reset request endpoint"""
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            
            # Create reset token
            token = PasswordResetToken.objects.create(
                user=user,
                token=get_random_string(64),
                expires_at=timezone.now() + timezone.timedelta(hours=1)
            )
            
            # Send reset email (stub for now)
            # send_password_reset_email(user, token.token)
            
            return Response({
                'message': 'Password reset email sent. Please check your email.'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def confirm_password_reset(self, request):
        """Password reset confirmation endpoint"""
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            reset_token = serializer.validated_data['reset_token']
            user = reset_token.user
            new_password = serializer.validated_data['new_password']
            
            # Update password
            user.set_password(new_password)
            user.save()
            
            # Mark token as used
            reset_token.use_token()
            
            # Log password change
            AuditLog.log_action(
                user=user,
                action=AuditLog.ActionType.PASSWORD_CHANGE,
                resource_type='User',
                resource_id=str(user.id),
                details={'method': 'reset_token'},
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request)
            )
            
            return Response({'message': 'Password reset successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def refresh(self, request):
        """Issue a new access token from the refresh token cookie (or body)."""
        token = request.COOKIES.get('refresh') or request.data.get('refresh')
        if not token:
            return Response({'detail': 'No refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            refresh = RefreshToken(token)
            access_token = str(refresh.access_token)
        except Exception:
            return Response({'detail': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

        resp = Response({'refreshed': True})
        set_jwt_cookies(resp, access_token)
        return resp


class UserViewSet(viewsets.ModelViewSet):
    """User management ViewSet"""
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'email_verified', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['email', 'first_name', 'last_name', 'date_joined', 'last_login']
    ordering = ['-date_joined']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list' and self.request.user.is_staff:
            return UserListSerializer
        return UserProfileSerializer
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        if self.request.user.is_staff:
            return User.objects.all()
        else:
            # Users can only see their own profile
            return User.objects.filter(id=self.request.user.id)
    
    @method_decorator(ensure_csrf_cookie)
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        """Update current user's profile"""
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            # Realtime: broadcast user.updated
            try:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'user_{user.id}',
                    {
                        'type': 'user.updated',
                        'user_data': {
                            'id': user.id,
                            'email': user.email,
                            'first_name': user.first_name,
                            'last_name': user.last_name,
                            'role': getattr(user, 'role', ''),
                        },
                    },
                )
            except Exception:
                pass
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change current user's password"""
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            new_password = serializer.validated_data['new_password']
            
            # Update password
            user.set_password(new_password)
            user.save()
            
            # Log password change
            AuditLog.log_action(
                user=user,
                action=AuditLog.ActionType.PASSWORD_CHANGE,
                resource_type='User',
                resource_id=str(user.id),
                details={'method': 'current_password'},
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request)
            )
            
            return Response({'message': 'Password changed successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def roles(self, request, pk=None):
        """Get user's roles"""
        user = self.get_object()
        roles = user.roles.filter(is_active=True)
        serializer = UserRoleSerializer(roles, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post', 'patch'], permission_classes=[IsAdminUser])
    def update_role(self, request, pk=None):
        """Admin: update a user's primary role (legacy role field)."""
        user = self.get_object()
        new_role = request.data.get('role')
        if not new_role:
            return Response({'detail': 'role is required'}, status=status.HTTP_400_BAD_REQUEST)
        prev_role = getattr(user, 'role', '')
        user.role = new_role
        user.save(update_fields=['role'])
        # Audit
        AuditLog.log_action(
            user=request.user,
            action=AuditLog.ActionType.ROLE_ASSIGNMENT,
            resource_type='User',
            resource_id=str(user.id),
            details={'old_role': prev_role, 'new_role': new_role},
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )
        # Realtime
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'user_{user.id}',
                {
                    'type': 'user.updated',
                    'user_data': {
                        'id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': getattr(user, 'role', ''),
                    },
                },
            )
        except Exception:
            pass
        return Response({'message': 'Role updated', 'user': {'id': user.id, 'email': user.email, 'role': user.role}})


class UserRoleViewSet(viewsets.ModelViewSet):
    """User role management ViewSet"""
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role_type', 'is_active', 'context_type', 'context_id']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    ordering_fields = ['assigned_at', 'role_type', 'user__email']
    ordering = ['-assigned_at']
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        if self.request.user.is_staff:
            return UserRole.objects.all()
        else:
            # Users can only see their own roles
            return UserRole.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def assign_role(self, request):
        """Assign a role to a user (admin/organizer only)"""
        if not request.user.is_staff and not self._can_manage_users(request.user):
            return Response(
                {'detail': 'You do not have permission to assign roles'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserRoleAssignmentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            role = serializer.save()
            return Response(UserRoleSerializer(role).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user role"""
        role = self.get_object()
        
        # Check permissions
        if not request.user.is_staff and not self._can_manage_users(request.user):
            return Response(
                {'detail': 'You do not have permission to deactivate roles'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        role.deactivate()
        
        # Log role removal
        AuditLog.log_action(
            user=request.user,
            action=AuditLog.ActionType.ROLE_REMOVAL,
            resource_type='UserRole',
            resource_id=str(role.id),
            details={
                'deactivated_user': role.user.email,
                'role_type': role.role_type,
                'context_type': role.context_type,
                'context_id': role.context_id
            },
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        return Response({'message': 'Role deactivated successfully'})
    
    def _can_manage_users(self, user):
        """Check if user can manage other users"""
        return user.roles.filter(
            is_active=True,
            can_manage_users=True
        ).exists()


class AdminUserViewSet(viewsets.ModelViewSet):
    """Admin-only user management ViewSet"""
    queryset = User.objects.all()
    serializer_class = UserListSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'email_verified', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['email', 'first_name', 'last_name', 'date_joined', 'last_login']
    ordering = ['-date_joined']
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a user account"""
        user = self.get_object()
        user.is_active = True
        user.save()
        
        return Response({'message': 'User activated successfully'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user account"""
        user = self.get_object()
        user.is_active = False
        user.save()
        
        return Response({'message': 'User deactivated successfully'})
    
    @action(detail=True, methods=['post'])
    def verify_email(self, request, pk=None):
        """Manually verify a user's email"""
        user = self.get_object()
        user.verify_email()
        
        return Response({'message': 'Email verified successfully'})
    
    @action(detail=True, methods=['get'])
    def audit_logs(self, request, pk=None):
        """Get user's audit logs"""
        user = self.get_object()
        logs = AuditLog.objects.filter(user=user).order_by('-created_at')
        
        page = self.paginate_queryset(logs)
        if page is not None:
            serializer = AuditLogSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Audit log ViewSet (admin only)"""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'resource_type', 'user']
    search_fields = ['user__email', 'resource_type', 'resource_id']
    ordering_fields = ['created_at', 'action', 'user__email']
    ordering = ['-created_at']
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get audit log summary statistics"""
        total_logs = AuditLog.objects.count()
        recent_logs = AuditLog.objects.filter(
            created_at__gte=timezone.now() - timezone.timedelta(days=7)
        ).count()
        
        action_counts = AuditLog.objects.values('action').annotate(
            count=models.Count('id')
        ).order_by('-count')[:10]
        
        return Response({
            'total_logs': total_logs,
            'recent_logs': recent_logs,
            'action_counts': action_counts
        })
