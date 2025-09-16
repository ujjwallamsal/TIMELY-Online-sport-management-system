# scheduler/tasks.py
from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth import get_user_model

from fixtures.models import Fixture
from events.models import Event
from notifications.models import Notification
from notifications.services.email import send_email_notification
from notifications.services.sms import send_sms_notification

User = get_user_model()


def send_fixture_reminders():
    """
    Send T-24h and T-2h reminders for upcoming fixtures
    """
    now = timezone.now()
    
    # T-24h window (23-25 hours from now)
    t24h_start = now + timedelta(hours=23)
    t24h_end = now + timedelta(hours=25)
    
    # T-2h window (1.5-2.5 hours from now)
    t2h_start = now + timedelta(hours=1.5)
    t2h_end = now + timedelta(hours=2.5)
    
    # Get fixtures in T-24h window
    fixtures_24h = Fixture.objects.filter(
        starts_at__range=[t24h_start, t24h_end],
        status=Fixture.Status.SCHEDULED
    ).select_related('event', 'home_team', 'away_team', 'venue')
    
    # Get fixtures in T-2h window
    fixtures_2h = Fixture.objects.filter(
        starts_at__range=[t2h_start, t2h_end],
        status=Fixture.Status.SCHEDULED
    ).select_related('event', 'home_team', 'away_team', 'venue')
    
    # Send T-24h reminders
    for fixture in fixtures_24h:
        send_fixture_reminder(fixture, '24h')
    
    # Send T-2h reminders
    for fixture in fixtures_2h:
        send_fixture_reminder(fixture, '2h')
    
    return {
        't24h_count': fixtures_24h.count(),
        't2h_count': fixtures_2h.count(),
        'total_reminders': fixtures_24h.count() + fixtures_2h.count()
    }


def send_fixture_reminder(fixture, reminder_type):
    """
    Send reminder for a specific fixture
    """
    # Get all users who should receive this reminder
    users = get_fixture_reminder_recipients(fixture)
    
    for user in users:
        # Create notification
        notification = create_fixture_notification(fixture, user, reminder_type)
        
        # Send email (stub implementation)
        send_fixture_email_reminder(fixture, user, reminder_type)
        
        # Send SMS (stub implementation)
        send_fixture_sms_reminder(fixture, user, reminder_type)


def get_fixture_reminder_recipients(fixture):
    """
    Get users who should receive reminders for this fixture
    """
    users = set()
    
    # Event organizers and admins
    users.add(fixture.event.created_by)
    
    # Team members (if teams are assigned)
    if fixture.home_team:
        for member in fixture.home_team.members.all():
            users.add(member.user)
    
    if fixture.away_team:
        for member in fixture.away_team.members.all():
            users.add(member.user)
    
    # Users with tickets for this fixture
    from tickets.models import Ticket
    ticket_users = User.objects.filter(
        ticket_orders__tickets__order__fixture=fixture,
        ticket_orders__status='paid'
    ).distinct()
    users.update(ticket_users)
    
    # Users registered for the event
    from registrations.models import Registration
    registered_users = User.objects.filter(
        registrations__event=fixture.event,
        registrations__status='approved'
    ).distinct()
    users.update(registered_users)
    
    return list(users)


def create_fixture_notification(fixture, user, reminder_type):
    """
    Create in-app notification for fixture reminder
    """
    if reminder_type == '24h':
        title = f"Fixture Reminder: {fixture.event.name}"
        message = f"Your fixture {fixture.home_team.name} vs {fixture.away_team.name} starts in 24 hours at {fixture.starts_at.strftime('%H:%M')}."
    else:  # 2h
        title = f"Fixture Starting Soon: {fixture.event.name}"
        message = f"Your fixture {fixture.home_team.name} vs {fixture.away_team.name} starts in 2 hours at {fixture.starts_at.strftime('%H:%M')}."
    
    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type='fixture_reminder',
        data={
            'fixture_id': fixture.id,
            'event_id': fixture.event.id,
            'reminder_type': reminder_type,
            'starts_at': fixture.starts_at.isoformat(),
            'venue': fixture.venue.name if fixture.venue else None
        }
    )
    
    return notification


def send_fixture_email_reminder(fixture, user, reminder_type):
    """
    Send email reminder for fixture (stub implementation)
    """
    # This would integrate with your email service
    # For now, just log the action
    print(f"Email reminder {reminder_type} sent to {user.email} for fixture {fixture.id}")
    
    # In production, you would:
    # 1. Render email template
    # 2. Send via email service (SendGrid, AWS SES, etc.)
    # 3. Track delivery status
    
    # Example implementation:
    # try:
    #     send_email_notification(
    #         to_email=user.email,
    #         subject=f"Fixture Reminder: {fixture.event.name}",
    #         template='fixture_reminder',
    #         context={
    #             'user': user,
    #             'fixture': fixture,
    #             'reminder_type': reminder_type
    #         }
    #     )
    # except Exception as e:
    #     print(f"Failed to send email to {user.email}: {e}")


def send_fixture_sms_reminder(fixture, user, reminder_type):
    """
    Send SMS reminder for fixture (stub implementation)
    """
    # This would integrate with your SMS service
    # For now, just log the action
    if hasattr(user, 'phone_number') and user.phone_number:
        print(f"SMS reminder {reminder_type} sent to {user.phone_number} for fixture {fixture.id}")
    
    # In production, you would:
    # 1. Format SMS message
    # 2. Send via SMS service (Twilio, AWS SNS, etc.)
    # 3. Track delivery status
    
    # Example implementation:
    # try:
    #     send_sms_notification(
    #         to_phone=user.phone_number,
    #         message=f"Fixture reminder: {fixture.home_team.name} vs {fixture.away_team.name} starts in {reminder_type}",
    #         context={
    #             'fixture': fixture,
    #             'reminder_type': reminder_type
    #         }
    #     )
    # except Exception as e:
    #     print(f"Failed to send SMS to {user.phone_number}: {e}")


def send_event_reminders():
    """
    Send reminders for upcoming events (not fixtures)
    """
    now = timezone.now()
    
    # T-24h window for events
    t24h_start = now + timedelta(hours=23)
    t24h_end = now + timedelta(hours=25)
    
    # Get events starting in T-24h window
    events = Event.objects.filter(
        start_date__range=[t24h_start.date(), t24h_end.date()],
        status=Event.Status.PUBLISHED
    ).select_related('created_by')
    
    for event in events:
        send_event_reminder(event)


def send_event_reminder(event):
    """
    Send reminder for a specific event
    """
    # Get all users who should receive this reminder
    users = get_event_reminder_recipients(event)
    
    for user in users:
        # Create notification
        notification = create_event_notification(event, user)
        
        # Send email (stub implementation)
        send_event_email_reminder(event, user)
        
        # Send SMS (stub implementation)
        send_event_sms_reminder(event, user)


def get_event_reminder_recipients(event):
    """
    Get users who should receive reminders for this event
    """
    users = set()
    
    # Event organizers and admins
    users.add(event.created_by)
    
    # Users registered for the event
    from registrations.models import Registration
    registered_users = User.objects.filter(
        registrations__event=event,
        registrations__status='approved'
    ).distinct()
    users.update(registered_users)
    
    # Users with tickets for this event
    from tickets.models import Ticket
    ticket_users = User.objects.filter(
        ticket_orders__tickets__order__event=event,
        ticket_orders__status='paid'
    ).distinct()
    users.update(ticket_users)
    
    return list(users)


def create_event_notification(event, user):
    """
    Create in-app notification for event reminder
    """
    title = f"Event Reminder: {event.name}"
    message = f"Your event {event.name} starts tomorrow at {event.start_date.strftime('%Y-%m-%d')}."
    
    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type='event_reminder',
        data={
            'event_id': event.id,
            'start_date': event.start_date.isoformat(),
            'venue': event.venue.name if event.venue else None
        }
    )
    
    return notification


def send_event_email_reminder(event, user):
    """
    Send email reminder for event (stub implementation)
    """
    print(f"Event email reminder sent to {user.email} for event {event.id}")


def send_event_sms_reminder(event, user):
    """
    Send SMS reminder for event (stub implementation)
    """
    if hasattr(user, 'phone_number') and user.phone_number:
        print(f"Event SMS reminder sent to {user.phone_number} for event {event.id}")


def cleanup_old_notifications():
    """
    Clean up old notifications to prevent database bloat
    """
    # Delete notifications older than 30 days
    cutoff_date = timezone.now() - timedelta(days=30)
    
    deleted_count = Notification.objects.filter(
        created_at__lt=cutoff_date,
        notification_type__in=['fixture_reminder', 'event_reminder']
    ).delete()[0]
    
    return {'deleted_count': deleted_count}
