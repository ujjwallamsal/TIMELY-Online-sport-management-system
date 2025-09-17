# teams/permissions.py
from rest_framework import permissions
from django.db import models


class IsTeamManagerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow team managers to edit teams.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Write permissions are only allowed to team managers or admins
        return (
            obj.manager == request.user or 
            request.user.is_staff or
            request.user.is_superuser
        )


class IsTeamMemberOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow team members to edit team member records.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Write permissions are only allowed to:
        # - The team member themselves
        # - Team managers
        # - Team coaches
        # - Admins
        return (
            obj.athlete == request.user or
            obj.team.manager == request.user or
            obj.team.coach == request.user or
            request.user.is_staff or
            request.user.is_superuser
        )
