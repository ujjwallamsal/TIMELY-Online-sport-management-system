from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOrganizerOrAdminOrReadOnly(BasePermission):
    """
    - SAFE methods: allow anyone to read public items.
    - Write: require user with role ORGANIZER or ADMIN (or superuser).
    Assumes your User model has a 'role' field (e.g., ORGANIZER/ADMIN).
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        user = request.user
        if not user or not user.is_authenticated:
            return False

        if getattr(user, "is_superuser", False):
            return True

        role = getattr(user, "role", "").upper()
        return role in {"ORGANIZER", "ADMIN"}
