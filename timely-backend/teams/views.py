from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from django.utils import timezone

from .models import Team, TeamMember, AthleteProfile, TeamInvitation, TeamEventEntry
from .serializers import (
    TeamSerializer, TeamCreateSerializer, TeamUpdateSerializer,
    TeamMemberSerializer, TeamMemberCreateSerializer, TeamMemberUpdateSerializer,
    AthleteProfileSerializer, TeamInvitationSerializer, TeamInvitationCreateSerializer,
    TeamInvitationResponseSerializer, TeamStatsSerializer, TeamRosterSerializer,
    TeamEventEntrySerializer, TeamEventEntryCreateSerializer, TeamEventEntryActionSerializer,
    EligibilityCheckSerializer, EligibilityResultSerializer
)
from .permissions import (
    IsTeamManager, IsTeamMember, CanInviteMembers, IsTeamOwner, 
    IsOrganizerOrAdmin, CanManageTeamEntries, CanApproveTeamEntries
)
from .services.eligibility import EligibilityChecker


class TeamViewSet(viewsets.ModelViewSet):
    """ViewSet for managing teams"""
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sport', 'is_active', 'is_public', 'manager', 'coach']
    search_fields = ['name', 'description', 'sport']
    ordering_fields = ['name', 'created_at', 'total_matches', 'wins', 'points']
    ordering = ['name']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return TeamCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TeamUpdateSerializer
        return TeamSerializer
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        queryset = super().get_queryset()
        
        # If user is not authenticated, only show public teams
        if not self.request.user.is_authenticated:
            return queryset.filter(is_public=True)
        
        # If user is not staff, only show teams they own/manage or public teams
        if not self.request.user.is_staff:
            user_teams = queryset.filter(
                Q(manager=self.request.user) |
                Q(created_by=self.request.user) |
                Q(members__user=self.request.user, members__can_manage_team=True) |
                Q(is_public=True)
            ).distinct()
            return user_teams
        
        return queryset
    
    def perform_create(self, serializer):
        """Set the creator when creating a team"""
        if self.request.user.is_authenticated:
            serializer.save(created_by=self.request.user)
        else:
            # This should not happen due to permissions, but just in case
            raise PermissionDenied("Authentication required to create teams")
    
    @action(detail=True, methods=['get'])
    def roster(self, request, pk=None):
        """Get team roster with active members"""
        team = self.get_object()
        serializer = TeamRosterSerializer(team)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get team statistics"""
        team = self.get_object()
        serializer = TeamStatsSerializer(team)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all team members"""
        team = self.get_object()
        members = team.members.all()
        serializer = TeamMemberSerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def public_info(self, request, pk=None):
        """Get public team information"""
        team = self.get_object()
        if not team.is_public:
            return Response(
                {"detail": "Team information is not public"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Return limited public information
        data = {
            'id': team.id,
            'name': team.name,
            'sport': team.sport,
            'description': team.description,
            'total_matches': team.total_matches,
            'wins': team.wins,
            'losses': team.losses,
            'draws': team.draws,
            'win_percentage': team.win_percentage,
            'points': team.points,
        }
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def my_teams(self, request):
        """Get teams where the user is a member"""
        user_teams = Team.objects.filter(
            members__user=request.user,
            members__status=TeamMember.Status.ACTIVE
        ).distinct()
        
        page = self.paginate_queryset(user_teams)
        if page is not None:
            serializer = TeamSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = TeamSerializer(user_teams, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def managed_teams(self, request):
        """Get teams where the user has management permissions"""
        managed_teams = Team.objects.filter(
            members__user=request.user,
            members__can_manage_team=True,
            members__status=TeamMember.Status.ACTIVE
        ).distinct()
        
        page = self.paginate_queryset(managed_teams)
        if page is not None:
            serializer = TeamSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = TeamSerializer(managed_teams, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'post'])
    def members(self, request, pk=None):
        """Get or add team members"""
        team = self.get_object()
        
        if request.method == 'GET':
            members = team.members.all()
            serializer = TeamMemberSerializer(members, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = TeamMemberCreateSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(team=team)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get', 'post'])
    def entries(self, request, pk=None):
        """Get or create team event entries"""
        team = self.get_object()
        
        if request.method == 'GET':
            entries = team.event_entries.all()
            serializer = TeamEventEntrySerializer(entries, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = TeamEventEntryCreateSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(team=team)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TeamMemberViewSet(viewsets.ModelViewSet):
    """ViewSet for managing team members"""
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['team', 'user', 'role', 'status']
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'position']
    ordering_fields = ['joined_date', 'jersey_number', 'role']
    ordering = ['team', 'role', 'jersey_number']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return TeamMemberCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TeamMemberUpdateSerializer
        return TeamMemberSerializer
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        queryset = super().get_queryset()
        
        # If user is not staff, only show members of teams they're part of
        if not self.request.user.is_staff:
            user_teams = Team.objects.filter(
                members__user=self.request.user,
                members__status=TeamMember.Status.ACTIVE
            )
            queryset = queryset.filter(team__in=user_teams)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def leave_team(self, request, pk=None):
        """Allow a team member to leave the team"""
        member = self.get_object()
        
        # Check if user is leaving their own membership
        if member.user != request.user:
            return Response(
                {"detail": "You can only leave your own team membership"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        member.leave_team()
        return Response({"detail": "Successfully left the team"})
    
    @action(detail=True, methods=['post'])
    def update_role(self, request, pk=None):
        """Update team member role (requires team management permissions)"""
        member = self.get_object()
        
        # Check if user has permission to manage this team
        if not self.request.user.is_staff and not TeamMember.objects.filter(
            team=member.team,
            user=self.request.user,
            can_manage_team=True,
            status=TeamMember.Status.ACTIVE
        ).exists():
            return Response(
                {"detail": "You don't have permission to manage this team"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TeamMemberUpdateSerializer(member, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AthleteProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for managing athlete profiles"""
    queryset = AthleteProfile.objects.all()
    serializer_class = AthleteProfileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['primary_sport', 'skill_level', 'years_experience']
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'primary_sport']
    ordering_fields = ['skill_level', 'years_experience', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        queryset = super().get_queryset()
        
        # If user is not staff, only show their own profile or public profiles
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(user=self.request.user) | Q(user__is_active=True)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        """Set the user when creating an athlete profile"""
        serializer.save(user_id=self.request.data.get('user_id'))
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get the current user's athlete profile"""
        try:
            profile = AthleteProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except AthleteProfile.DoesNotExist:
            return Response(
                {"detail": "Athlete profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def by_sport(self, request):
        """Get athletes by sport"""
        sport = request.query_params.get('sport')
        if not sport:
            return Response(
                {"detail": "Sport parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        athletes = self.get_queryset().filter(primary_sport__iexact=sport)
        page = self.paginate_queryset(athletes)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(athletes, many=True)
        return Response(serializer.data)


class TeamInvitationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing team invitations"""
    queryset = TeamInvitation.objects.all()
    serializer_class = TeamInvitationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['team', 'invited_user', 'invited_by', 'status', 'role']
    search_fields = ['team__name', 'invited_user__first_name', 'invited_user__last_name']
    ordering_fields = ['created_at', 'expires_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return TeamInvitationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TeamInvitationResponseSerializer
        return TeamInvitationSerializer
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        queryset = super().get_queryset()
        
        # If user is not staff, only show invitations they sent or received
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(invited_user=self.request.user) | Q(invited_by=self.request.user)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        """Set the inviter when creating an invitation"""
        serializer.save(invited_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """Respond to a team invitation (accept/decline)"""
        invitation = self.get_object()
        
        # Check if user is the invited user
        if invitation.invited_user != request.user:
            return Response(
                {"detail": "You can only respond to invitations sent to you"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TeamInvitationResponseSerializer(invitation, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def my_invitations(self, request):
        """Get invitations sent to the current user"""
        invitations = self.get_queryset().filter(
            invited_user=request.user,
            status=TeamInvitation.Status.PENDING
        )
        
        page = self.paginate_queryset(invitations)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(invitations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def sent_invitations(self, request):
        """Get invitations sent by the current user"""
        invitations = self.get_queryset().filter(invited_by=request.user)
        
        page = self.paginate_queryset(invitations)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(invitations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a pending invitation"""
        invitation = self.get_object()
        
        # Check if user can cancel this invitation
        if invitation.invited_by != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You can only cancel invitations you sent"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if invitation.status != TeamInvitation.Status.PENDING:
            return Response(
                {"detail": "Can only cancel pending invitations"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        invitation.status = TeamInvitation.Status.EXPIRED
        invitation.save()
        return Response({"detail": "Invitation cancelled successfully"})


class TeamEventEntryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing team event entries"""
    queryset = TeamEventEntry.objects.all()
    serializer_class = TeamEventEntrySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['team', 'event', 'division', 'status']
    search_fields = ['team__name', 'event__name', 'division__name']
    ordering_fields = ['created_at', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        queryset = super().get_queryset()
        
        # If user is not staff, only show entries for teams they can manage
        if not self.request.user.is_staff:
            user_teams = Team.objects.filter(
                Q(manager=self.request.user) |
                Q(members__user=self.request.user, members__can_manage_team=True)
            ).distinct()
            queryset = queryset.filter(team__in=user_teams)
        
        return queryset
    
    @action(detail=True, methods=['patch'])
    def withdraw(self, request, pk=None):
        """Withdraw a team entry"""
        entry = self.get_object()
        
        serializer = TeamEventEntryActionSerializer(data=request.data, context={'action': 'withdraw'})
        if serializer.is_valid():
            note = serializer.validated_data.get('note', '')
            if entry.withdraw(note):
                return Response({"detail": "Entry withdrawn successfully"})
            else:
                return Response(
                    {"detail": "Cannot withdraw entry in current status"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'], permission_classes=[CanApproveTeamEntries])
    def approve(self, request, pk=None):
        """Approve a team entry (organizer/admin only)"""
        entry = self.get_object()
        
        serializer = TeamEventEntryActionSerializer(data=request.data, context={'action': 'approve'})
        if serializer.is_valid():
            note = serializer.validated_data.get('note', '')
            if entry.approve(request.user, note):
                return Response({"detail": "Entry approved successfully"})
            else:
                return Response(
                    {"detail": "Cannot approve entry in current status"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'], permission_classes=[CanApproveTeamEntries])
    def reject(self, request, pk=None):
        """Reject a team entry (organizer/admin only)"""
        entry = self.get_object()
        
        serializer = TeamEventEntryActionSerializer(data=request.data, context={'action': 'reject'})
        if serializer.is_valid():
            note = serializer.validated_data.get('note', '')
            if entry.reject(request.user, note):
                return Response({"detail": "Entry rejected successfully"})
            else:
                return Response(
                    {"detail": "Cannot reject entry in current status"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EligibilityCheckViewSet(viewsets.ViewSet):
    """ViewSet for checking team eligibility"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def check(self, request):
        """Check team eligibility for event/division"""
        serializer = EligibilityCheckSerializer(data=request.data)
        if serializer.is_valid():
            team_id = serializer.validated_data['team_id']
            event_id = serializer.validated_data['event_id']
            division_id = serializer.validated_data.get('division_id')
            
            result = EligibilityChecker.check_team_eligibility(team_id, event_id, division_id)
            
            # Add team summary for context
            team_summary = EligibilityChecker.get_team_roster_summary(team_id)
            result['team_summary'] = team_summary
            
            return Response(result)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
