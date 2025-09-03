# fixtures/permissions.py
from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()


class IsOrganizerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow organizers or admins to manage fixtures.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin can manage all fixtures
        if request.user.is_staff:
            return True
        
        # Organizers can manage fixtures for their own events
        if hasattr(obj, 'event') and obj.event.created_by == request.user:
            return True
        
        return False


class CanManageFixtures(permissions.BasePermission):
    """
    Permission for fixture management operations.
    Organizers can manage fixtures for their own events, admins can manage all.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin can manage all fixtures
        if request.user.is_staff:
            return True
        
        # Organizers can manage fixtures for their own events
        if hasattr(obj, 'event'):
            return obj.event.created_by == request.user
        
        return False


class CanViewFixtures(permissions.BasePermission):
    """
    Permission for viewing fixtures.
    All authenticated users can view fixtures, public can view published only.
    """
    
    def has_permission(self, request, view):
        return True  # Allow both authenticated and anonymous users
    
    def has_object_permission(self, request, view, obj):
        # Admin and organizers can see all fixtures
        if request.user.is_authenticated:
            if request.user.is_staff:
                return True
            
            # Organizers can see fixtures for their own events
            if hasattr(obj, 'event') and obj.event.created_by == request.user:
                return True
        
        # Public can only see published fixtures
        return obj.status == obj.Status.PUBLISHED


class CanGenerateFixtures(permissions.BasePermission):
    """
    Permission for generating fixtures.
    Only organizers and admins can generate fixtures.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin can generate fixtures for any event
        if request.user.is_staff:
            return True
        
        # Organizers can generate fixtures for their own events
        return True  # Will be checked in the view based on event ownership


class CanPublishFixtures(permissions.BasePermission):
    """
    Permission for publishing fixtures.
    Only organizers and admins can publish fixtures.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin can publish fixtures for any event
        if request.user.is_staff:
            return True
        
        # Organizers can publish fixtures for their own events
        return True  # Will be checked in the view based on event ownership


class CanRescheduleFixtures(permissions.BasePermission):
    """
    Permission for rescheduling fixtures.
    Only organizers and admins can reschedule fixtures.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin can reschedule fixtures for any event
        if request.user.is_staff:
            return True
        
        # Organizers can reschedule fixtures for their own events
        return True  # Will be checked in the view based on event ownership