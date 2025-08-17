from rest_framework import viewsets, permissions
from .models import Team, AthleteProfile
from .serializers import TeamSerializer, AthleteProfileSerializer

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all().order_by("name")
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class AthleteProfileViewSet(viewsets.ModelViewSet):
    queryset = AthleteProfile.objects.select_related("user","team").all()
    serializer_class = AthleteProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
