# tickets/models.py
from __future__ import annotations

import uuid
from django.db import models
from django.conf import settings
from fixtures.models import Match


def generate_qr_code() -> str:
    """
    Stable helper referenced by early migrations.
    Returns a 32-char lowercase hex string.
    """
    return uuid.uuid4().hex


class Ticket(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        REFUNDED = "REFUNDED", "Refunded"
        CANCELED = "CANCELED", "Canceled"

    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name="tickets",
        null=True, blank=True,                     # keep optional during dev; enforce later if you like
        help_text="Match this ticket grants entry to."
    )
    purchaser = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tickets",
        help_text="User who purchased the ticket."
    )
    quantity = models.PositiveIntegerField(default=1)
    # NOTE: price_cents is treated as the TOTAL for this ticket row (not per-unit) for simplicity.
    price_cents = models.PositiveIntegerField(default=0, help_text="Total price in cents.")
    qr_code = models.CharField(
        max_length=64,
        default=generate_qr_code,                  # DO NOT inline uuid here; migrations import this by path
        unique=True,
        db_index=True,
        help_text="Unique QR token for validation."
    )
    purchased_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        ordering = ["-purchased_at"]
        indexes = [
            models.Index(fields=["purchaser", "purchased_at"]),
            models.Index(fields=["status"]),
            models.Index(fields=["match"]),
        ]

    def __str__(self) -> str:
        return f"Ticket#{self.pk} match={self.match_id} {self.purchaser} [{self.status}]"

    @property
    def total_price_cents(self) -> int:
        """
        Keep this aligned with your business rule.
        Currently equals price_cents (already total). If you later switch to unit pricing,
        change to: return (self.unit_price_cents * self.quantity).
        """
        return int(self.price_cents or 0)
