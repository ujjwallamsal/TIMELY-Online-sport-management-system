# payments/models.py
from __future__ import annotations
from django.db import models
from django.conf import settings

STATUS = (
    ("PENDING", "Pending"),
    ("SUCCEEDED", "Succeeded"),
    ("FAILED", "Failed"),
)

class Payment(models.Model):
    # Relations (either/any can be used)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="payments"
    )
    registration = models.ForeignKey(
        "registrations.Registration", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="payments"
    )
    ticket = models.ForeignKey(
        "tickets.Ticket", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="payments"
    )

    amount_cents = models.PositiveIntegerField()
    currency = models.CharField(max_length=8, default="AUD")

    provider = models.CharField(max_length=32, default="DEV")
    provider_ref = models.CharField(max_length=128, blank=True)

    status = models.CharField(max_length=16, choices=STATUS, default="PENDING")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self) -> str:
        who = self.user.email if self.user else "anon"
        return f"Payment {self.pk} {self.status} {self.amount_cents}{self.currency} by {who}"
