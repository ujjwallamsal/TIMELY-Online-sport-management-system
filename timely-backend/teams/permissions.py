from rest_framework import permissions
from .models import TeamMember, Team, TeamEventEntry


class IsTeamManager(permissions.BasePermission):
    """
    Permission to check if user can manage a team.
    Allows access if user is a team manager or admin.
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
        
        # For team objects, check if user is a manager
        if isinstance(obj, Team):
            return TeamMember.objects.filter(
                team=obj,
                user=request.user,
                can_manage_team=True,
                status=TeamMember.Status.ACTIVE
            ).exists()
        
        # For team member objects, check if user can manage the team
        if isinstance(obj, TeamMember):
            return TeamMember.objects.filter(
                team=obj.team,
                user=request.user,
                can_manage_team=True,
                status=TeamMember.Status.ACTIVE
            ).exists()
        
        return False


class IsTeamMember(permissions.BasePermission):
    """
    Permission to check if user is a member of a team.
    Allows access if user is an active team member or admin.
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
        
        # For team objects, check if user is a member
        if isinstance(obj, Team):
            return TeamMember.objects.filter(
                team=obj,
                user=request.user,
                status=TeamMember.Status.ACTIVE
            ).exists()
        
        # For team member objects, check if user is the member or can manage the team
        if isinstance(obj, TeamMember):
            # User can access their own membership
            if obj.user == request.user:
                return True
            
            # Team managers can access member information
            return TeamMember.objects.filter(
                team=obj.team,
                user=request.user,
                can_manage_team=True,
                status=TeamMember.Status.ACTIVE
            ).exists()
        
        return False


class CanInviteMembers(permissions.BasePermission):
    """
    Permission to check if user can invite members to a team.
    Allows access if user is a team manager or admin.
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
        
        # For team invitation objects, check if user can manage the team
        if hasattr(obj, 'team'):
            return TeamMember.objects.filter(
                team=obj.team,
                user=request.user,
                can_manage_team=True,
                status=TeamMember.Status.ACTIVE
            ).exists()
        
        return False


class CanEditResults(permissions.BasePermission):
    """
    Permission to check if user can edit match results.
    Allows access if user has result editing permissions or is admin.
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
        
        # Check if user has result editing permissions for the team
        if hasattr(obj, 'team'):
            return TeamMember.objects.filter(
                team=obj.team,
                user=request.user,
                can_edit_results=True,
                status=TeamMember.Status.ACTIVE
            ).exists()
        
        return False


class IsTeamOwner(permissions.BasePermission):
    """
    Permission to check if user is the team owner/creator or manager.
    Allows access if user is team manager, created the team, or is admin.
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
        
        # Check if user is the team manager or creator
        if isinstance(obj, Team):
            return (obj.manager == request.user or 
                   obj.created_by == request.user or
                   TeamMember.objects.filter(
                       team=obj,
                       user=request.user,
                       can_manage_team=True,
                       status=TeamMember.Status.ACTIVE
                   ).exists())
        
        return False


class IsOrganizerOrAdmin(permissions.BasePermission):
    """
    Permission to check if user is an organizer or admin.
    Allows access for event organizers and admins.
    """
    
    def has_permission(self, request, view):
        # Admin users can do anything
        if request.user.is_staff:
            return True
        
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Check if user has organizer role
        role = getattr(request.user, 'role', '').upper()
        return role in {'ORGANIZER', 'ADMIN'}
    
    def has_object_permission(self, request, view, obj):
        # Admin users can do anything
        if request.user.is_staff:
            return True
        
        # Check if user has organizer role
        role = getattr(request.user, 'role', '').upper()
        return role in {'ORGANIZER', 'ADMIN'}


class CanManageTeamEntries(permissions.BasePermission):
    """
    Permission to check if user can manage team entries.
    Allows team managers/coaches to manage their team's entries.
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
        
        # For team event entries, check if user can manage the team
        if isinstance(obj, TeamEventEntry):
            return TeamMember.objects.filter(
                team=obj.team,
                user=request.user,
                can_manage_team=True,
                status=TeamMember.Status.ACTIVE
            ).exists() or obj.team.manager == request.user
        
        return False


class CanApproveTeamEntries(permissions.BasePermission):
    """
    Permission to check if user can approve/reject team entries.
    Allows organizers and admins to approve entries.
    """
    
    def has_permission(self, request, view):
        # Admin users can do anything
        if request.user.is_staff:
            return True
        
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Check if user has organizer role
        role = getattr(request.user, 'role', '').upper()
        return role in {'ORGANIZER', 'ADMIN'}
    
    def has_object_permission(self, request, view, obj):
        # Admin users can do anything
        if request.user.is_staff:
            return True
        
        # Check if user has organizer role
        role = getattr(request.user, 'role', '').upper()
        return role in {'ORGANIZER', 'ADMIN'}


class CanViewTeamInfo(permissions.BasePermission):
    """
    Permission to check if user can view team information.
    Allows access if team is public, user is a member, or user is admin.
    """
    
    def has_permission(self, request, view):
        # Admin users can do anything
        if request.user.is_staff:
            return True
        
        return True
    
    def has_object_permission(self, request, view, obj):
        # Admin users can do anything
        if request.user.is_staff:
            return True
        
        # Check if team is public
        if isinstance(obj, Team) and obj.is_public:
            return True
        
        # Check if user is a team member
        if isinstance(obj, Team):
            return TeamMember.objects.filter(
                team=obj,
                user=request.user,
                status=TeamMember.Status.ACTIVE
            ).exists()
        
        return False
