from django.db import models
from django.conf import settings
from venues.models import Venue

class Event(models.Model):
    class Status(models.TextChoices):
        UPCOMING = "UPCOMING", "Upcoming"
        ONGOING = "ONGOING", "Ongoing"
        COMPLETED = "COMPLETED", "Completed"

    name = models.CharField(max_length=140)
    sport_type = models.CharField(max_length=80)
    start_date = models.DateField()
    end_date = models.DateField()
    venue = models.ForeignKey(Venue, on_delete=models.PROTECT, related_name="events")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.UPCOMING)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    eligibility_notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.sport_type})"
