"""
Email and SMS stub services for notifications.
These are development stubs that log attempts and create DeliveryAttempt records.
No actual external network calls are made.
"""
import logging
from typing import Optional
from django.utils import timezone
from ..models import Notification, DeliveryAttempt

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, text: str, notification: Optional[Notification] = None) -> bool:
    """
    Stub email sender that logs the attempt and creates a DeliveryAttempt record.
    
    Args:
        to: Recipient email address
        subject: Email subject
        text: Email body text
        notification: Optional Notification instance to link delivery attempt
    
    Returns:
        bool: Always True (pretend success in dev)
    """
    logger.info(f"EMAIL STUB: To={to}, Subject={subject}, Body={text[:100]}...")
    
    if notification:
        DeliveryAttempt.objects.create(
            notification=notification,
            channel='email',
            status='sent',
            provider_ref=f"stub_email_{timezone.now().timestamp()}",
            created_at=timezone.now()
        )
        
        # Mark notification as delivered via email
        notification.delivered_email = True
        notification.save(update_fields=['delivered_email'])
    
    return True


def send_sms(to: str, text: str, notification: Optional[Notification] = None) -> bool:
    """
    Stub SMS sender that logs the attempt and creates a DeliveryAttempt record.
    
    Args:
        to: Recipient phone number
        text: SMS body text
        notification: Optional Notification instance to link delivery attempt
    
    Returns:
        bool: Always True (pretend success in dev)
    """
    logger.info(f"SMS STUB: To={to}, Body={text[:100]}...")
    
    if notification:
        DeliveryAttempt.objects.create(
            notification=notification,
            channel='sms',
            status='sent',
            provider_ref=f"stub_sms_{timezone.now().timestamp()}",
            created_at=timezone.now()
        )
        
        # Mark notification as delivered via SMS
        notification.delivered_sms = True
        notification.save(update_fields=['delivered_sms'])
    
    return True


def send_notification_email(notification: Notification) -> bool:
    """
    Send email for a notification using the templating system.
    
    Args:
        notification: Notification instance to send
    
    Returns:
        bool: Success status
    """
    from .templating import get_email_template
    
    template = get_email_template(notification.topic, notification.kind)
    subject = template['subject'].format(title=notification.title)
    body = template['body'].format(
        title=notification.title,
        body=notification.body,
        link_url=notification.link_url or ''
    )
    
    return send_email(
        to=notification.user.email,
        subject=subject,
        text=body,
        notification=notification
    )


def send_notification_sms(notification: Notification) -> bool:
    """
    Send SMS for a notification using the templating system.
    
    Args:
        notification: Notification instance to send
    
    Returns:
        bool: Success status
    """
    from .templating import get_sms_template
    
    template = get_sms_template(notification.topic, notification.kind)
    body = template['body'].format(
        title=notification.title,
        body=notification.body,
        link_url=notification.link_url or ''
    )
    
    return send_sms(
        to=getattr(notification.user, 'phone_number', ''),
        text=body,
        notification=notification
    )
