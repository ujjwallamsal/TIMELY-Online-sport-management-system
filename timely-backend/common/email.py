# common/email.py
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
from django.core.mail import get_connection
from celery import shared_task
import logging

logger = logging.getLogger(__name__)


class EmailTemplate:
    """Base class for email templates"""
    
    def __init__(self, template_name, subject, context=None):
        self.template_name = template_name
        self.subject = subject
        self.context = context or {}
    
    def render_html(self):
        """Render HTML version of the email"""
        return render_to_string(f'emails/{self.template_name}.html', self.context)
    
    def render_text(self):
        """Render text version of the email"""
        return render_to_string(f'emails/{self.template_name}.txt', self.context)
    
    def send(self, to_emails, from_email=None):
        """Send the email"""
        if isinstance(to_emails, str):
            to_emails = [to_emails]
        
        from_email = from_email or settings.DEFAULT_FROM_EMAIL
        
        html_content = self.render_html()
        text_content = self.render_text()
        
        msg = EmailMultiAlternatives(
            subject=self.subject,
            body=text_content,
            from_email=from_email,
            to=to_emails
        )
        msg.attach_alternative(html_content, "text/html")
        
        try:
            msg.send()
            logger.info(f"Email sent successfully to {to_emails}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_emails}: {e}")
            return False


class EventConfirmationEmail(EmailTemplate):
    """Email template for event registration confirmation"""
    
    def __init__(self, registration, event, user):
        context = {
            'user': user,
            'event': event,
            'registration': registration,
            'event_url': f"{settings.FRONTEND_URL}/events/{event.id}",
            'dashboard_url': f"{settings.FRONTEND_URL}/dashboard",
        }
        super().__init__(
            template_name='event_confirmation',
            subject=f'Registration Confirmed - {event.name}',
            context=context
        )


class EventAnnouncementEmail(EmailTemplate):
    """Email template for event announcements"""
    
    def __init__(self, event, announcement, recipients):
        context = {
            'event': event,
            'announcement': announcement,
            'event_url': f"{settings.FRONTEND_URL}/events/{event.id}",
        }
        super().__init__(
            template_name='event_announcement',
            subject=f'Announcement: {event.name}',
            context=context
        )


class PaymentReceiptEmail(EmailTemplate):
    """Email template for payment receipts"""
    
    def __init__(self, payment, user, event):
        context = {
            'user': user,
            'payment': payment,
            'event': event,
            'receipt_url': f"{settings.FRONTEND_URL}/payments/{payment.id}/receipt",
        }
        super().__init__(
            template_name='payment_receipt',
            subject=f'Payment Receipt - {event.name}',
            context=context
        )


class PasswordResetEmail(EmailTemplate):
    """Email template for password reset"""
    
    def __init__(self, user, reset_url):
        context = {
            'user': user,
            'reset_url': reset_url,
            'expiry_hours': 24,
        }
        super().__init__(
            template_name='password_reset',
            subject='Password Reset Request',
            context=context
        )


class EmailVerificationEmail(EmailTemplate):
    """Email template for email verification"""
    
    def __init__(self, user, verification_url):
        context = {
            'user': user,
            'verification_url': verification_url,
            'expiry_hours': 24,
        }
        super().__init__(
            template_name='email_verification',
            subject='Verify Your Email Address',
            context=context
        )


# Celery tasks for async email sending
@shared_task
def send_event_confirmation_email(registration_id, user_id, event_id):
    """Send event confirmation email asynchronously"""
    from registrations.models import Registration
    from accounts.models import User
    from events.models import Event
    
    try:
        registration = Registration.objects.get(id=registration_id)
        user = User.objects.get(id=user_id)
        event = Event.objects.get(id=event_id)
        
        email = EventConfirmationEmail(registration, event, user)
        return email.send([user.email])
    except Exception as e:
        logger.error(f"Failed to send event confirmation email: {e}")
        return False


@shared_task
def send_event_announcement_email(event_id, announcement_id, recipient_emails):
    """Send event announcement email asynchronously"""
    from events.models import Event
    from notifications.models import Notification
    
    try:
        event = Event.objects.get(id=event_id)
        announcement = Notification.objects.get(id=announcement_id)
        
        email = EventAnnouncementEmail(event, announcement, recipient_emails)
        return email.send(recipient_emails)
    except Exception as e:
        logger.error(f"Failed to send event announcement email: {e}")
        return False


@shared_task
def send_payment_receipt_email(payment_id, user_id, event_id):
    """Send payment receipt email asynchronously"""
    from payments.models import Payment
    from accounts.models import User
    from events.models import Event
    
    try:
        payment = Payment.objects.get(id=payment_id)
        user = User.objects.get(id=user_id)
        event = Event.objects.get(id=event_id)
        
        email = PaymentReceiptEmail(payment, user, event)
        return email.send([user.email])
    except Exception as e:
        logger.error(f"Failed to send payment receipt email: {e}")
        return False


@shared_task
def send_password_reset_email(user_id, reset_url):
    """Send password reset email asynchronously"""
    from accounts.models import User
    
    try:
        user = User.objects.get(id=user_id)
        email = PasswordResetEmail(user, reset_url)
        return email.send([user.email])
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")
        return False


@shared_task
def send_email_verification_email(user_id, verification_url):
    """Send email verification email asynchronously"""
    from accounts.models import User
    
    try:
        user = User.objects.get(id=user_id)
        email = EmailVerificationEmail(user, verification_url)
        return email.send([user.email])
    except Exception as e:
        logger.error(f"Failed to send email verification email: {e}")
        return False


# Utility functions
def send_bulk_emails(emails, template_class, context_data):
    """Send bulk emails efficiently"""
    connection = get_connection()
    messages = []
    
    for email_data in emails:
        template = template_class(**context_data, **email_data)
        html_content = template.render_html()
        text_content = template.render_text()
        
        msg = EmailMultiAlternatives(
            subject=template.subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email_data['email']]
        )
        msg.attach_alternative(html_content, "text/html")
        messages.append(msg)
    
    try:
        connection.send_messages(messages)
        logger.info(f"Bulk email sent to {len(messages)} recipients")
        return True
    except Exception as e:
        logger.error(f"Failed to send bulk emails: {e}")
        return False


def queue_email(template_class, context_data, to_emails, task_name=None):
    """Queue an email for async sending"""
    if task_name == 'event_confirmation':
        return send_event_confirmation_email.delay(
            context_data['registration_id'],
            context_data['user_id'],
            context_data['event_id']
        )
    elif task_name == 'event_announcement':
        return send_event_announcement_email.delay(
            context_data['event_id'],
            context_data['announcement_id'],
            to_emails
        )
    elif task_name == 'payment_receipt':
        return send_payment_receipt_email.delay(
            context_data['payment_id'],
            context_data['user_id'],
            context_data['event_id']
        )
    elif task_name == 'password_reset':
        return send_password_reset_email.delay(
            context_data['user_id'],
            context_data['reset_url']
        )
    elif task_name == 'email_verification':
        return send_email_verification_email.delay(
            context_data['user_id'],
            context_data['verification_url']
        )
    else:
        # Generic email sending
        template = template_class(**context_data)
        return template.send(to_emails)
