"""
Permissions for notifications and messaging system.
Implements RBAC as specified in SRS.
"""
from rest_framework import permissions
from django.contrib.auth import get_user_model
from events.models import Event
from teams.models import Team
from registrations.models import Registration

User = get_user_model()


class NotificationPermissions(permissions.BasePermission):
    """
    Notification permissions:
    - Users can read their own notifications
    - Admin/Organizer can create announcements to their event's participants
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Users can always read their own notifications
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Only authenticated users can create notifications
        return True
    
    def has_object_permission(self, request, view, obj):
        # Users can only access their own notifications
        return obj.user == request.user


class AnnouncementPermissions(permissions.BasePermission):
    """
    Announcement permissions:
    - Organizer can only target their own event/team participants
    - Admin can target any participants
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Only organizers and admins can create announcements
        return request.user.is_staff or self._is_organizer(request.user)
    
    def _is_organizer(self, user):
        """Check if user is an organizer for any event"""
        return Event.objects.filter(organizers=user).exists()


class MessageThreadPermissions(permissions.BasePermission):
    """
    Message thread permissions:
    - Only participants can view/send messages
    - Organizer/admin can add/remove participants for their event scope
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Users can create threads and view their own
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return True
    
    def has_object_permission(self, request, view, obj):
        # Check if user is a participant in the thread
        is_participant = obj.participants.filter(user=request.user).exists()
        
        if request.method in permissions.SAFE_METHODS:
            return is_participant
        
        # For write operations, check if user can manage participants
        if request.method in ['POST', 'DELETE'] and 'participants' in request.path:
            return self._can_manage_participants(request.user, obj)
        
        # For sending messages, user must be a participant
        return is_participant
    
    def _can_manage_participants(self, user, thread):
        """Check if user can add/remove participants from thread"""
        if user.is_staff:
            return True
        
        # Check if user is organizer for the scoped event/team
        if thread.scope == 'event' and thread.scope_id:
            try:
                event = Event.objects.get(id=thread.scope_id)
                return event.organizers.filter(id=user.id).exists()
            except Event.DoesNotExist:
                return False
        
        if thread.scope == 'team' and thread.scope_id:
            try:
                team = Team.objects.get(id=thread.scope_id)
                return team.organizers.filter(id=user.id).exists()
            except Team.DoesNotExist:
                return False
        
        return False


class MessagePermissions(permissions.BasePermission):
    """
    Message permissions:
    - Only participants can read messages
    - Users can edit/delete their own messages
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return True
    
    def has_object_permission(self, request, view, obj):
        # Check if user is participant in the thread
        is_participant = obj.thread.participants.filter(user=request.user).exists()
        
        if request.method in permissions.SAFE_METHODS:
            return is_participant
        
        # Users can only edit/delete their own messages
        return obj.sender == request.user


class RateLimitPermission(permissions.BasePermission):
    """
    Simple rate limiting for message sending.
    Max 10 messages per 30 seconds per user per thread.
    """
    
    def has_permission(self, request, view):
        if request.method != 'POST':
            return True
        
        # Only apply to message creation
        if 'messages' not in request.path:
            return True
        
        # Get thread_id from URL
        thread_id = self._get_thread_id_from_path(request.path)
        if not thread_id:
            return True
        
        # Check rate limit
        return self._check_rate_limit(request.user, thread_id)
    
    def _get_thread_id_from_path(self, path):
        """Extract thread_id from URL path"""
        parts = path.split('/')
        try:
            thread_index = parts.index('threads')
            if thread_index + 1 < len(parts):
                return parts[thread_index + 1]
        except ValueError:
            pass
        return None
    
    def _check_rate_limit(self, user, thread_id):
        """Check if user has exceeded rate limit for this thread"""
        from django.core.cache import cache
        from django.utils import timezone
        
        cache_key = f"rate_limit:message:{user.id}:{thread_id}"
        current_count = cache.get(cache_key, 0)
        
        if current_count >= 10:
            return False
        
        # Increment counter with 30 second expiry
        cache.set(cache_key, current_count + 1, 30)
        return True
