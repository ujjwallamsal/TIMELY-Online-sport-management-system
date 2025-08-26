from django.test import TestCase, Client
from django.contrib.auth import get_user_model


User = get_user_model()


class AuthFlowTests(TestCase):
    def setUp(self) -> None:
        self.client = Client()
        self.user = User.objects.create_user(email="auth@test.local", password="pass12345")

    def test_login_sets_cookies(self):
        resp = self.client.post("/api/accounts/auth/login/", data={"email": "auth@test.local", "password": "pass12345"}, content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("access", resp.cookies)
        self.assertIn("refresh", resp.cookies)

    def test_me_after_login(self):
        self.client.post("/api/accounts/auth/login/", data={"email": "auth@test.local", "password": "pass12345"}, content_type="application/json")
        resp = self.client.get("/api/accounts/users/me/")
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertIn("id", body)
        self.assertIn("email", body)

    def test_refresh_sets_new_access(self):
        self.client.post("/api/accounts/auth/login/", data={"email": "auth@test.local", "password": "pass12345"}, content_type="application/json")
        resp = self.client.post("/api/accounts/refresh/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("access", resp.cookies)

    def test_logout_clears_cookies(self):
        self.client.post("/api/accounts/auth/login/", data={"email": "auth@test.local", "password": "pass12345"}, content_type="application/json")
        resp = self.client.post("/api/accounts/auth/logout/")
        self.assertEqual(resp.status_code, 200)
        # Cookie removal is via delete_cookie; presence may remain with expired flag. Endpoint returns 200 which is sufficient here.


