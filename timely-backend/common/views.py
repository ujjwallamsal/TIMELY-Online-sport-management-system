"""
Common views for Timely API
"""
from django.http import JsonResponse
from django.db import connection
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny


class HealthView(APIView):
    """
    Health check endpoint for monitoring
    Returns system status and database connectivity
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get system health status"""
        try:
            # Test database connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                db_status = "ok"
        except Exception:
            db_status = "error"
        
        return JsonResponse({
            "status": "ok",
            "time": timezone.now().isoformat(),
            "db": db_status
        })
