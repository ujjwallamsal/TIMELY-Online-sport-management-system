# settingshub/views.py
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import SiteSetting, FeatureFlag
from .serializers import (
    SiteSettingSerializer, SiteSettingUpdateSerializer,
    FeatureFlagSerializer, FeatureFlagUpdateSerializer,
    PublicSiteSettingSerializer
)


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def site_settings(request):
    """
    Get or update site settings (admin only)
    """
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    settings = SiteSetting.get_settings()
    
    if request.method == 'GET':
        serializer = SiteSettingSerializer(settings)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = SiteSettingUpdateSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_site_settings(request):
    """
    Get public site settings (no authentication required)
    """
    settings = SiteSetting.get_settings()
    serializer = PublicSiteSettingSerializer(settings)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def feature_flags(request):
    """
    Get feature flags for the current user
    """
    flags = FeatureFlag.objects.all()
    
    # Filter flags based on user permissions
    user_flags = {}
    for flag in flags:
        user_flags[flag.name] = flag.is_enabled_for_user(request.user)
    
    return Response({
        'flags': user_flags,
        'user_role': getattr(request.user, 'role', 'SPECTATOR')
    })


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_feature_flags(request):
    """
    Get or create feature flags (admin only)
    """
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        flags = FeatureFlag.objects.all()
        serializer = FeatureFlagSerializer(flags, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = FeatureFlagSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def admin_feature_flag_detail(request, flag_id):
    """
    Get, update, or delete a specific feature flag (admin only)
    """
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    flag = get_object_or_404(FeatureFlag, id=flag_id)
    
    if request.method == 'GET':
        serializer = FeatureFlagSerializer(flag)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = FeatureFlagUpdateSerializer(flag, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        flag.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_maintenance_mode(request):
    """
    Toggle maintenance mode (admin only)
    """
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    settings = SiteSetting.get_settings()
    settings.maintenance_mode = not settings.maintenance_mode
    settings.updated_by = request.user
    settings.save()
    
    return Response({
        'maintenance_mode': settings.maintenance_mode,
        'message': f'Maintenance mode {"enabled" if settings.maintenance_mode else "disabled"}'
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def system_status(request):
    """
    Get system status and health information (admin only)
    """
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    from django.db import connection
    from django.core.cache import cache
    from django.conf import settings
    
    # Check database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_status = 'healthy'
    except Exception as e:
        db_status = f'error: {str(e)}'
    
    # Check cache
    try:
        cache.set('health_check', 'ok', 10)
        cache_status = 'healthy' if cache.get('health_check') == 'ok' else 'error'
    except Exception as e:
        cache_status = f'error: {str(e)}'
    
    # Get basic stats
    from accounts.models import User
    from events.models import Event
    from registrations.models import Registration
    from tickets.models import TicketOrder
    
    stats = {
        'total_users': User.objects.count(),
        'active_users': User.objects.filter(is_active=True).count(),
        'total_events': Event.objects.count(),
        'published_events': Event.objects.filter(status='published').count(),
        'total_registrations': Registration.objects.count(),
        'total_orders': TicketOrder.objects.count(),
        'paid_orders': TicketOrder.objects.filter(status='paid').count(),
    }
    
    return Response({
        'status': 'healthy',
        'database': db_status,
        'cache': cache_status,
        'maintenance_mode': SiteSetting.get_settings().maintenance_mode,
        'stats': stats,
        'version': getattr(settings, 'VERSION', '1.0.0'),
        'debug': settings.DEBUG
    })
