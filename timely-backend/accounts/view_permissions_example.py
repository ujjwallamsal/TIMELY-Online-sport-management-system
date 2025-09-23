# accounts/view_permissions_example.py
"""
Example implementation showing how to apply the new RBAC permissions to ViewSets.
This demonstrates the recommended patterns for each role's access requirements.
"""

from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.rbac_permissions import (
    OrganizerPermissions,
    CoachPermissions,
    AthletePermissions, 
    SpectatorPermissions,
    PublicReadOnlyPermission,
    AdminSensitiveActionPermission,
    MultiRoleWithOrganizerPermission,
    MultiRoleWithCoachPermission
)
from accounts.audit_mixin import AuditLogMixin, AuditLogViewMixin


# Example 1: Event ViewSet with Organizer CRUD permissions
class EventViewSetExample(AuditLogViewMixin, viewsets.ModelViewSet):
    """
    Example: Organizer can CRUD only their events/venues and related objects.
    """
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve']:
            # Public read access for published events
            permission_classes = [PublicReadOnlyPermission]
        elif self.action == 'create':
            # Only organizers can create events
            permission_classes = [OrganizerPermissions]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Organizers can modify only their own events
            permission_classes = [OrganizerPermissions]
        elif self.action in ['publish', 'cancel']:
            # Admin-sensitive actions require audit logging
            permission_classes = [AdminSensitiveActionPermission]
        else:
            permission_classes = [OrganizerPermissions]
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """Create with audit logging"""
        return self.perform_create_with_audit(serializer)
    
    def perform_update(self, serializer):
        """Update with audit logging"""
        return self.perform_update_with_audit(serializer)
    
    def perform_destroy(self, instance):
        """Destroy with audit logging"""
        return self.perform_destroy_with_audit(instance)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish event - admin-sensitive action"""
        event = self.get_object()
        
        # Log the admin action
        self.log_event_action(
            request=request,
            action='EVENT_PUBLISH',
            event_id=event.id,
            details={'previous_status': event.status, 'new_status': 'PUBLISHED'}
        )
        
        # Update event status
        event.status = 'PUBLISHED'
        event.save()
        
        return Response({'status': 'Event published successfully'})


# Example 2: Team ViewSet with Coach R/W permissions
class TeamViewSetExample(AuditLogViewMixin, viewsets.ModelViewSet):
    """
    Example: Coach can R/W own team/roster; R on fixtures/results for their team's events.
    """
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve']:
            # Public read access for teams
            permission_classes = [PublicReadOnlyPermission]
        elif self.action == 'create':
            # Only organizers can create teams
            permission_classes = [MultiRoleWithOrganizerPermission()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Coaches can modify only their own teams
            permission_classes = [CoachPermissions]
        elif self.action == 'add_member':
            # Coach can add members to their teams
            permission_classes = [CoachPermissions]
        else:
            permission_classes = [CoachPermissions]
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """Create with audit logging"""
        return self.perform_create_with_audit(serializer)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add team member - coach can only add to their own teams"""
        team = self.get_object()
        
        # Log the team member addition
        self.log_team_action(
            request=request,
            action='TEAM_MEMBER_ADD',
            team_id=team.id,
            details={'athlete_id': request.data.get('athlete_id')}
        )
        
        # Add member logic here
        return Response({'status': 'Member added successfully'})


# Example 3: Fixture ViewSet with Coach/Athlete read permissions
class FixtureViewSetExample(viewsets.ModelViewSet):
    """
    Example: Coach can R fixtures/results for their team's events.
    Athlete can R on own fixtures/results.
    """
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve']:
            # Multi-role read access: coaches and athletes can read relevant fixtures
            permission_classes = [
                MultiRoleWithCoachPermission(
                    read_only_roles=['ATHLETE']  # Athletes get read-only access
                )
            ]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only organizers can modify fixtures
            permission_classes = [OrganizerPermissions]
        else:
            permission_classes = [PublicReadOnlyPermission]
        
        return [permission() for permission in permission_classes]


# Example 4: Result ViewSet with similar permissions
class ResultViewSetExample(viewsets.ModelViewSet):
    """
    Example: Coach can R results for their team's events.
    Athlete can R on own results.
    """
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve']:
            # Multi-role read access: coaches and athletes can read relevant results
            permission_classes = [
                MultiRoleWithCoachPermission(
                    read_only_roles=['ATHLETE']  # Athletes get read-only access
                )
            ]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only organizers can modify results
            permission_classes = [OrganizerPermissions]
        else:
            permission_classes = [PublicReadOnlyPermission]
        
        return [permission() for permission in permission_classes]


