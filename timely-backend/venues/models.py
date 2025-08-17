# venues/models.py
from __future__ import annotations
from django.db import models

class Venue(models.Model):
    name = models.CharField(max_length=200, unique=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    capacity = models.PositiveIntegerField(default=0)
    indoor = models.BooleanField(default=False)

    # Comma-separated facilities (simple + fast to ship; can normalize later)
    facilities = models.TextField(
        blank=True,
        help_text="Comma-separated list, e.g. 'parking,locker rooms,first aid'"
    )

    # Optional geolocation (future-use in React map)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    def facilities_list(self) -> list[str]:
        return [f.strip() for f in self.facilities.split(",") if f.strip()]
