# fixtures/permissions.py
from rest_framework import permissions


class IsOrganizerOrAdmin(permissions.BasePermission):
    """Allow access to organizers and admins only"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Staff users always have access
        if request.user.is_staff:
            return True
        
        # Check user role
        role = getattr(request.user, "role", "")
        return role in {"ADMIN", "ORGANIZER"}
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Staff users always have access
        if request.user.is_staff:
            return True
        
        # Check user role
        role = getattr(request.user, "role", "")
        
        if role == "ADMIN":
            return True
        
        if role == "ORGANIZER":
            # Organizers can only manage fixtures for their own events
            if hasattr(obj, 'event'):
                return obj.event.created_by == request.user
            elif hasattr(obj, 'fixture'):
                return obj.fixture.event.created_by == request.user
        
        return False
