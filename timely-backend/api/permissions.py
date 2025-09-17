# api/permissions.py - RBAC Permission Classes
from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model

User = get_user_model()


class IsAdmin(BasePermission):
    """Admin users only"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.ADMIN


class IsOrganizer(BasePermission):
    """Organizer users only"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [User.Role.ADMIN, User.Role.ORGANIZER]


class IsCoach(BasePermission):
    """Coach users only"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [User.Role.ADMIN, User.Role.ORGANIZER, User.Role.COACH]


class IsAthlete(BasePermission):
    """Athlete users only"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [User.Role.ADMIN, User.Role.ORGANIZER, User.Role.COACH, User.Role.ATHLETE]


class IsSpectator(BasePermission):
    """Spectator users only"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [User.Role.ADMIN, User.Role.ORGANIZER, User.Role.COACH, User.Role.ATHLETE, User.Role.SPECTATOR]


class IsEventOrganizer(BasePermission):
    """Event organizer only"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin can access all events
        if request.user.role == User.Role.ADMIN:
            return True
        
        # Check if user is organizer of the event
        event_id = view.kwargs.get('pk') or view.kwargs.get('event_id')
        if event_id:
            try:
                from events.models import Event
                event = Event.objects.get(id=event_id)
                return event.created_by == request.user
            except Event.DoesNotExist:
                return False
        
        return request.user.role == User.Role.ORGANIZER


class IsEventParticipant(BasePermission):
    """Event participant only"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin and organizers can access all events
        if request.user.role in [User.Role.ADMIN, User.Role.ORGANIZER]:
            return True
        
        # Check if user is participant of the event
        event_id = view.kwargs.get('pk') or view.kwargs.get('event_id')
        if event_id:
            try:
                from events.models import Event
                from registrations.models import Registration
                event = Event.objects.get(id=event_id)
                return Registration.objects.filter(
                    event=event, 
                    applicant=request.user, 
                    status=Registration.Status.APPROVED
                ).exists()
            except Event.DoesNotExist:
                return False
        
        return False


class IsOwnerOrReadOnly(BasePermission):
    """Object owner can edit, others can read"""
    def has_object_permission(self, request, view, obj):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return obj.user == request.user


class IsEventOwnerOrReadOnly(BasePermission):
    """Event owner can edit, others can read"""
    def has_object_permission(self, request, view, obj):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return obj.created_by == request.user or request.user.role == User.Role.ADMIN
