# tickets/permissions.py
from rest_framework import permissions


class IsOrganizerOrAdmin(permissions.BasePermission):
    """
    Allow access to organizers and admins.
    Organizers can only manage tickets for events they created.
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Allow admins and organizers
        if request.user.role in ['ADMIN', 'ORGANIZER'] or request.user.is_staff:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        # Admins can access everything
        if request.user.role == 'ADMIN' or request.user.is_staff:
            return True
        
        # Organizers can only manage tickets for their own events
        if request.user.role == 'ORGANIZER':
            if hasattr(obj, 'event'):
                return obj.event.organizer == request.user
            elif hasattr(obj, 'order') and hasattr(obj.order, 'event'):
                return obj.order.event.organizer == request.user
            elif hasattr(obj, 'ticket_type') and hasattr(obj.ticket_type, 'event'):
                return obj.ticket_type.event.organizer == request.user
        
        return False


class IsTicketOwner(permissions.BasePermission):
    """
    Allow access to ticket owners (customers who purchased the tickets).
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Users can only access their own tickets
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        elif hasattr(obj, 'order') and hasattr(obj.order, 'customer'):
            return obj.order.customer == request.user
        
        return False


class IsEventOrganizer(permissions.BasePermission):
    """
    Allow access to event organizers for managing ticket types.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ORGANIZER', 'ADMIN']
    
    def has_object_permission(self, request, view, obj):
        # Check if user is organizer of the event
        if hasattr(obj, 'event'):
            return obj.event.organizer == request.user
        elif hasattr(obj, 'ticket_type') and hasattr(obj.ticket_type, 'event'):
            return obj.ticket_type.event.organizer == request.user
        
        return False


class CanPurchaseTickets(permissions.BasePermission):
    """
    Allow authenticated users to purchase tickets.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated


class CanViewPublicTickets(permissions.BasePermission):
    """
    Allow public access to view available ticket types.
    """
    
    def has_permission(self, request, view):
        # Allow public access for read operations
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Require authentication for other operations
        return request.user.is_authenticated
