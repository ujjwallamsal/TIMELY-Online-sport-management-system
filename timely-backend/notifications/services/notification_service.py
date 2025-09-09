# notifications/services/notification_service.py
from django.contrib.auth import get_user_model
from notifications.models import Notification

User = get_user_model()


class NotificationService:
    """Service for creating and managing notifications"""
    
    @staticmethod
    def send_notification(user, title, message, notification_type='info', topic='system', link_url=None):
        """
        Send a notification to a user
        
        Args:
            user: User instance
            title: Notification title
            message: Notification message
            notification_type: Type of notification (info, success, warning, error, announcement)
            topic: Topic category (registration, schedule, results, ticket, payment, system, message)
            link_url: Optional URL to link to
        
        Returns:
            Notification instance
        """
        notification = Notification.objects.create(
            user=user,
            title=title,
            body=message,
            kind=notification_type,
            topic=topic,
            link_url=link_url
        )
        
        # TODO: Implement email/SMS delivery if needed
        # For now, just create the notification in the database
        
        return notification
    
    @staticmethod
    def send_role_approved_notification(user, role):
        """Send notification for role approval"""
        return NotificationService.send_notification(
            user=user,
            title="Role Request Approved",
            message=f"Your request for {role} role has been approved.",
            notification_type='success',
            topic='system'
        )
    
    @staticmethod
    def send_role_rejected_notification(user, role, reason=""):
        """Send notification for role rejection"""
        message = f"Your request for {role} role was rejected."
        if reason:
            message += f" Reason: {reason}"
        
        return NotificationService.send_notification(
            user=user,
            title="Role Request Rejected",
            message=message,
            notification_type='warning',
            topic='system'
        )
    
    @staticmethod
    def send_kyc_approved_notification(user):
        """Send notification for KYC approval"""
        return NotificationService.send_notification(
            user=user,
            title="KYC Verification Approved",
            message="Your KYC verification has been approved. You can now proceed with role requests.",
            notification_type='success',
            topic='system'
        )
    
    @staticmethod
    def send_kyc_rejected_notification(user, reason=""):
        """Send notification for KYC rejection"""
        message = "Your KYC verification was rejected."
        if reason:
            message += f" Reason: {reason}"
        
        return NotificationService.send_notification(
            user=user,
            title="KYC Verification Rejected",
            message=message,
            notification_type='error',
            topic='system'
        )
