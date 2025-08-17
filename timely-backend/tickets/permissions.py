# tickets/permissions.py
from rest_framework.permissions import BasePermission

class IsOrganizerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role in ("ORGANIZER", "ADMIN"))
