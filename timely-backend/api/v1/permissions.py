# api/v1/permissions.py
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Permission for admin users"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'ADMIN'
        )


class IsOrganizer(BasePermission):
    """Permission for organizer users"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'ORGANIZER']
        )


class IsCoach(BasePermission):
    """Permission for coach users"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'ORGANIZER', 'COACH']
        )


class IsAthlete(BasePermission):
    """Permission for athlete users"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'ORGANIZER', 'COACH', 'ATHLETE']
        )


class IsSpectator(BasePermission):
    """Permission for spectator users (read-only)"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'ORGANIZER', 'COACH', 'ATHLETE', 'SPECTATOR']
        )
    
    def has_object_permission(self, request, view, obj):
        # Spectators can only read
        return request.method in ['GET', 'HEAD', 'OPTIONS']


class IsEventOrganizer(BasePermission):
    """Permission for event organizers (can manage their own events)"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'ORGANIZER']
        )
    
    def has_object_permission(self, request, view, obj):
        # Admins can do everything
        if request.user.role == 'ADMIN':
            return True
        
        # Organizers can only manage their own events
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        return False


class IsTeamManager(BasePermission):
    """Permission for team managers (can manage their own teams)"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'ORGANIZER', 'COACH']
        )
    
    def has_object_permission(self, request, view, obj):
        # Admins can do everything
        if request.user.role == 'ADMIN':
            return True
        
        # Organizers can manage all teams
        if request.user.role == 'ORGANIZER':
            return True
        
        # Coaches can only manage their own teams
        if hasattr(obj, 'manager'):
            return obj.manager == request.user
        
        return False


class IsRegistrationOwner(BasePermission):
    """Permission for registration owners (can manage their own registrations)"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'ORGANIZER', 'ATHLETE']
        )
    
    def has_object_permission(self, request, view, obj):
        # Admins can do everything
        if request.user.role == 'ADMIN':
            return True
        
        # Organizers can manage all registrations
        if request.user.role == 'ORGANIZER':
            return True
        
        # Athletes can only manage their own registrations
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


class CanManageResults(BasePermission):
    """Permission for managing results"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'ORGANIZER']
        )
    
    def has_object_permission(self, request, view, obj):
        # Admins can do everything
        if request.user.role == 'ADMIN':
            return True
        
        # Organizers can manage results for their events
        if hasattr(obj, 'fixture') and hasattr(obj.fixture, 'event'):
            return obj.fixture.event.created_by == request.user
        
        return False


class CanViewReports(BasePermission):
    """Permission for viewing reports"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'ORGANIZER']
        )


class CanManageUsers(BasePermission):
    """Permission for managing users (role changes, etc.)"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'ADMIN'
        )
    
    def has_object_permission(self, request, view, obj):
        # Admins can manage all users except themselves
        if request.user.role == 'ADMIN':
            return obj != request.user
        
        return False
