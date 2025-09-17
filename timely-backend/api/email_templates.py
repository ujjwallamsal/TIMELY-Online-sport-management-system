# api/email_templates.py - Reusable Email Templates
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils.html import strip_tags
from celery import shared_task
from typing import Dict, Any, List, Optional


class EmailTemplate:
    """Base class for email templates"""
    
    def __init__(self, template_name: str, subject: str):
        self.template_name = template_name
        self.subject = subject
    
    def render(self, context: Dict[str, Any]) -> tuple[str, str]:
        """Render email template and return (html_content, text_content)"""
        html_content = render_to_string(f'emails/{self.template_name}.html', context)
        text_content = strip_tags(html_content)
        return html_content, text_content
    
    def send(self, to_emails: List[str], context: Dict[str, Any], 
             from_email: Optional[str] = None) -> bool:
        """Send email using this template"""
        return send_email_async.delay(
            to_emails=to_emails,
            subject=self.subject,
            template_name=self.template_name,
            context=context,
            from_email=from_email
        )


# Email Templates
class ConfirmationEmail(EmailTemplate):
    """Event registration confirmation email"""
    
    def __init__(self):
        super().__init__(
            template_name='confirmation',
            subject='Event Registration Confirmed - {event_title}'
        )


class AnnouncementEmail(EmailTemplate):
    """Event announcement email"""
    
    def __init__(self):
        super().__init__(
            template_name='announcement',
            subject='Important Update: {event_title}'
        )


class ReceiptEmail(EmailTemplate):
    """Payment receipt email"""
    
    def __init__(self):
        super().__init__(
            template_name='receipt',
            subject='Payment Receipt - {event_title}'
        )


class WelcomeEmail(EmailTemplate):
    """Welcome email for new users"""
    
    def __init__(self):
        super().__init__(
            template_name='welcome',
            subject='Welcome to Timely!'
        )


class PasswordResetEmail(EmailTemplate):
    """Password reset email"""
    
    def __init__(self):
        super().__init__(
            template_name='password_reset',
            subject='Password Reset Request'
        )


class EventReminderEmail(EmailTemplate):
    """Event reminder email"""
    
    def __init__(self):
        super().__init__(
            template_name='event_reminder',
            subject='Event Reminder: {event_title}'
        )


class EventCancelledEmail(EmailTemplate):
    """Event cancellation email"""
    
    def __init__(self):
        super().__init__(
            template_name='event_cancelled',
            subject='Event Cancelled: {event_title}'
        )


class RegistrationApprovedEmail(EmailTemplate):
    """Registration approval email"""
    
    def __init__(self):
        super().__init__(
            template_name='registration_approved',
            subject='Registration Approved - {event_title}'
        )


class RegistrationRejectedEmail(EmailTemplate):
    """Registration rejection email"""
    
    def __init__(self):
        super().__init__(
            template_name='registration_rejected',
            subject='Registration Update - {event_title}'
        )


# Email sending functions
@shared_task(bind=True, max_retries=3)
def send_email_async(self, to_emails: List[str], subject: str, 
                    template_name: str, context: Dict[str, Any], 
                    from_email: Optional[str] = None) -> bool:
    """Send email asynchronously using Celery"""
    try:
        from_email = from_email or settings.DEFAULT_FROM_EMAIL
        
        # Render template
        html_content = render_to_string(f'emails/{template_name}.html', context)
        text_content = strip_tags(html_content)
        
        # Create email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_emails
        )
        email.attach_alternative(html_content, "text/html")
        
        # Send email
        email.send()
        
        return True
        
    except Exception as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


def send_bulk_email(to_emails: List[str], template: EmailTemplate, 
                   context: Dict[str, Any], batch_size: int = 50) -> List[str]:
    """Send bulk emails in batches"""
    failed_emails = []
    
    for i in range(0, len(to_emails), batch_size):
        batch = to_emails[i:i + batch_size]
        try:
            template.send(batch, context)
        except Exception as e:
            failed_emails.extend(batch)
            print(f"Failed to send email batch: {e}")
    
    return failed_emails


def send_event_announcement(event_id: int, announcement_data: Dict[str, Any]) -> bool:
    """Send announcement to all event participants"""
    try:
        from events.models import Event
        from registrations.models import Registration
        
        event = Event.objects.get(id=event_id)
        participants = Registration.objects.filter(
            event=event, 
            status='approved'
        ).select_related('user')
        
        to_emails = [reg.user.email for reg in participants]
        
        context = {
            'event': event,
            'announcement': announcement_data,
            'site_url': settings.FRONTEND_URL,
        }
        
        template = AnnouncementEmail()
        template.send(to_emails, context)
        
        return True
        
    except Exception as e:
        print(f"Failed to send event announcement: {e}")
        return False


def send_registration_confirmation(registration_id: int) -> bool:
    """Send registration confirmation email"""
    try:
        from registrations.models import Registration
        
        registration = Registration.objects.select_related(
            'user', 'event'
        ).get(id=registration_id)
        
        context = {
            'user': registration.user,
            'event': registration.event,
            'registration': registration,
            'site_url': settings.FRONTEND_URL,
        }
        
        template = ConfirmationEmail()
        template.send([registration.user.email], context)
        
        return True
        
    except Exception as e:
        print(f"Failed to send registration confirmation: {e}")
        return False


def send_payment_receipt(registration_id: int, payment_data: Dict[str, Any]) -> bool:
    """Send payment receipt email"""
    try:
        from registrations.models import Registration
        
        registration = Registration.objects.select_related(
            'user', 'event'
        ).get(id=registration_id)
        
        context = {
            'user': registration.user,
            'event': registration.event,
            'registration': registration,
            'payment': payment_data,
            'site_url': settings.FRONTEND_URL,
        }
        
        template = ReceiptEmail()
        template.send([registration.user.email], context)
        
        return True
        
    except Exception as e:
        print(f"Failed to send payment receipt: {e}")
        return False


def send_event_reminder(event_id: int, reminder_type: str = '24h') -> bool:
    """Send event reminder to participants"""
    try:
        from events.models import Event
        from registrations.models import Registration
        
        event = Event.objects.get(id=event_id)
        participants = Registration.objects.filter(
            event=event, 
            status='approved'
        ).select_related('user')
        
        to_emails = [reg.user.email for reg in participants]
        
        context = {
            'event': event,
            'reminder_type': reminder_type,
            'site_url': settings.FRONTEND_URL,
        }
        
        template = EventReminderEmail()
        template.send(to_emails, context)
        
        return True
        
    except Exception as e:
        print(f"Failed to send event reminder: {e}")
        return False


def send_registration_status_update(registration_id: int, status: str, reason: str = '') -> bool:
    """Send registration status update email"""
    try:
        from registrations.models import Registration
        
        registration = Registration.objects.select_related(
            'user', 'event'
        ).get(id=registration_id)
        
        context = {
            'user': registration.user,
            'event': registration.event,
            'registration': registration,
            'status': status,
            'reason': reason,
            'site_url': settings.FRONTEND_URL,
        }
        
        if status == 'approved':
            template = RegistrationApprovedEmail()
        else:
            template = RegistrationRejectedEmail()
        
        template.send([registration.user.email], context)
        
        return True
        
    except Exception as e:
        print(f"Failed to send registration status update: {e}")
        return False
