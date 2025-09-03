from rest_framework import permissions
from .models import Registration


class IsRegistrationOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of a registration to edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner of the registration.
        return obj.user == request.user


class IsRegistrationOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of a registration to access it.
    """
    
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsEventOrganizerOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow event organizers and admins to manage registrations.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin has full access
        if request.user.role == 'ADMIN':
            return True
        
        # Organizer can access organizer-specific views
        if request.user.role == 'ORGANIZER':
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Admin has full access
        if request.user.role == 'ADMIN':
            return True
        
        # Organizer can only manage registrations for their own events
        if request.user.role == 'ORGANIZER':
            return obj.event.created_by == request.user
        
        return False


class IsRegistrationOwnerOrEventOrganizerOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow registration owners, event organizers, and admins.
    """
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Registration owner can access their own registration
        if obj.user == request.user:
            return True
        
        # Admin has full access
        if request.user.role == 'ADMIN':
            return True
        
        # Event organizer can access registrations for their events
        if request.user.role == 'ORGANIZER':
            return obj.event.created_by == request.user
        
        return False


class CanCreateRegistration(permissions.BasePermission):
    """
    Custom permission to check if user can create registrations.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Athletes, coaches, and managers can create registrations
        allowed_roles = ['ATHLETE', 'COACH', 'MANAGER', 'ORGANIZER', 'ADMIN']
        return request.user.role in allowed_roles


class CanManageRegistration(permissions.BasePermission):
    """
    Custom permission for registration management actions.
    """
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Admin has full access
        if request.user.role == 'ADMIN':
            return True
        
        # Event organizer can manage registrations for their events
        if request.user.role == 'ORGANIZER':
            return obj.event.created_by == request.user
        
        return False