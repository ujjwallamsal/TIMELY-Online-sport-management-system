# accounts/permissions.py
from rest_framework import permissions
from .models import UserRole


class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow users with 'ADMIN' role or superusers to access.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.is_superuser or request.user.role == 'ADMIN')


class IsOrganizerOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow users with 'ORGANIZER' or 'ADMIN' role to access.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return (request.user.is_superuser or 
                request.user.role == 'ADMIN' or 
                request.user.role == 'ORGANIZER')


class IsUserManager(permissions.BasePermission):
    """
    Permission to check if user can manage other users.
    Allows access if user is admin or has user management permissions.
    """
    
    def has_permission(self, request, view):
        # Admin users can do anything
        if request.user.is_staff:
            return True
        
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Check if user has user management permissions
        return UserRole.objects.filter(
            user=request.user,
            is_active=True,
            can_manage_users=True
        ).exists()
    
    def has_object_permission(self, request, view, obj):
        # Admin users can do anything
        if request.user.is_staff:
            return True
        
        # Check if user has user management permissions
        return UserRole.objects.filter(
            user=request.user,
            is_active=True,
            can_manage_users=True
        ).exists()


class IsSelfOrAdmin(permissions.BasePermission):
    """
    Permission to check if user can access their own data or is admin.
    """
    
    def has_permission(self, request, view):
        # Admin users can do anything
        if request.user.is_staff:
            return True
        
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        return True
    
    def has_object_permission(self, request, view, obj):
        # Admin users can do anything
        if request.user.is_staff:
            return True
        
        # Users can access their own data
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'id'):
            return obj.id == request.user.id
        
        return False


class CanManageEvents(permissions.BasePermission):
    """
    Permission to check if user can manage events.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return UserRole.objects.filter(
            user=request.user,
            is_active=True,
            can_manage_events=True
        ).exists()


class CanManageTeams(permissions.BasePermission):
    """
    Permission to check if user can manage teams.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return UserRole.objects.filter(
            user=request.user,
            is_active=True,
            can_manage_teams=True
        ).exists()


class CanManageFixtures(permissions.BasePermission):
    """
    Permission to check if user can manage fixtures.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return UserRole.objects.filter(
            user=request.user,
            is_active=True,
            can_manage_fixtures=True
        ).exists()


class CanManageResults(permissions.BasePermission):
    """
    Permission to check if user can manage results.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return UserRole.objects.filter(
            user=request.user,
            is_active=True,
            can_manage_results=True
        ).exists()


class CanManagePayments(permissions.BasePermission):
    """
    Permission to check if user can manage payments.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return UserRole.objects.filter(
            user=request.user,
            is_active=True,
            can_manage_payments=True
        ).exists()


class CanManageContent(permissions.BasePermission):
    """
    Permission to check if user can manage content.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return UserRole.objects.filter(
            user=request.user,
            is_active=True,
            can_manage_content=True
        ).exists()


class CanViewReports(permissions.BasePermission):
    """
    Permission to check if user can view reports.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return UserRole.objects.filter(
            user=request.user,
            is_active=True,
            can_view_reports=True
        ).exists()


class IsOrganizer(permissions.BasePermission):
    """
    Permission to check if user is an event organizer.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return UserRole.objects.filter(
            user=request.user,
            is_active=True,
            role_type=UserRole.RoleType.ORGANIZER
        ).exists()


class IsAthlete(permissions.BasePermission):
    """
    Permission to check if user is an athlete.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return UserRole.objects.filter(
            user=request.user,
            is_active=True,
            role_type=UserRole.RoleType.ATHLETE
        ).exists()


class IsCoach(permissions.BasePermission):
    """
    Permission to check if user is a coach.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return UserRole.objects.filter(
            user=request.user,
            is_active=True,
            role_type=UserRole.RoleType.COACH
        ).exists()


class IsTeamManager(permissions.BasePermission):
    """
    Permission to check if user is a team manager.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return UserRole.objects.filter(
            user=request.user,
            is_active=True,
            role_type=UserRole.RoleType.MANAGER
        ).exists()


class HasRoleInContext(permissions.BasePermission):
    """
    Permission to check if user has a specific role in a specific context.
    """
    
    def __init__(self, required_role_type, context_type=None):
        self.required_role_type = required_role_type
        self.context_type = context_type
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        queryset = UserRole.objects.filter(
            user=request.user,
            is_active=True,
            role_type=self.required_role_type
        )
        
        if self.context_type:
            queryset = queryset.filter(context_type=self.context_type)
        
        return queryset.exists()
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        
        # Check if user has role in the specific context
        context_id = getattr(obj, 'id', None)
        if context_id:
            return UserRole.objects.filter(
                user=request.user,
                is_active=True,
                role_type=self.required_role_type,
                context_type=self.context_type,
                context_id=context_id
            ).exists()
        
        return False
