from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Permission class that allows access only to admin users.
    Admin users are those with is_superuser=True or role='ADMIN'.
    """
    
    def has_permission(self, request, view):
        """Check if user has admin permissions"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superuser always has admin access
        if getattr(request.user, 'is_superuser', False):
            return True
        
        # Check for ADMIN role
        role = getattr(request.user, 'role', '').upper()
        return role == 'ADMIN'
