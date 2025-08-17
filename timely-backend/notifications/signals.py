# notifications/signals.py
from __future__ import annotations
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from fixtures.models import Match
from registrations.models import Registration
from .models import Notification

def _notify(user, title, body):
    Notification.objects.create(
        user=user, title=title, message=body, sent_at=timezone.now()
    )

@receiver(pre_save, sender=Match)
def match_reschedule_notify(sender, instance: Match, **kwargs):
    if not instance.pk:
        return
    try:
        old = Match.objects.get(pk=instance.pk)
    except Match.DoesNotExist:
        return
    if old.start_time != instance.start_time:
        # notify all ticket holders + perhaps registered participants
        for t in instance.ticket_set.select_related("purchaser").all():
            _notify(
                t.purchaser,
                "Match Rescheduled",
                f"Your match #{instance.id} now starts at {instance.start_time}."
            )

@receiver(post_save, sender=Registration)
def registration_paid_notify(sender, instance: Registration, created, **kwargs):
    if created:
        return
    if instance.is_paid:
        _notify(
            instance.user,
            "Registration Confirmed",
            f"Your registration for event #{instance.event_id} is confirmed."
        )
