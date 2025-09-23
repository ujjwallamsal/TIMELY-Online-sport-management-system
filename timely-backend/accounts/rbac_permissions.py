# accounts/rbac_permissions.py
"""
Comprehensive RBAC permissions for DRF implementing the specific requirements:
- Organizer: CRUD only for their events/venues and related objects
- Coach: R/W own team/roster; R on fixtures/results for their team's events
- Athlete: R/W own profile; R on own fixtures/results; R on own tickets
- Spectator: R on public; R/W on their purchases only
"""
from rest_framework import permissions
from django.contrib.auth import get_user_model
from .models import UserRole
from events.models import Event
from teams.models import Team, TeamMember
from fixtures.models import Fixture
from results.models import Result
from tickets.models import Ticket, TicketOrder
from venues.models import Venue

User = get_user_model()


class BaseRBACPermission(permissions.BasePermission):
    """
    Base RBAC permission class with common functionality.
    All role-specific permissions inherit from this.
    """
    
    def is_admin_or_staff(self, user):
        """Check if user is admin or staff (bypasses all restrictions)"""
        return user and user.is_authenticated and (user.is_staff or user.is_superuser)
    
    def has_legacy_role(self, user, role):
        """Check if user has legacy role field set"""
        return user and user.is_authenticated and getattr(user, 'role', '').upper() == role.upper()
    
    def has_rbac_role(self, user, role_type):
        """Check if user has RBAC role via UserRole model"""
        if not user or not user.is_authenticated:
            return False
        return UserRole.objects.filter(
            user=user,
            is_active=True,
            role_type=role_type
        ).exists()
    
    def has_role(self, user, role_type):
        """Check if user has role via legacy field or RBAC"""
        return self.has_legacy_role(user, role_type) or self.has_rbac_role(user, role_type)


class OrganizerPermissions(BaseRBACPermission):
    """
    Organizer: CRUD only for their events/venues and related objects.
    Admin/staff bypass.
    """
    
    def has_permission(self, request, view):
        # Admin/staff can do anything
        if self.is_admin_or_staff(request.user):
            return True
        
        # Must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Must be organizer
        return self.has_role(request.user, UserRole.RoleType.ORGANIZER)
    
    def has_object_permission(self, request, view, obj):
        # Admin/staff can do anything
        if self.is_admin_or_staff(request.user):
            return True
        
        # For Event objects
        if isinstance(obj, Event):
            return obj.created_by == request.user
        
        # For Venue objects
        if isinstance(obj, Venue):
            return obj.created_by == request.user
        
        # For objects that belong to an event
        if hasattr(obj, 'event') and obj.event:
            return obj.event.created_by == request.user
        
        # For objects that belong to a venue
        if hasattr(obj, 'venue') and obj.venue:
            return obj.venue.created_by == request.user
        
        # For Announcement objects
        if hasattr(obj, 'created_by') and hasattr(obj, 'event'):
            return obj.created_by == request.user
        
        return False


class CoachPermissions(BaseRBACPermission):
    """
    Coach: R/W own team/roster; R on fixtures/results for their team's events.
    Admin/staff bypass.
    """
    
    def has_permission(self, request, view):
        # Admin/staff can do anything
        if self.is_admin_or_staff(request.user):
            return True
        
        # Must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Must be coach
        return self.has_role(request.user, UserRole.RoleType.COACH)
    
    def has_object_permission(self, request, view, obj):
        # Admin/staff can do anything
        if self.is_admin_or_staff(request.user):
            return True
        
        # For Team objects - coach can R/W their own teams
        if isinstance(obj, Team):
            return obj.coach == request.user
        
        # For TeamMember objects - coach can R/W members of their teams
        if isinstance(obj, TeamMember):
            return obj.team.coach == request.user
        
        # For Fixture objects - coach can R fixtures/results for their team's events
        if isinstance(obj, Fixture):
            if request.method in permissions.SAFE_METHODS:
                # Check if user coaches any team in this fixture's event
                return Team.objects.filter(
                    event=obj.event,
                    coach=request.user
                ).exists()
            return False  # Coaches cannot write fixtures
        
        # For Result objects - coach can R results for their team's events
        if isinstance(obj, Result):
            if request.method in permissions.SAFE_METHODS:
                # Check if user coaches any team in this result's fixture's event
                return Team.objects.filter(
                    event=obj.fixture.event,
                    coach=request.user
                ).exists()
            return False  # Coaches cannot write results
        
        # For objects that reference a team
        if hasattr(obj, 'team') and isinstance(obj.team, Team):
            return obj.team.coach == request.user
        
        return False


