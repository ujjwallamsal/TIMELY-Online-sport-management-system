# accounts/views.py
from __future__ import annotations

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import login, logout, authenticate
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
from rest_framework_simplejwt.authentication import JWTAuthentication
from accounts.auth import set_jwt_cookies, clear_jwt_cookies, CookieJWTAuthentication
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    UserRoleSerializer, UserRoleAssignmentSerializer, PasswordChangeSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    EmailVerificationSerializer, UserListSerializer, AuditLogSerializer,
    UserProfileUpdateSerializer, UserRoleUpdateSerializer
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
            
            # Log user creation
            AuditLog.log_action(
                user=user,
                action=AuditLog.ActionType.CREATE,
                resource_type='User',
                resource_id=str(user.id),
                details={'email': user.email, 'method': 'registration', 'role': user.role},
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request)
            )
            
            return Response({
                'message': 'User registered successfully. Please check your email for verification.',
                'user_id': user.id,
                'email': user.email
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """User login endpoint"""
        # Accept email and password directly from frontend
        serializer = UserLoginSerializer(data=request.data)
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

            # Log login
            AuditLog.log_action(
                user=user,
                action=AuditLog.ActionType.LOGIN,
                resource_type='User',
                resource_id=str(user.id),
                details={'email': user.email, 'method': 'email_password'},
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request)
            )

            resp = Response({
                'message': 'Login successful',
                'access': access_token,
                'refresh': refresh_token,
                'user': UserProfileSerializer(user, context={'request': request}).data
            })

            set_jwt_cookies(resp, access_token, refresh_token)

            return resp
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """User logout endpoint"""
        if request.user.is_authenticated:
            # Log logout
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
        clear_jwt_cookies(resp)
        return resp
    
    @action(detail=False, methods=['post'])
    def refresh(self, request):
        """Refresh JWT token endpoint"""
        refresh_token = request.COOKIES.get('refresh')
        if not refresh_token:
            return Response({'error': 'No refresh token provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            
            resp = Response({'message': 'Token refreshed successfully'})
            set_jwt_cookies(resp, access_token)
            return resp
        except Exception as e:
            return Response({'error': 'Invalid refresh token'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def password_reset_request(self, request):
        """Request password reset endpoint"""
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email, is_active=True)
                
                # Create password reset token
                token = PasswordResetToken.objects.create(
                    user=user,
                    token=get_random_string(64),
                    expires_at=timezone.now() + timezone.timedelta(hours=24)
                )
                
                # Send reset email (stub for now)
                # send_password_reset_email(user, token.token)
                
                return Response({
                    'message': 'Password reset email sent. Please check your email.'
                })
            except User.DoesNotExist:
                # Don't reveal if user exists
                return Response({
                    'message': 'If an account with this email exists, a password reset email has been sent.'
                })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def password_reset_confirm(self, request):
        """Confirm password reset endpoint"""
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            try:
                reset_token = PasswordResetToken.objects.get(
                    token=token,
                    is_used=False,
                    expires_at__gt=timezone.now()
                )
                
                user = reset_token.user
                user.set_password(new_password)
                user.save()
                
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
                
                return Response({'message': 'Password reset successful'})
            except PasswordResetToken.DoesNotExist:
                return Response({'error': 'Invalid or expired reset token'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def verify_email(self, request):
        """Email verification endpoint"""
        serializer = EmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            
            try:
                verification_token = EmailVerificationToken.objects.get(
                    token=token,
                    is_used=False,
                    expires_at__gt=timezone.now()
                )
                
                user = verification_token.user
                user.verify_email()
                verification_token.use_token()
                
                # Log email verification
                AuditLog.log_action(
                    user=user,
                    action=AuditLog.ActionType.EMAIL_VERIFICATION,
                    resource_type='User',
                    resource_id=str(user.id),
                    details={'method': 'verification_token'},
                    ip_address=get_client_ip(request),
                    user_agent=get_user_agent(request)
                )
                
                return Response({'message': 'Email verified successfully'})
            except EmailVerificationToken.DoesNotExist:
                return Response({'error': 'Invalid or expired verification token'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """User management endpoints"""
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication, JWTAuthentication]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'email_verified', 'role']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'last_login', 'email']
    ordering = ['-date_joined']
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        if self.request.user.is_superuser or self.request.user.role == User.Role.ADMIN:
            return User.objects.all()
        
        # Regular users can only see themselves
        return User.objects.filter(id=self.request.user.id)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'update' or self.action == 'partial_update':
            return UserProfileUpdateSerializer
        return UserProfileSerializer
    
    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """Get or update current user profile"""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        
        # PATCH method for updates
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            # Log profile update
            old_data = {
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'phone_number': request.user.phone_number,
                'address': request.user.address,
                'city': request.user.city,
                'state': request.user.state,
                'postal_code': request.user.postal_code,
                'country': request.user.country,
                'bio': request.user.bio,
                'website': request.user.website,
            }
            
            user = serializer.save()
            
            AuditLog.log_action(
                user=request.user,
                action=AuditLog.ActionType.UPDATE,
                resource_type='UserProfile',
                resource_id=str(user.id),
                details={
                    'old_data': old_data,
                    'new_data': serializer.validated_data,
                    'updated_fields': list(serializer.validated_data.keys())
                },
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request)
            )
            
            return Response(UserProfileSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def change_password(self, request, pk=None):
        """Change user password"""
        user = self.get_object()
        
        # Check if user can change their own password or is admin
        if user != request.user and not (request.user.is_superuser or request.user.role == User.Role.ADMIN):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Log password change
            AuditLog.log_action(
                user=request.user,
                action=AuditLog.ActionType.PASSWORD_CHANGE,
                resource_type='User',
                resource_id=str(user.id),
                details={'method': 'change_password'},
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request)
            )
            
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    def update_role(self, request, pk=None):
        """Update user role (admin only)"""
        if not (request.user.is_superuser or request.user.role == User.Role.ADMIN):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        serializer = UserRoleUpdateSerializer(data=request.data)
        if serializer.is_valid():
            old_role = user.role
            user.role = serializer.validated_data['role']
            user.save()
            
            # Log role change
            AuditLog.log_action(
                user=request.user,
                action=AuditLog.ActionType.ROLE_ASSIGNMENT,
                resource_type='User',
                resource_id=str(user.id),
                details={
                    'assigned_user': user.email,
                    'old_role': old_role,
                    'new_role': user.role
                },
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request)
            )
            
            return Response({'message': 'Role updated successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUserViewSet(viewsets.ModelViewSet):
    """Admin user management endpoints"""
    queryset = User.objects.all()
    serializer_class = UserListSerializer
    permission_classes = [IsUserManager]
    authentication_classes = [CookieJWTAuthentication, JWTAuthentication]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'email_verified', 'role']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'last_login', 'email']
    ordering = ['-date_joined']
    
    def get_queryset(self):
        """Admin can see all users"""
        return User.objects.all()
    
    @action(detail=True, methods=['post'])
    def assign_role(self, request, pk=None):
        """Assign role to user"""
        user = self.get_object()
        serializer = UserRoleAssignmentSerializer(data=request.data, context={'user': user})
        if serializer.is_valid():
            # If setting as primary, remove other primary roles
            if serializer.validated_data.get('is_primary', False):
                UserRole.objects.filter(user=user, is_primary=True).update(is_primary=False)
            
            role = UserRole.objects.create(
                user=user,
                assigned_by=request.user,
                **serializer.validated_data
            )
            
            # Log role assignment
            AuditLog.log_action(
                user=request.user,
                action=AuditLog.ActionType.ROLE_ASSIGNMENT,
                resource_type='UserRole',
                resource_id=str(role.id),
                details={
                    'assigned_user': user.email,
                    'role_type': role.role_type,
                    'context_type': role.context_type,
                    'context_id': role.context_id,
                    'permissions': {
                        'can_manage_events': role.can_manage_events,
                        'can_manage_teams': role.can_manage_teams,
                        'can_manage_users': role.can_manage_users,
                        'can_manage_fixtures': role.can_manage_fixtures,
                        'can_manage_results': role.can_manage_results,
                        'can_manage_payments': role.can_manage_payments,
                        'can_manage_content': role.can_manage_content,
                        'can_view_reports': role.can_view_reports,
                    }
                },
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request)
            )
            
            return Response(UserRoleSerializer(role).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def delete_user(self, request, pk=None):
        """Delete user (admin only)"""
        if not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        
        # Log user deletion
        AuditLog.log_action(
            user=request.user,
            action=AuditLog.ActionType.DELETE,
            resource_type='User',
            resource_id=str(user.id),
            details={'deleted_user': user.email},
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        user.delete()
        return Response({'message': 'User deleted successfully'})


class UserRoleViewSet(viewsets.ModelViewSet):
    """User role management endpoints"""
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer
    permission_classes = [IsUserManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role_type', 'is_active', 'is_primary', 'user']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    ordering_fields = ['assigned_at', 'created_at']
    ordering = ['-assigned_at']
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        if self.request.user.is_superuser or self.request.user.role == User.Role.ADMIN:
            return UserRole.objects.all()
        
        # Regular users can only see their own roles
        return UserRole.objects.filter(user=self.request.user)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Audit log viewing endpoints (admin only)"""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsUserManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'resource_type', 'user']
    search_fields = ['user__email', 'resource_type', 'details']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Admin can see all audit logs"""
        return AuditLog.objects.all()
