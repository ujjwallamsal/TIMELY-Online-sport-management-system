from django.db import models
from django.conf import settings
from events.models import Event


class Registration(models.Model):
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)  # temp nullable
    is_paid = models.BooleanField(default=False)
    # keep any other fields you still need
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "event")

    def __str__(self):
        if self.user:
            return f"{self.user.email} - {self.event.name}"
        return f"Unassigned - {self.event.name}"