class AthletePermissions(BaseRBACPermission):
    """
    Athlete: R/W own profile; R on own fixtures/results; R on own tickets.
    Admin/staff bypass.
    """
    
    def has_permission(self, request, view):
        # Admin/staff can do anything
        if self.is_admin_or_staff(request.user):
            return True
        
        # Must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Must be athlete
        return self.has_role(request.user, UserRole.RoleType.ATHLETE)
    
    def has_object_permission(self, request, view, obj):
        # Admin/staff can do anything
        if self.is_admin_or_staff(request.user):
            return True
        
        # For User objects - athletes can R/W their own profile
        if isinstance(obj, User):
            return obj == request.user
        
        # For Fixture objects - athletes can R fixtures where they're on a team
        if isinstance(obj, Fixture):
            if request.method in permissions.SAFE_METHODS:
                # Check if user is a member of any team in this fixture
                team_ids = []
                if obj.home:
                    team_ids.append(obj.home.id)
                if obj.away:
                    team_ids.append(obj.away.id)
                
                if team_ids:
                    return TeamMember.objects.filter(
                        team_id__in=team_ids,
                        athlete=request.user
                    ).exists()
            return False  # Athletes cannot write fixtures
        
        # For Result objects - athletes can R results where they're on a team
        if isinstance(obj, Result):
            if request.method in permissions.SAFE_METHODS:
                # Check if user is a member of any team in this result's fixture
                team_ids = []
                if obj.fixture.home:
                    team_ids.append(obj.fixture.home.id)
                if obj.fixture.away:
                    team_ids.append(obj.fixture.away.id)
                
                if team_ids:
                    return TeamMember.objects.filter(
                        team_id__in=team_ids,
                        athlete=request.user
                    ).exists()
            return False  # Athletes cannot write results
        
        # For Ticket objects - athletes can R their own tickets
        if isinstance(obj, Ticket):
            if request.method in permissions.SAFE_METHODS:
                return obj.order.user == request.user
            return False  # Athletes cannot modify tickets
        
        # For TicketOrder objects - athletes can R their own orders
        if isinstance(obj, TicketOrder):
            if request.method in permissions.SAFE_METHODS:
                return obj.user == request.user
            return False  # Athletes cannot modify orders
        
        # For TeamMember objects - athletes can R their own memberships
        if isinstance(obj, TeamMember):
            if request.method in permissions.SAFE_METHODS:
                return obj.athlete == request.user
            return False  # Athletes cannot modify team memberships
        
        # For objects with user field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # For objects with athlete field
        if hasattr(obj, 'athlete'):
            return obj.athlete == request.user
        
        return False


class SpectatorPermissions(BaseRBACPermission):
    """
    Spectator: R on public; R/W on their purchases only.
    Admin/staff bypass.
    """
    
    def has_permission(self, request, view):
        # Admin/staff can do anything
        if self.is_admin_or_staff(request.user):
            return True
        
        # Must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Must be spectator
        return self.has_role(request.user, UserRole.RoleType.SPECTATOR)
    
    def has_object_permission(self, request, view, obj):
        # Admin/staff can do anything
        if self.is_admin_or_staff(request.user):
            return True
        
        # For Event objects - spectators can R public events
        if isinstance(obj, Event):
            if request.method in permissions.SAFE_METHODS:
                return obj.visibility == 'PUBLIC'
            return False  # Spectators cannot write events
        
        # For Ticket objects - spectators can R/W their own tickets
        if isinstance(obj, Ticket):
            return obj.order.user == request.user
        
        # For TicketOrder objects - spectators can R/W their own orders
        if isinstance(obj, TicketOrder):
            return obj.user == request.user
        
        # For User objects - spectators can R/W their own profile
        if isinstance(obj, User):
            return obj == request.user
        
        # For public data, allow read access
        if request.method in permissions.SAFE_METHODS:
            # Check if object is public (has visibility field)
            if hasattr(obj, 'visibility'):
                return obj.visibility == 'PUBLIC'
            # Check if object is public (has is_public field)
            if hasattr(obj, 'is_public'):
                return obj.is_public
            # For events, check if they're public
            if hasattr(obj, 'event'):
                return obj.event.visibility == 'PUBLIC'
        
        return False


