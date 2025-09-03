# tickets/permissions.py
from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()


class IsOrganizerOrAdmin(permissions.BasePermission):
    """
    Permission class for organizers and admins
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin has full access
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Check if user is organizer
        return request.user.role == User.Role.ORGANIZER


class IsEventOrganizerOrAdmin(permissions.BasePermission):
    """
    Permission class for event organizers and admins
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin has full access
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Check if user is organizer
        if request.user.role != User.Role.ORGANIZER:
            return False
        
        # For event-specific operations, check if user created the event
        event_id = view.kwargs.get('event_id')
        if event_id:
            from events.models import Event
            try:
                event = Event.objects.get(id=event_id)
                return event.created_by == request.user
            except Event.DoesNotExist:
                return False
        
        return True


class IsTicketOwnerOrAdmin(permissions.BasePermission):
    """
    Permission class for ticket owners and admins
    """
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin has full access
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Check if user owns the ticket
        if hasattr(obj, 'order'):
            return obj.order.user == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


class IsOrderOwnerOrAdmin(permissions.BasePermission):
    """
    Permission class for order owners and admins
    """
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin has full access
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Check if user owns the order
        return obj.user == request.user


class CanViewTicketTypes(permissions.BasePermission):
    """
    Permission class for viewing ticket types
    """
    
    def has_permission(self, request, view):
        # Public can view available ticket types
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Only authenticated users can create/modify
        return request.user and request.user.is_authenticated


class CanPurchaseTickets(permissions.BasePermission):
    """
    Permission class for purchasing tickets
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Any authenticated user can purchase tickets
        return True


class IsEventOrganizerForOrder(permissions.BasePermission):
    """
    Permission class for event organizers to view orders for their events
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin has full access
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Check if user is organizer
        if request.user.role != User.Role.ORGANIZER:
            return False
        
        # For event-specific order views, check if user created the event
        event_id = view.kwargs.get('event_id')
        if event_id:
            from events.models import Event
            try:
                event = Event.objects.get(id=event_id)
                return event.created_by == request.user
            except Event.DoesNotExist:
                return False
        
        return True


class CanCancelOrder(permissions.BasePermission):
    """
    Permission class for canceling orders
    """
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin can cancel any order
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Event organizer can cancel orders for their events
        if request.user.role == User.Role.ORGANIZER:
            if hasattr(obj, 'event'):
                return obj.event.created_by == request.user
        
        # User can cancel their own orders
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


class PublicReadOrAuthenticatedWrite(permissions.BasePermission):
    """
    Permission class allowing public read access and authenticated write access
    """
    
    def has_permission(self, request, view):
        # Public read access
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Authenticated write access
        return request.user and request.user.is_authenticated