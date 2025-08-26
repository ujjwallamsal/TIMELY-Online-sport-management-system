"""Cookie-based JWT helpers and authentication.

Small, typed utilities to issue and read JWT from HttpOnly cookies.
"""
from __future__ import annotations

from typing import Optional, Tuple

from django.conf import settings
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


ACCESS_COOKIE_NAME: str = getattr(settings, "SIMPLE_JWT", {}).get("AUTH_COOKIE", "access")
REFRESH_COOKIE_NAME: str = getattr(settings, "SIMPLE_JWT", {}).get("AUTH_COOKIE_REFRESH", "refresh")
COOKIE_SAMESITE: str = getattr(settings, "SIMPLE_JWT", {}).get("AUTH_COOKIE_SAMESITE", "Lax")
COOKIE_SECURE: bool = bool(getattr(settings, "SIMPLE_JWT", {}).get("AUTH_COOKIE_SECURE", False))
COOKIE_PATH: str = getattr(settings, "SIMPLE_JWT", {}).get("AUTH_COOKIE_PATH", "/")


def set_jwt_cookies(response: Response, access_token: str, refresh_token: Optional[str] = None) -> None:
    """Set HttpOnly cookies for access (and optional refresh)."""
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
    """Clear JWT cookies on logout."""
    response.delete_cookie(ACCESS_COOKIE_NAME, path=COOKIE_PATH)
    response.delete_cookie(REFRESH_COOKIE_NAME, path=COOKIE_PATH)


class CookieJWTAuthentication(JWTAuthentication):
    """Read JWT from HttpOnly cookies if Authorization header is missing."""

    def authenticate(self, request) -> Optional[Tuple[object, object]]:
        header = self.get_header(request)
        if header is not None:
            return super().authenticate(request)

        raw_token = request.COOKIES.get(ACCESS_COOKIE_NAME)
        if not raw_token:
            return None

        try:
            validated = super().get_validated_token(raw_token)
        except TokenError as exc:  # noqa: PERF203 - readability
            raise InvalidToken(exc.args[0])

        return self.get_user(validated), validated


