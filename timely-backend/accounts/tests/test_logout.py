from __future__ import annotations

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


pytestmark = pytest.mark.django_db


def make_user(email: str = "testuser@example.com", password: str = "Passw0rd1"):
    User = get_user_model()
    if not User.objects.filter(email=email).exists():
        return User.objects.create_user(email=email, password=password, first_name="Test", last_name="User")
    return User.objects.get(email=email)


def login(client: APIClient, email: str, password: str):
    resp = client.post("/api/accounts/auth/login/", {"email": email, "password": password}, format="json")
    assert resp.status_code == 200, resp.content
    # APIClient stores cookies automatically
    return resp


def test_logout_clears_cookies_and_blocks_me_and_refresh():
    user = make_user()
    client = APIClient()

    # Login issues cookies
    login(client, user.email, "Passw0rd1")

    # Me works pre-logout
    r = client.get("/api/accounts/users/me/")
    assert r.status_code == 200

    # Logout clears both cookies
    r = client.post("/api/accounts/auth/logout/")
    assert r.status_code == 200

    # Me now fails (no access cookie)
    r = client.get("/api/accounts/users/me/")
    assert r.status_code in (401, 403)

    # Refresh also fails (no refresh cookie)
    r = client.post("/api/accounts/refresh/")
    assert r.status_code in (401, 403)


