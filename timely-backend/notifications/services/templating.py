"""
Tiny text templates for common notification events.
Provides simple string formatting for email and SMS templates.
"""
from typing import Dict, Any


def get_email_template(topic: str, kind: str) -> Dict[str, str]:
    """
    Get email template for a notification topic and kind.
    
    Args:
        topic: Notification topic (registration, schedule, etc.)
        kind: Notification kind (info, success, warning, error, announcement)
    
    Returns:
        Dict with 'subject' and 'body' keys
    """
    templates = {
        ('registration', 'success'): {
            'subject': 'Registration Confirmed - {title}',
            'body': '''Hello,

{body}

Thank you for registering!

Best regards,
Timely Team'''
        },
        ('registration', 'warning'): {
            'subject': 'Registration Update - {title}',
            'body': '''Hello,

{body}

Please check your registration status.

Best regards,
Timely Team'''
        },
        ('schedule', 'info'): {
            'subject': 'Schedule Update - {title}',
            'body': '''Hello,

{body}

{f"View details: {link_url}" if link_url else ""}

Best regards,
Timely Team'''
        },
        ('ticket', 'success'): {
            'subject': 'Ticket Confirmed - {title}',
            'body': '''Hello,

{body}

{f"View ticket: {link_url}" if link_url else ""}

Best regards,
Timely Team'''
        },
        ('payment', 'success'): {
            'subject': 'Payment Confirmed - {title}',
            'body': '''Hello,

{body}

Thank you for your payment!

Best regards,
Timely Team'''
        },
        ('announcement', 'announcement'): {
            'subject': 'Important Announcement - {title}',
            'body': '''Hello,

{body}

{f"Learn more: {link_url}" if link_url else ""}

Best regards,
Timely Team'''
        },
    }
    
    # Default template
    default = {
        'subject': '{title}',
        'body': '''Hello,

{body}

{f"Learn more: {link_url}" if link_url else ""}

Best regards,
Timely Team'''
    }
    
    return templates.get((topic, kind), default)


def get_sms_template(topic: str, kind: str) -> Dict[str, str]:
    """
    Get SMS template for a notification topic and kind.
    
    Args:
        topic: Notification topic (registration, schedule, etc.)
        kind: Notification kind (info, success, warning, error, announcement)
    
    Returns:
        Dict with 'body' key
    """
    templates = {
        ('registration', 'success'): {
            'body': 'Registration confirmed: {title}. {body}'
        },
        ('registration', 'warning'): {
            'body': 'Registration update: {title}. {body}'
        },
        ('schedule', 'info'): {
            'body': 'Schedule update: {title}. {body}'
        },
        ('ticket', 'success'): {
            'body': 'Ticket confirmed: {title}. {body}'
        },
        ('payment', 'success'): {
            'body': 'Payment confirmed: {title}. {body}'
        },
        ('announcement', 'announcement'): {
            'body': 'Announcement: {title}. {body}'
        },
    }
    
    # Default template
    default = {
        'body': '{title}: {body}'
    }
    
    return templates.get((topic, kind), default)


def format_notification_text(notification) -> Dict[str, str]:
    """
    Format notification text for both email and SMS.
    
    Args:
        notification: Notification instance
    
    Returns:
        Dict with 'email' and 'sms' keys containing formatted text
    """
    email_template = get_email_template(notification.topic, notification.kind)
    sms_template = get_sms_template(notification.topic, notification.kind)
    
    return {
        'email': {
            'subject': email_template['subject'].format(title=notification.title),
            'body': email_template['body'].format(
                title=notification.title,
                body=notification.body,
                link_url=notification.link_url or ''
            )
        },
        'sms': {
            'body': sms_template['body'].format(
                title=notification.title,
                body=notification.body,
                link_url=notification.link_url or ''
            )
        }
    }