class MultiRolePermissions(BaseRBACPermission):
    """
    Permission class that allows multiple roles with different access levels.
    Useful for views that need to support multiple user types.
    """
    
    def __init__(self, allowed_roles=None, read_only_roles=None):
        """
        Args:
            allowed_roles: List of role types that have full access
            read_only_roles: List of role types that have read-only access
        """
        self.allowed_roles = allowed_roles or []
        self.read_only_roles = read_only_roles or []
    
    def has_permission(self, request, view):
        # Admin/staff can do anything
        if self.is_admin_or_staff(request.user):
            return True
        
        # Must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has any of the allowed roles
        for role in self.allowed_roles + self.read_only_roles:
            if self.has_role(request.user, role):
                return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        # Admin/staff can do anything
        if self.is_admin_or_staff(request.user):
            return True
        
        # Check read-only roles first
        for role in self.read_only_roles:
            if self.has_role(request.user, role):
                return request.method in permissions.SAFE_METHODS
        
        # Check full access roles
        for role in self.allowed_roles:
            if self.has_role(request.user, role):
                return True
        
        return False


class PublicReadOnlyPermission(BaseRBACPermission):
    """
    Permission for public read-only access with optional authenticated write access.
    """
    
    def has_permission(self, request, view):
        # Allow all read operations
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # For write operations, require authentication
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Allow all read operations
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # For write operations, delegate to specific role permissions
        # This should be combined with other permissions in practice
        return False


class AdminSensitiveActionPermission(BaseRBACPermission):
    """
    Permission for admin-sensitive actions that require audit logging.
    Only allows admin/staff access.
    """
    
    def has_permission(self, request, view):
        # Only admin/staff can access
        return self.is_admin_or_staff(request.user)
    
    def has_object_permission(self, request, view, obj):
        # Only admin/staff can access
        return self.is_admin_or_staff(request.user)


# Convenience permission classes for common combinations
class OrganizerOrAdminPermission(OrganizerPermissions):
    """Organizer or Admin permission - organizers get restricted access, admins get full access"""
    pass


class CoachOrAdminPermission(CoachPermissions):
    """Coach or Admin permission - coaches get restricted access, admins get full access"""
    pass


class AthleteOrAdminPermission(AthletePermissions):
    """Athlete or Admin permission - athletes get restricted access, admins get full access"""
    pass


class SpectatorOrAdminPermission(SpectatorPermissions):
    """Spectator or Admin permission - spectators get restricted access, admins get full access"""
    pass


class PublicOrAuthenticatedPermission(PublicReadOnlyPermission):
    """Public read access, authenticated write access"""
    pass


class MultiRoleWithOrganizerPermission(MultiRolePermissions):
    """Multi-role permission that includes organizer with full access"""
    def __init__(self, additional_roles=None, read_only_roles=None):
        allowed_roles = [UserRole.RoleType.ORGANIZER] + (additional_roles or [])
        super().__init__(allowed_roles=allowed_roles, read_only_roles=read_only_roles)


class MultiRoleWithCoachPermission(MultiRolePermissions):
    """Multi-role permission that includes coach with full access"""
    def __init__(self, additional_roles=None, read_only_roles=None):
        allowed_roles = [UserRole.RoleType.COACH] + (additional_roles or [])
        super().__init__(allowed_roles=allowed_roles, read_only_roles=read_only_roles)
