"""
Notification services for registrations (email/SMS stubs)
"""
from django.conf import settings
from django.utils import timezone
from ..models import Registration


def send_registration_confirmation(registration: Registration) -> bool:
    """
    Send registration confirmation email to participant.
    
    Args:
        registration: Registration instance
        
    Returns:
        bool: True if notification sent successfully
    """
    try:
        # In a real implementation, you would send an actual email
        # For now, we'll just log the notification
        
        print(f"📧 Registration Confirmation Email sent to {registration.user.email}")
        print(f"   Event: {registration.event.name}")
        print(f"   Registration ID: {registration.id}")
        print(f"   Status: {registration.status}")
        
        # You could integrate with services like:
        # - Django's built-in email system
        # - SendGrid, Mailgun, AWS SES
        # - Celery for async email sending
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to send registration confirmation: {str(e)}")
        return False


def send_payment_confirmation(registration: Registration) -> bool:
    """
    Send payment confirmation email to participant.
    
    Args:
        registration: Registration instance
        
    Returns:
        bool: True if notification sent successfully
    """
    try:
        print(f"💳 Payment Confirmation Email sent to {registration.user.email}")
        print(f"   Event: {registration.event.name}")
        print(f"   Amount: ${registration.fee_dollars:.2f}")
        print(f"   Payment Date: {timezone.now().strftime('%Y-%m-%d %H:%M')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to send payment confirmation: {str(e)}")
        return False


def send_status_update(registration: Registration, old_status: str, new_status: str) -> bool:
    """
    Send status update notification to participant.
    
    Args:
        registration: Registration instance
        old_status: Previous status
        new_status: New status
        
    Returns:
        bool: True if notification sent successfully
    """
    try:
        print(f"📬 Status Update Email sent to {registration.user.email}")
        print(f"   Event: {registration.event.name}")
        print(f"   Status changed from {old_status} to {new_status}")
        
        if new_status == 'confirmed':
            print(f"   🎉 Congratulations! Your registration has been confirmed.")
        elif new_status == 'rejected':
            print(f"   Reason: {registration.reason}")
        elif new_status == 'waitlisted':
            print(f"   You have been added to the waitlist.")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to send status update: {str(e)}")
        return False


def send_document_reminder(registration: Registration, missing_docs: list) -> bool:
    """
    Send document upload reminder to participant.
    
    Args:
        registration: Registration instance
        missing_docs: List of missing document types
        
    Returns:
        bool: True if notification sent successfully
    """
    try:
        print(f"📄 Document Reminder Email sent to {registration.user.email}")
        print(f"   Event: {registration.event.name}")
        print(f"   Missing documents: {', '.join(missing_docs)}")
        print(f"   Please upload the required documents to complete your registration.")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to send document reminder: {str(e)}")
        return False


def send_organizer_notification(registration: Registration, action: str) -> bool:
    """
    Send notification to event organizer about registration activity.
    
    Args:
        registration: Registration instance
        action: Action performed (created, updated, etc.)
        
    Returns:
        bool: True if notification sent successfully
    """
    try:
        organizer = registration.event.created_by
        print(f"📧 Organizer Notification sent to {organizer.email}")
        print(f"   Event: {registration.event.name}")
        print(f"   Action: {action}")
        print(f"   Participant: {registration.user.email}")
        print(f"   Registration ID: {registration.id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to send organizer notification: {str(e)}")
        return False


def send_sms_notification(phone_number: str, message: str) -> bool:
    """
    Send SMS notification (stub implementation).
    
    Args:
        phone_number: Recipient phone number
        message: SMS message
        
    Returns:
        bool: True if notification sent successfully
    """
    try:
        # In a real implementation, you would integrate with SMS services like:
        # - Twilio
        # - AWS SNS
        # - SendGrid SMS
        
        print(f"📱 SMS sent to {phone_number}")
        print(f"   Message: {message}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to send SMS: {str(e)}")
        return False