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
from .permissions import IsTeamManagerOrReadOnly, IsTeamMemberOrReadOnly

User = get_user_model()


class TeamViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing teams.
    
    Provides CRUD operations for teams with proper RBAC.
    """
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeamManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['event', 'manager', 'coach']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """
        Optionally restricts the returned teams by filtering against
        query parameters in the URL.
        """
        queryset = Team.objects.all()
        
        # Filter by event
        event_id = self.request.query_params.get('event', None)
        if event_id is not None:
            queryset = queryset.filter(event_id=event_id)
        
        # Filter by user's teams (if not admin)
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                models.Q(manager=self.request.user) | 
                models.Q(coach=self.request.user) |
                models.Q(members__athlete=self.request.user)
            ).distinct()
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to the team"""
        team = self.get_object()
        
        # Check permissions
        if not (team.manager == request.user or request.user.is_staff):
            return Response(
                {'error': 'Only team managers can add members'}, 
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
        
        # Check permissions
        if not (team.manager == request.user or request.user.is_staff):
            return Response(
                {'error': 'Only team managers can remove members'}, 
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
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeamMemberOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['team', 'athlete', 'is_captain']
    search_fields = ['athlete__first_name', 'athlete__last_name', 'position']
    ordering_fields = ['jersey_no', 'created_at']
    ordering = ['jersey_no']
    
    def get_queryset(self):
        """
        Optionally restricts the returned team members by filtering against
        query parameters in the URL.
        """
        queryset = TeamMember.objects.all()
        
        # Filter by team
        team_id = self.request.query_params.get('team', None)
        if team_id is not None:
            queryset = queryset.filter(team_id=team_id)
        
        # Filter by user's memberships (if not admin)
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                models.Q(athlete=self.request.user) |
                models.Q(team__manager=self.request.user) |
                models.Q(team__coach=self.request.user)
            ).distinct()
        
        return queryset