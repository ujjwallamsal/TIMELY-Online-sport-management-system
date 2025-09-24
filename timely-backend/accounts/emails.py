"""Email notification helpers for accounts app.

Simple, plain-text email notifications for user actions.
Tolerates missing email addresses gracefully.
"""
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


def send_organizer_application_status(user, status, reason=None):
    """Send email notification about organizer application status.
    
    Args:
        user: User instance
        status: Application status ('APPROVED' or 'REJECTED')
        reason: Optional reason for rejection
    """
    if not user.email:
        logger.warning(f"Cannot send email to user {user.id} - no email address")
        return False
    
    try:
        subject = f"Organizer Application {status.title()}"
        
        if status == 'APPROVED':
            message = f"""Hello {user.first_name or 'there'},

Your organizer application has been approved! You can now create and manage events.

You can log in at: {settings.FRONTEND_ORIGIN}

Best regards,
Timely Sports Management Team
"""
        else:  # REJECTED
            reason_text = f"\n\nReason: {reason}" if reason else ""
            message = f"""Hello {user.first_name or 'there'},

Your organizer application has been rejected.{reason_text}

You can apply again in the future if your circumstances change.

Best regards,
Timely Sports Management Team
"""
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,  # Don't raise exceptions for email failures
        )
        
        logger.info(f"Sent organizer application {status} email to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send organizer application email to {user.email}: {e}")
        return False


def send_registration_status(user, event, status):
    """Send email notification about event registration status.
    
    Args:
        user: User instance
        event: Event instance
        status: Registration status ('APPROVED' or 'REJECTED')
    """
    if not user.email:
        logger.warning(f"Cannot send email to user {user.id} - no email address")
        return False
    
    try:
        subject = f"Event Registration {status.title()}"
        
        if status == 'APPROVED':
            message = f"""Hello {user.first_name or 'there'},

Your registration for "{event.name}" has been approved!

Event Details:
- Date: {event.start_datetime.strftime('%B %d, %Y at %I:%M %p')}
- Location: {event.location or event.venue.name if event.venue else 'TBA'}

You can view your registration at: {settings.FRONTEND_ORIGIN}/events/{event.id}

Best regards,
Timely Sports Management Team
"""
        else:  # REJECTED
            message = f"""Hello {user.first_name or 'there'},

Your registration for "{event.name}" has been rejected.

Event Details:
- Date: {event.start_datetime.strftime('%B %d, %Y at %I:%M %p')}
- Location: {event.location or event.venue.name if event.venue else 'TBA'}

You can view other available events at: {settings.FRONTEND_ORIGIN}/events

Best regards,
Timely Sports Management Team
"""
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,  # Don't raise exceptions for email failures
        )
        
        logger.info(f"Sent registration {status} email to {user.email} for event {event.id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send registration email to {user.email}: {e}")
        return False


def send_ticket_request_confirmation(user, event):
    """Send email confirmation for ticket request.
    
    Args:
        user: User instance
        event: Event instance
    """
    if not user.email:
        logger.warning(f"Cannot send email to user {user.id} - no email address")
        return False
    
    try:
        subject = "Ticket Request Submitted"
        
        message = f"""Hello {user.first_name or 'there'},

Your ticket request for "{event.name}" has been submitted and is awaiting approval.

Event Details:
- Date: {event.start_datetime.strftime('%B %d, %Y at %I:%M %p')}
- Location: {event.location or event.venue.name if event.venue else 'TBA'}

You will be notified once your request is reviewed.

You can view your requests at: {settings.FRONTEND_ORIGIN}/events/{event.id}

Best regards,
Timely Sports Management Team
"""
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
        
        logger.info(f"Sent ticket request confirmation to {user.email} for event {event.id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send ticket request confirmation to {user.email}: {e}")
        return False
