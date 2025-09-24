# accounts/permissions.py
from rest_framework import permissions
from teams.models import Team, TeamMember
from events.models import Event
from fixtures.models import Fixture
from results.models import Result


class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow users with 'ADMIN' role or superusers to access.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (request.user.is_superuser or 
                request.user.is_staff or 
                request.user.role == 'ADMIN')


class IsOrganizerOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow users with 'ORGANIZER' or 'ADMIN' role to access.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return (request.user.is_superuser or 
                request.user.is_staff or
                request.user.role == 'ADMIN' or 
                request.user.role == 'ORGANIZER')


class IsUserManager(permissions.BasePermission):
    """
    Permission to check if user can manage other users.
    Allows access if user is admin.
    """
    
    def has_permission(self, request, view):
        # Admin users can do anything
        if request.user.is_staff:
            return True
        
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Only admins can manage users
        return request.user.role == 'ADMIN'
    
    def has_object_permission(self, request, view, obj):
        # Admin users can do anything
        if request.user.is_staff:
            return True
        
        # Only admins can manage users
        return request.user.role == 'ADMIN'


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
        
        return request.user.role in ['ADMIN', 'ORGANIZER']


class CanManageTeams(permissions.BasePermission):
    """
    Permission to check if user can manage teams.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return request.user.role in ['ADMIN', 'ORGANIZER', 'COACH']


class CanManageFixtures(permissions.BasePermission):
    """
    Permission to check if user can manage fixtures.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return request.user.role in ['ADMIN', 'ORGANIZER', 'COACH']


class CanManageResults(permissions.BasePermission):
    """
    Permission to check if user can manage results.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return request.user.role in ['ADMIN', 'ORGANIZER', 'COACH']


class IsOrganizer(permissions.BasePermission):
    """
    Permission to check if user is an event organizer.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return request.user.role == 'ORGANIZER'


class IsAthlete(permissions.BasePermission):
    """
    Permission to check if user is an athlete.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return request.user.role == 'ATHLETE'


class IsCoach(permissions.BasePermission):
    """
    Permission to check if user is a coach.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return request.user.role == 'COACH'


class IsSpectator(permissions.BasePermission):
    """
    Permission to check if user is a spectator.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return request.user.role == 'SPECTATOR'


# New RBAC Permission Classes
class IsOrganizerOfEvent(permissions.BasePermission):
    """
    Permission to check if user is organizer of a specific event.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        # Check if user is organizer
        return request.user.role == 'ORGANIZER'
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        
        # For Event objects, check if user created the event
        if isinstance(obj, Event):
            return obj.created_by == request.user
        
        # For other objects, check if they belong to an event the user created
        if hasattr(obj, 'event'):
            return obj.event.created_by == request.user
        
        return False


class IsCoachOfTeam(permissions.BasePermission):
    """
    Permission to check if user is coach of a specific team.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        # Check if user is coach
        return request.user.role == 'COACH'
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        
        # For Team objects, check if user is the coach
        if isinstance(obj, Team):
            return obj.coach == request.user
        
        # For TeamMember objects, check if user coaches the team
        if isinstance(obj, TeamMember):
            return obj.team.coach == request.user
        
        # For other objects, check if they belong to a team the user coaches
        if hasattr(obj, 'team'):
            return obj.team.coach == request.user
        
        return False


class IsAthleteSelf(permissions.BasePermission):
    """
    Permission to check if user is accessing their own data as an athlete.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        # Check if user is athlete
        return request.user.role == 'ATHLETE'
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        
        # For User objects, check if it's the same user
        if hasattr(obj, 'id') and hasattr(request.user, 'id'):
            return obj.id == request.user.id
        
        # For objects with user field, check if it's the same user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # For objects with athlete field, check if it's the same user
        if hasattr(obj, 'athlete'):
            return obj.athlete == request.user
        
        return False


