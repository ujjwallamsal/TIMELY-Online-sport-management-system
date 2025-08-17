from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .tokens import make_email_token, read_email_token

User = get_user_model()

class RequestEmailVerification(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        token = make_email_token(request.user.id)
        # TODO: send email; for dev return the token
        return Response({"token": token})

class VerifyEmail(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        token = request.data.get("token", "")
        try:
            uid = read_email_token(token)
        except Exception:
            return Response({"detail":"Invalid or expired token"}, status=400)
        User.objects.filter(id=uid).update(email_verified=True)
        return Response({"ok": True})
