from rest_framework import permissions
from .models import Event


class IsEventOwnerOrAdmin(permissions.BasePermission):
    """Permission to allow event owners and admins to edit events"""
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for published events
        if request.method in permissions.SAFE_METHODS:
            if obj.lifecycle_status == Event.LifecycleStatus.PUBLISHED:
                return True
            # Owners and admins can see their own events
            return (
                request.user.is_authenticated and 
                (obj.created_by == request.user or request.user.role == 'ADMIN')
            )
        
        # Write permissions for owners and admins
        return (
            request.user.is_authenticated and 
            (obj.created_by == request.user or request.user.role == 'ADMIN')
        )


class IsOrganizerOrAdmin(permissions.BasePermission):
    """Permission to allow organizers and admins to create events"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return request.user.role in ['ORGANIZER', 'ADMIN']


class IsAdminOrReadOnly(permissions.BasePermission):
    """Permission to allow admins full access, others read-only"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return (
            request.user.is_authenticated and 
            request.user.role == 'ADMIN'
        )
