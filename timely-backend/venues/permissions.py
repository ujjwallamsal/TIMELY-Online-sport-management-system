# venues/permissions.py
from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()


class IsVenueOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow venue owners or admins to edit venues.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Write permissions are only allowed to the owner or admin
        return (
            request.user.is_authenticated and 
            (obj.created_by == request.user or request.user.is_staff)
        )


class IsAdminOrOwner(permissions.BasePermission):
    """
    Permission that allows access only to admins or object owners.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin can do anything
        if request.user.is_staff:
            return True
        
        # Owner can do anything to their own objects
        if hasattr(obj, 'created_by') and obj.created_by == request.user:
            return True
        
        # For venue slots, check venue ownership
        if hasattr(obj, 'venue') and obj.venue.created_by == request.user:
            return True
        
        return False


class CanManageVenues(permissions.BasePermission):
    """
    Permission for venue management operations.
    Organizers can manage their own venues, admins can manage all.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin can manage all venues
        if request.user.is_staff:
            return True
        
        # Organizers can manage their own venues
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        return False


class CanViewVenues(permissions.BasePermission):
    """
    Permission for viewing venues.
    All authenticated users can view venues.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated