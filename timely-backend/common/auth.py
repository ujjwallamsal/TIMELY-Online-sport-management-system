# common/auth.py
from rest_framework import authentication, permissions
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

class NoAuthentication(authentication.BaseAuthentication):
    """
    Authentication class that always returns None (no authentication).
    Use this for public endpoints that should be accessible without any authentication.
    """
    def authenticate(self, request):
        return None

class PublicJWTAuthentication(JWTAuthentication):
    """
    JWT authentication that allows public endpoints to bypass authentication.
    """
    def authenticate(self, request):
        # Check if this is a public endpoint using the middleware flag
        if hasattr(request, 'is_public_endpoint') and request.is_public_endpoint:
            return None
        
        # For protected endpoints, use normal JWT authentication
        try:
            return super().authenticate(request)
        except (InvalidToken, TokenError):
            # If JWT is invalid, return None to let permission classes handle it
            return None

class PublicPermission(permissions.BasePermission):
    """
    Permission class that always allows access.
    """
    def has_permission(self, request, view):
        return True

class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    """
    The request is authenticated as a user, or is a read-only request.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated
