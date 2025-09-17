# tickets/services/email_service.py
import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class TicketEmailService:
    """Service for sending ticket-related emails"""
    
    def __init__(self):
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@timely.local')
        self.frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    
    def send_purchase_confirmation(self, order_data: Dict[str, Any], tickets: List[Dict[str, Any]]) -> bool:
        """Send purchase confirmation email with tickets"""
        try:
            user_email = order_data['user_email']
            event_name = order_data['event_name']
            order_id = order_data['order_id']
            total_amount = order_data['total_amount']
            currency = order_data.get('currency', 'USD')
            
            # Prepare email context
            context = {
                'user_name': order_data.get('user_name', 'Customer'),
                'event_name': event_name,
                'order_id': order_id,
                'total_amount': total_amount,
                'currency': currency,
                'tickets': tickets,
                'order_date': timezone.now(),
                'frontend_url': self.frontend_url,
                'ticket_url': f"{self.frontend_url}/tickets/{order_id}",
            }
            
            # Render email templates
            subject = f"Ticket Purchase Confirmation - {event_name}"
            html_message = render_to_string('tickets/email/purchase_confirmation.html', context)
            plain_message = render_to_string('tickets/email/purchase_confirmation.txt', context)
            
            # Send email
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=self.from_email,
                recipient_list=[user_email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Purchase confirmation email sent to {user_email} for order {order_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send purchase confirmation email: {str(e)}")
            return False
    
    def send_ticket_reminder(self, ticket_data: Dict[str, Any]) -> bool:
        """Send ticket reminder email"""
        try:
            user_email = ticket_data['user_email']
            event_name = ticket_data['event_name']
            ticket_serial = ticket_data['ticket_serial']
            
            context = {
                'user_name': ticket_data.get('user_name', 'Customer'),
                'event_name': event_name,
                'ticket_serial': ticket_serial,
                'event_date': ticket_data.get('event_date'),
                'venue': ticket_data.get('venue'),
                'frontend_url': self.frontend_url,
                'ticket_url': f"{self.frontend_url}/tickets/{ticket_data['ticket_id']}",
            }
            
            subject = f"Event Reminder - {event_name}"
            html_message = render_to_string('tickets/email/ticket_reminder.html', context)
            plain_message = render_to_string('tickets/email/ticket_reminder.txt', context)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=self.from_email,
                recipient_list=[user_email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Ticket reminder email sent to {user_email} for ticket {ticket_serial}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send ticket reminder email: {str(e)}")
            return False
    
    def send_refund_confirmation(self, order_data: Dict[str, Any], refund_data: Dict[str, Any]) -> bool:
        """Send refund confirmation email"""
        try:
            user_email = order_data['user_email']
            event_name = order_data['event_name']
            order_id = order_data['order_id']
            refund_amount = refund_data['amount_cents'] / 100
            currency = order_data.get('currency', 'USD')
            
            context = {
                'user_name': order_data.get('user_name', 'Customer'),
                'event_name': event_name,
                'order_id': order_id,
                'refund_amount': refund_amount,
                'currency': currency,
                'refund_reason': refund_data.get('reason', 'Refund processed'),
                'refund_date': timezone.now(),
                'frontend_url': self.frontend_url,
            }
            
            subject = f"Refund Confirmation - {event_name}"
            html_message = render_to_string('tickets/email/refund_confirmation.html', context)
            plain_message = render_to_string('tickets/email/refund_confirmation.txt', context)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=self.from_email,
                recipient_list=[user_email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Refund confirmation email sent to {user_email} for order {order_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send refund confirmation email: {str(e)}")
            return False


# Global service instance
email_service = TicketEmailService()
