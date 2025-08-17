from django.db import models
from django.conf import settings

class Team(models.Model):
    name = models.CharField(max_length=120)
    coach = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="coached_teams")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class AthleteProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="athlete_profile")
    date_of_birth = models.DateField(null=True, blank=True)
    bio = models.TextField(blank=True)
    sport = models.CharField(max_length=80, blank=True)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name="athletes")

    def __str__(self):
        return self.user.email