# Example 5: Ticket ViewSet with Athlete/Spectator permissions
class TicketViewSetExample(viewsets.ModelViewSet):
    """
    Example: Athlete can R on own tickets.
    Spectator can R on public; R/W on their purchases only.
    """
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve']:
            # Athletes and spectators can read their own tickets
            permission_classes = [AthletePermissions, SpectatorPermissions]
        elif self.action == 'create':
            # Anyone can purchase tickets
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Only owners can modify their tickets
            permission_classes = [AthletePermissions, SpectatorPermissions]
        elif self.action == 'use':
            # Only ticket owners can use tickets
            permission_classes = [AthletePermissions, SpectatorPermissions]
        else:
            permission_classes = [AthletePermissions, SpectatorPermissions]
        
        return [permission() for permission in permission_classes]


# Example 6: Purchase ViewSet with Spectator R/W permissions
class PurchaseViewSetExample(viewsets.ModelViewSet):
    """
    Example: Spectator can R/W on their purchases only.
    """
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve']:
            # Spectators can read their own purchases
            permission_classes = [SpectatorPermissions]
        elif self.action == 'create':
            # Anyone can create purchases (buy tickets)
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Only owners can modify their purchases
            permission_classes = [SpectatorPermissions]
        elif self.action == 'refund':
            # Admin-sensitive action
            permission_classes = [AdminSensitiveActionPermission]
        else:
            permission_classes = [SpectatorPermissions]
        
        return [permission() for permission in permission_classes]


# Example 7: User Profile ViewSet with Athlete R/W permissions
class UserProfileViewSetExample(viewsets.ModelViewSet):
    """
    Example: Athlete can R/W own profile.
    """
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve']:
            # Users can read their own profile
            permission_classes = [AthletePermissions]
        elif self.action in ['update', 'partial_update']:
            # Users can modify their own profile
            permission_classes = [AthletePermissions]
        elif self.action == 'create':
            # Profile creation is handled by registration
            permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'destroy':
            # Account deletion requires admin
            permission_classes = [AdminSensitiveActionPermission]
        else:
            permission_classes = [AthletePermissions]
        
        return [permission() for permission in permission_classes]


# Example 8: Admin ViewSet with audit logging
class AdminUserManagementViewSetExample(AuditLogViewMixin, viewsets.ModelViewSet):
    """
    Example: Admin-sensitive actions with comprehensive audit logging.
    """
    
    permission_classes = [AdminSensitiveActionPermission]
    
    def perform_create(self, serializer):
        """Create with audit logging"""
        instance = self.perform_create_with_audit(serializer)
        
        # Log additional admin action
        self.log_user_action(
            request=self.request,
            action='USER_CREATE',
            user_id=instance.id,
            details={'created_by': self.request.user.id}
        )
        
        return instance
    
    @action(detail=True, methods=['post'])
    def assign_role(self, request, pk=None):
        """Assign role to user - admin-sensitive action"""
        user = self.get_object()
        role = request.data.get('role')
        
        # Log the role assignment
        self.log_role_action(
            request=request,
            action='ROLE_ASSIGNMENT',
            user_id=user.id,
            role=role,
            details={'assigned_by': request.user.id}
        )
        
        # Assign role logic here
        return Response({'status': 'Role assigned successfully'})


# Example 9: Public API with no authentication required
class PublicEventViewSetExample(viewsets.ReadOnlyModelViewSet):
    """
    Example: Public read-only access with no authentication required.
    """
    
    permission_classes = [PublicReadOnlyPermission]
    
    def get_queryset(self):
        """Return only public events"""
        return Event.objects.filter(visibility='PUBLIC')


# Example 10: Multi-role view with different access levels
class EventManagementViewSetExample(viewsets.ModelViewSet):
    """
    Example: Multi-role access with different permission levels.
    """
    
    def get_permissions(self):
        """Set permissions based on action and role requirements"""
        if self.action in ['list', 'retrieve']:
            # Multiple roles can read: organizers (full), coaches (limited), athletes (limited)
            permission_classes = [
                MultiRoleWithOrganizerPermission(
                    read_only_roles=['COACH', 'ATHLETE']
                )
            ]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only organizers can modify
            permission_classes = [OrganizerPermissions]
        elif self.action in ['register', 'unregister']:
            # Athletes can register/unregister
            permission_classes = [AthletePermissions]
        else:
            permission_classes = [OrganizerPermissions]
        
        return [permission() for permission in permission_classes]
