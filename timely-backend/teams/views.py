# teams/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.auth import get_user_model
from django.db import models
from .models import Team, TeamMember
from .serializers import TeamSerializer, TeamMemberSerializer
from accounts.permissions import IsCoachOfTeam, IsAthleteSelf, IsAdmin, IsOrganizerOfEvent
from accounts.audit_mixin import AuditLogMixin

User = get_user_model()

# Create a simple permission class for team membership
class IsTeamMemberOrReadOnly(permissions.BasePermission):
    """Allow read access to all authenticated users, write access to team members"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin users have access to everything
        if request.user.role == 'ADMIN' or request.user.is_staff:
            return True
        
        # For read operations, allow all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # For write operations, check object-level permissions
        return True
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin users have access to everything
        if request.user.role == 'ADMIN' or request.user.is_staff:
            return True
        
        # For read operations, allow all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Team members can modify team-related objects
        if hasattr(obj, 'team') and obj.team.members.filter(user=request.user).exists():
            return True
        
        return False


class TeamViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing teams.
    
    Provides CRUD operations for teams with proper RBAC.
    """
    queryset = Team.objects.select_related('event', 'manager', 'coach').prefetch_related('members__athlete').all()
    serializer_class = TeamSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['event', 'manager', 'coach']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve']:
            # All authenticated users can read
            permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'create':
            # Only coaches and organizers can create teams
            permission_classes = [permissions.IsAuthenticated, IsCoachOfTeam]
        else:
            # Only coaches of the team can update/delete
            permission_classes = [permissions.IsAuthenticated, IsCoachOfTeam]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter teams based on user role and permissions.
        """
        queryset = super().get_queryset()
        
        # Apply role-based filtering
        if self.request.user.is_staff or self.request.user.role == 'ADMIN':
            # Admin sees all teams
            pass
        elif self.request.user.role == 'ORGANIZER':
            # Organizer sees teams for their events
            queryset = queryset.filter(event__created_by=self.request.user)
        elif self.request.user.role == 'COACH':
            # Coach sees teams they coach
            queryset = queryset.filter(coach=self.request.user)
        elif self.request.user.role == 'ATHLETE':
            # Athlete sees teams they're a member of
            queryset = queryset.filter(members__athlete=self.request.user).distinct()
        else:
            # Spectator sees public teams
            queryset = queryset.filter(event__visibility='PUBLIC')
        
        # Apply ?mine=true filter for coaches
        if self.request.query_params.get('mine') == 'true' and self.request.user.is_authenticated:
            if self.request.user.role == 'COACH':
                queryset = queryset.filter(coach=self.request.user)
        
        # Filter by event
        event_id = self.request.query_params.get('event', None)
        if event_id is not None:
            queryset = queryset.filter(event_id=event_id)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to the team"""
        team = self.get_object()
        
        # Check permissions - only coaches can add members
        if not (team.coach == request.user or request.user.is_staff):
            return Response(
                {'error': 'Only team coaches can add members'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        athlete_id = request.data.get('athlete_id')
        jersey_no = request.data.get('jersey_no')
        position = request.data.get('position', '')
        
        if not athlete_id or not jersey_no:
            return Response(
                {'error': 'athlete_id and jersey_no are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            athlete = User.objects.get(id=athlete_id)
            team_member = TeamMember.objects.create(
                team=team,
                athlete=athlete,
                jersey_no=jersey_no,
                position=position
            )
            serializer = TeamMemberSerializer(team_member)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response(
                {'error': 'Athlete not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None):
        """Remove a member from the team"""
        team = self.get_object()
        member_id = request.data.get('member_id')
        
        if not member_id:
            return Response(
                {'error': 'member_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check permissions - only coaches can remove members
        if not (team.coach == request.user or request.user.is_staff):
            return Response(
                {'error': 'Only team coaches can remove members'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            member = team.members.get(id=member_id)
            member.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TeamMember.DoesNotExist:
            return Response(
                {'error': 'Team member not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class TeamMemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing team members.
    
    Provides CRUD operations for team members with proper RBAC.
    """
    queryset = TeamMember.objects.select_related('team', 'athlete').all()
    serializer_class = TeamMemberSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['team', 'athlete', 'is_captain']
    search_fields = ['athlete__first_name', 'athlete__last_name', 'position']
    ordering_fields = ['jersey_no', 'created_at']
    ordering = ['jersey_no']
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve']:
            # All authenticated users can read
            permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'create':
            # Only coaches can create team members
            permission_classes = [permissions.IsAuthenticated, IsCoachOfTeam]
        else:
            # Only coaches can update/delete team members
            permission_classes = [permissions.IsAuthenticated, IsCoachOfTeam]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter team members based on user role and permissions.
        """
        queryset = super().get_queryset()
        
        # Apply role-based filtering
        if self.request.user.is_staff or self.request.user.role == 'ADMIN':
            # Admin sees all team members
            pass
        elif self.request.user.role == 'ORGANIZER':
            # Organizer sees team members for their events
            queryset = queryset.filter(team__event__created_by=self.request.user)
        elif self.request.user.role == 'COACH':
            # Coach sees team members for teams they coach
            queryset = queryset.filter(team__coach=self.request.user)
        elif self.request.user.role == 'ATHLETE':
            # Athlete sees their own memberships
            queryset = queryset.filter(athlete=self.request.user)
        else:
            # Spectator sees public team members
            queryset = queryset.filter(team__event__visibility='PUBLIC')
        
        # Filter by team
        team_id = self.request.query_params.get('team', None)
        if team_id is not None:
            queryset = queryset.filter(team_id=team_id)
        
        return queryset