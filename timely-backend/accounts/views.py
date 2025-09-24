# accounts/views.py - Simplified for minimal boot profile
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from django.utils.crypto import get_random_string
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.db import models, transaction

from .models import User, OrganizerApplication
from common.models import AuditLog
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    PasswordChangeSerializer,
    UserListSerializer, AuditLogSerializer,
    UserProfileUpdateSerializer,
    UserProfileWithKycSerializer,
    OrganizerApplicationSerializer,
    OrganizerApplicationCreateSerializer
)
from .permissions import IsUserManager, IsSelfOrAdmin
from .auth import set_jwt_cookies, clear_jwt_cookies, CookieJWTAuthentication


class UserRegistrationViewSet(viewsets.ViewSet):
    """User registration endpoints"""
    permission_classes = [AllowAny]
    
    def create(self, request):
        """Register a new user"""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Create audit log
            AuditLog.objects.create(
                user=user,
                action=AuditLog.ActionType.USER_REGISTRATION,
                resource_type='User',
                resource_id=str(user.id),
                details={'email': user.email}
            )
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Set cookies
            response = Response({
                'user': UserProfileSerializer(user).data,
                'access': access_token,
                'refresh': refresh_token,
                'message': 'User registered successfully'
            }, status=status.HTTP_201_CREATED)
            
            set_jwt_cookies(response, access_token, refresh_token)
            return response
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginViewSet(viewsets.ViewSet):
    """User authentication endpoints"""
    permission_classes = [AllowAny]
    
    def create(self, request):
        """Login user"""
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            # Authenticate user
            user = authenticate(request, email=email, password=password)
            if user and user.is_active:
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                
                # Create audit log
                AuditLog.objects.create(
                    user=user,
                    action=AuditLog.ActionType.USER_LOGIN,
                    resource_type='User',
                    resource_id=str(user.id),
                    details={'email': user.email}
                )
                
                # Set cookies
                response = Response({
                    'user': UserProfileSerializer(user).data,
                    'access': access_token,
                    'refresh': refresh_token,
                    'message': 'Login successful'
                })
                
                set_jwt_cookies(response, access_token, refresh_token)
                return response
            else:
                return Response(
                    {'error': 'Invalid credentials or inactive account'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutViewSet(viewsets.ViewSet):
    """User logout endpoints"""
    permission_classes = [IsAuthenticated]
    
    def create(self, request):
        """Logout user"""
        # Create audit log
        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.ActionType.USER_LOGOUT,
            resource_type='User',
            resource_id=str(request.user.id),
            details={'email': request.user.email}
        )
        
        # Clear cookies
        response = Response({'message': 'Logout successful'})
        clear_jwt_cookies(response)
        return response


class UserProfileViewSet(viewsets.ModelViewSet):
    """User profile management"""
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        elif self.action in ['update', 'partial_update']:
            return UserProfileUpdateSerializer
        return UserProfileSerializer
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        if self.request.user.is_superuser:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    def get_object(self):
        """Get user object"""
        if self.kwargs.get('pk') == 'me':
            return self.request.user
        return super().get_object()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change user password"""
        serializer = PasswordChangeSerializer(data=request.data, context={'user': request.user})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            
            # Create audit log
            AuditLog.objects.create(
                user=request.user,
                action=AuditLog.ActionType.PASSWORD_CHANGE,
                resource_type='User',
                resource_id=str(request.user.id),
                details={'email': request.user.email}
            )
            
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrganizerApplicationViewSet(viewsets.ModelViewSet):
    """Organizer application management"""
    queryset = OrganizerApplication.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        if self.request.user.is_superuser:
            return OrganizerApplication.objects.all()
        return OrganizerApplication.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Create organizer application for current user"""
        # Check if user already has a pending application
        existing_application = OrganizerApplication.objects.filter(
            user=self.request.user,
            status=OrganizerApplication.Status.PENDING
        ).exists()
        
        if existing_application:
            raise serializers.ValidationError('You already have a pending organizer application')
        
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve organizer application (admin only)"""
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only administrators can approve applications'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        application = self.get_object()
        application.approve(request.user)
        
        return Response({'message': 'Application approved successfully'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject organizer application (admin only)"""
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only administrators can reject applications'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        application = self.get_object()
        reason = request.data.get('reason', '')
        application.reject(request.user, reason)
        
        return Response({'message': 'Application rejected successfully'})


# Password reset and email verification disabled for minimal boot profile