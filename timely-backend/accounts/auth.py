"""Cookie-based JWT helpers and authentication.

Small, typed utilities to issue and read JWT from HttpOnly cookies.
"""
from __future__ import annotations

from typing import Optional, Tuple

from django.conf import settings
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


# Cookie configuration from settings
ACCESS_COOKIE_NAME: str = getattr(settings, "SIMPLE_JWT", {}).get("AUTH_COOKIE", "access")
REFRESH_COOKIE_NAME: str = getattr(settings, "SIMPLE_JWT", {}).get("AUTH_COOKIE_REFRESH", "refresh")
COOKIE_SAMESITE: str = getattr(settings, "SIMPLE_JWT", {}).get("AUTH_COOKIE_SAMESITE", "Lax")
COOKIE_SECURE: bool = bool(getattr(settings, "SIMPLE_JWT", {}).get("AUTH_COOKIE_SECURE", False))
COOKIE_PATH: str = getattr(settings, "SIMPLE_JWT", {}).get("AUTH_COOKIE_PATH", "/")


def set_jwt_cookies(response: Response, access_token: str, refresh_token: Optional[str] = None) -> None:
    """Set HttpOnly cookies for access (and optional refresh).
    
    Args:
        response: Django Response object
        access_token: JWT access token
        refresh_token: Optional JWT refresh token
    """
    response.set_cookie(
        ACCESS_COOKIE_NAME,
        access_token,
        httponly=True,
        samesite=COOKIE_SAMESITE,
        secure=COOKIE_SECURE,
        path=COOKIE_PATH,
    )
    if refresh_token is not None:
        response.set_cookie(
            REFRESH_COOKIE_NAME,
            refresh_token,
            httponly=True,
            samesite=COOKIE_SAMESITE,
            secure=COOKIE_SECURE,
            path=COOKIE_PATH,
        )


def clear_jwt_cookies(response: Response) -> None:
    """Clear JWT cookies on logout.
    
    Args:
        response: Django Response object
    """
    response.delete_cookie(ACCESS_COOKIE_NAME, path=COOKIE_PATH)
    response.delete_cookie(REFRESH_COOKIE_NAME, path=COOKIE_PATH)


class CookieJWTAuthentication(JWTAuthentication):
    """Read JWT from HttpOnly cookies if Authorization header is missing."""

    def authenticate(self, request) -> Optional[Tuple[object, object]]:
        """
        Authenticate using JWT from cookies or Authorization header.
        
        Args:
            request: Django request object
            
        Returns:
            Tuple of (user, token) if authentication successful, None otherwise
        """
        # Try Authorization header first
        header = self.get_header(request)
        if header is not None:
            return super().authenticate(request)

        # Fall back to cookie authentication
        raw_token = request.COOKIES.get(ACCESS_COOKIE_NAME)
        if not raw_token:
            return None

        try:
            validated = super().get_validated_token(raw_token)
        except TokenError as exc:
            raise InvalidToken(exc.args[0])

        return self.get_user(validated), validated