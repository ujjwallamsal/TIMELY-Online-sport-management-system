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

from .models import User, OrganizerApplication, AthleteApplication, CoachApplication
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
    OrganizerApplicationCreateSerializer,
    AthleteApplicationSerializer,
    AthleteApplicationCreateSerializer,
    CoachApplicationSerializer,
    CoachApplicationCreateSerializer
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
    
    @action(detail=False, methods=['get', 'patch', 'put'])
    def me(self, request):
        """Get or update current user profile"""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        else:
            # Update profile
            serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                
                # Create audit log (use PROFILE_UPDATE or similar)
                try:
                    AuditLog.objects.create(
                        user=request.user,
                        action='PROFILE_UPDATE',  # Use string instead of ActionType enum
                        resource_type='User',
                        resource_id=str(request.user.id),
                        details={'email': request.user.email, 'updated_fields': list(request.data.keys())}
                    )
                except Exception as e:
                    # Don't fail profile update if audit logging fails
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Failed to create audit log: {e}")
                
                # Return updated profile with full serializer
                response_serializer = UserProfileSerializer(request.user)
                return Response(response_serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
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


class AthleteApplicationViewSet(viewsets.ModelViewSet):
    """Athlete application management"""
    queryset = AthleteApplication.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AthleteApplicationCreateSerializer
        return AthleteApplicationSerializer
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        if self.request.user.is_superuser:
            return AthleteApplication.objects.all()
        return AthleteApplication.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Create athlete application for current user"""
        # Check if user already has a pending application
        existing_application = AthleteApplication.objects.filter(
            user=self.request.user,
            status=AthleteApplication.Status.PENDING
        ).exists()
        
        if existing_application:
            raise serializers.ValidationError('You already have a pending athlete application')
        
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve athlete application (admin only)"""
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
        """Reject athlete application (admin only)"""
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only administrators can reject applications'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        application = self.get_object()
        reason = request.data.get('reason', '')
        application.reject(request.user, reason)
        
        return Response({'message': 'Application rejected successfully'})


class CoachApplicationViewSet(viewsets.ModelViewSet):
    """Coach application management"""
    queryset = CoachApplication.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CoachApplicationCreateSerializer
        return CoachApplicationSerializer
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        if self.request.user.is_superuser:
            return CoachApplication.objects.all()
        return CoachApplication.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Create coach application for current user"""
        # Check if user already has a pending application
        existing_application = CoachApplication.objects.filter(
            user=self.request.user,
            status=CoachApplication.Status.PENDING
        ).exists()
        
        if existing_application:
            raise serializers.ValidationError('You already have a pending coach application')
        
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve coach application (admin only)"""
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
        """Reject coach application (admin only)"""
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

# Role Application Functions
from rest_framework.decorators import api_view, permission_classes

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_athlete_role(request):
    """Apply for athlete role"""
    try:
        # Check if user already has an application
        existing = AthleteApplication.objects.filter(user=request.user, status='PENDING').first()
        if existing:
            return Response({'error': 'You already have a pending application'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = AthleteApplicationCreateSerializer(data=request.data)
        if serializer.is_valid():
            application = serializer.save(user=request.user)
            return Response({
                'message': 'Athlete application submitted successfully',
                'application_id': application.id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_coach_role(request):
    """Apply for coach role"""
    try:
        # Check if user already has an application
        existing = CoachApplication.objects.filter(user=request.user, status='PENDING').first()
        if existing:
            return Response({'error': 'You already have a pending application'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = CoachApplicationCreateSerializer(data=request.data)
        if serializer.is_valid():
            application = serializer.save(user=request.user)
            return Response({
                'message': 'Coach application submitted successfully',
                'application_id': application.id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_organizer_role(request):
    """Apply for organizer role"""
    try:
        # Check if user already has an application
        existing = OrganizerApplication.objects.filter(user=request.user, status='PENDING').first()
        if existing:
            return Response({'error': 'You already have a pending application'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = OrganizerApplicationCreateSerializer(data=request.data)
        if serializer.is_valid():
            application = serializer.save(user=request.user)
            return Response({
                'message': 'Organizer application submitted successfully',
                'application_id': application.id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_applications(request):
    """Get current user's role applications"""
    try:
        athlete_apps = AthleteApplication.objects.filter(user=request.user)
        coach_apps = CoachApplication.objects.filter(user=request.user)
        organizer_apps = OrganizerApplication.objects.filter(user=request.user)
        
        return Response({
            'athlete_applications': AthleteApplicationSerializer(athlete_apps, many=True).data,
            'coach_applications': CoachApplicationSerializer(coach_apps, many=True).data,
            'organizer_applications': OrganizerApplicationSerializer(organizer_apps, many=True).data,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)