class IsSpectatorReadOnly(permissions.BasePermission):
    """
    Permission for spectators - read-only access to public data.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        # Check if user is spectator
        is_spectator = request.user.role == 'SPECTATOR'
        
        # Spectators can only read (GET, HEAD, OPTIONS)
        if is_spectator:
            return request.method in permissions.SAFE_METHODS
        
        return False
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        
        # Spectators can only read
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner of the object.
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        elif hasattr(obj, 'owner'):
            return obj.owner == request.user
        
        return False


class IsOrganizerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow organizers to edit, others to read.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        # Allow read access to all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Allow write access only to organizers
        return request.user.role == 'ORGANIZER'
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        
        # Allow read access to all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Allow write access only to organizers
        return request.user.role == 'ORGANIZER'


class IsOrganizerOwner(permissions.BasePermission):
    """
    Organizer can CRUD only their own events/venues and related objects.
    Admin/staff bypass.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        if not request.user.is_authenticated:
            return False
        # Organizer role check
        return request.user.role == 'ORGANIZER'
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        # Read is allowed; ownership enforced for writes
        if request.method in permissions.SAFE_METHODS:
            return True
        # Direct ownership
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        # Related to Event
        if hasattr(obj, 'event') and hasattr(obj.event, 'created_by'):
            return obj.event.created_by == request.user
        # Related to Venue
        if hasattr(obj, 'venue') and hasattr(obj.venue, 'created_by'):
            return obj.venue.created_by == request.user
        return False


class IsCoachRWTeamOrRoster(permissions.BasePermission):
    """
    Coach: Read/Write on their own team and roster (Team, TeamMember).
    Admin/staff bypass.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        if not request.user.is_authenticated:
            return False
        return request.user.role == 'COACH'
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        # Applies to Team and TeamMember objects
        if isinstance(obj, Team):
            return obj.coach == request.user
        if isinstance(obj, TeamMember):
            return obj.team.coach == request.user
        # For other objects that reference a team
        if hasattr(obj, 'team') and isinstance(obj.team, Team):
            return obj.team.coach == request.user
        return False


class CoachCanViewFixturesResults(permissions.BasePermission):
    """
    Coach can READ fixtures/results for events where they coach a team.
    Admin/staff bypass.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        if not request.user.is_authenticated:
            return False
        # Only read access through this permission
        if request.method not in permissions.SAFE_METHODS:
            return False
        return request.user.role == 'COACH'
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        if request.method not in permissions.SAFE_METHODS:
            return False
        # Fixture
        if isinstance(obj, Fixture):
            event = obj.event
        # Result -> Fixture -> Event
        elif isinstance(obj, Result):
            event = obj.fixture.event
        else:
            # Try to derive event
            event = getattr(obj, 'event', None)
        if not event:
            return False
        return Team.objects.filter(event=event, coach=request.user).exists()


class IsAthleteSelfRW(permissions.BasePermission):
    """
    Athlete can read/write their own profile and self-owned resources.
    Admin/staff bypass.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        if not request.user.is_authenticated:
            return False
        return request.user.role == 'ATHLETE'
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        # Own user profile or objects with user/athlete ownership
        if hasattr(obj, 'id') and getattr(request.user, 'id', None) == getattr(obj, 'id', None):
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'athlete'):
            return obj.athlete == request.user
        return False


class AthleteCanViewOwnFixturesResults(permissions.BasePermission):
    """
    Athlete can READ fixtures/results where they are on a participating team.
    Admin/staff bypass.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        if not request.user.is_authenticated:
            return False
        if request.method not in permissions.SAFE_METHODS:
            return False
        return request.user.role == 'ATHLETE'
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        if request.method not in permissions.SAFE_METHODS:
            return False
        # Resolve teams in the fixture
        if isinstance(obj, Fixture):
            teams = [obj.home, obj.away]
        elif isinstance(obj, Result):
            teams = [obj.fixture.home, obj.fixture.away]
        else:
            # Try to infer from related fixture
            fixture = getattr(obj, 'fixture', None)
            if fixture and isinstance(fixture, Fixture):
                teams = [fixture.home, fixture.away]
            else:
                teams = []
        team_ids = [t.id for t in teams if t]
        if not team_ids:
            return False
        return TeamMember.objects.filter(team_id__in=team_ids, athlete=request.user).exists()


class SpectatorOwnPurchasesRW(permissions.BasePermission):
    """
    Spectator: Read on public data is usually handled at the view level.
    This permission ensures spectators can read/write only their own purchases/orders.
    Admin/staff bypass.
    """
    
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        if not request.user.is_authenticated:
            return False
        # Spectators can access purchase endpoints; object-level will enforce ownership
        return request.user.role == 'SPECTATOR'
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        # Ownership via `user` or nested `purchase.user` or order `user`
        owner = getattr(obj, 'user', None)
        if owner is None and hasattr(obj, 'purchase'):
            owner = getattr(obj.purchase, 'user', None)
        return owner == request.user