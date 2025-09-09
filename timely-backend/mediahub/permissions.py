"""
Media Hub permissions for RBAC.
Implements role-based access control for media operations.
"""
from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()


class CanUploadMedia(permissions.BasePermission):
    """
    Permission for uploading media.
    Authenticated users can upload; spectators can be toggled via setting.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Allow all authenticated users by default
        # Can be restricted to specific roles via setting if needed
        return True


class CanViewMedia(permissions.BasePermission):
    """
    Permission for viewing media.
    Users can see their own media; moderators can see all.
    Public can only see approved media.
    """
    
    def has_permission(self, request, view):
        # Public can view approved media
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write operations require authentication
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Public can only see approved media
        if not request.user.is_authenticated:
            return obj.is_public
        
        # Authenticated users can see their own media
        if obj.uploader == request.user:
            return True
        
        # Moderators can see all media
        if obj.can_moderate(request.user):
            return True
        
        # Others can only see approved media
        return obj.is_public


class CanModerateMedia(permissions.BasePermission):
    """
    Permission for moderating media.
    Organizers can moderate their own events; admins can moderate all.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin can moderate all
        if request.user.is_staff:
            return True
        
        # Organizers can moderate (will be checked per object)
        if request.user.role == 'ORGANIZER':
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Admin can moderate all
        if request.user.is_staff:
            return True
        
        # Organizers can moderate their own events
        if request.user.role == 'ORGANIZER' and obj.event:
            return obj.event.created_by == request.user
        
        return False


class CanEditMedia(permissions.BasePermission):
    """
    Permission for editing media.
    Uploaders can edit while pending; moderators can edit any.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        return obj.can_edit(request.user)


class CanDeleteMedia(permissions.BasePermission):
    """
    Permission for deleting media.
    Uploaders can delete while pending; moderators can delete any.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        return obj.can_delete(request.user)


class PublicMediaReadOnly(permissions.BasePermission):
    """
    Permission for public media gallery.
    Read-only access to approved media only.
    """
    
    def has_permission(self, request, view):
        # Only allow GET requests
        return request.method in permissions.SAFE_METHODS
    
    def has_object_permission(self, request, view, obj):
        # Only show approved media
        return obj.is_public
