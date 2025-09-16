# privacy/services/exporter.py
import json
import zipfile
import tempfile
import os
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from django.core.files.storage import default_storage
from django.core.serializers.json import DjangoJSONEncoder

from accounts.models import User
from events.models import Event
from registrations.models import Registration
from tickets.models import TicketOrder, Ticket
from notifications.models import Notification
from privacy.models import DataExportRequest


def export_user_data(user, request_id):
    """
    Export all user data to a ZIP file
    
    Args:
        user: User instance
        request_id: UUID of the export request
        
    Returns:
        str: Path to the exported ZIP file
    """
    # Create temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        zip_path = os.path.join(temp_dir, f'user_data_{user.id}_{request_id}.zip')
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Export user profile data
            export_user_profile(user, zip_file)
            
            # Export events data
            export_events_data(user, zip_file)
            
            # Export registrations data
            export_registrations_data(user, zip_file)
            
            # Export tickets data
            export_tickets_data(user, zip_file)
            
            # Export notifications data
            export_notifications_data(user, zip_file)
            
            # Export audit logs
            export_audit_logs(user, zip_file)
            
            # Create summary
            create_export_summary(user, zip_file)
        
        # Upload to storage
        with open(zip_path, 'rb') as f:
            file_path = f'exports/{request_id}.zip'
            default_storage.save(file_path, f)
        
        return file_path


def export_user_profile(user, zip_file):
    """Export user profile data"""
    profile_data = {
        'user_id': user.id,
        'email': user.email,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': getattr(user, 'role', 'SPECTATOR'),
        'is_active': user.is_active,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'date_joined': user.date_joined.isoformat(),
        'last_login': user.last_login.isoformat() if user.last_login else None,
        'email_verified': getattr(user, 'email_verified', False),
        'phone_number': getattr(user, 'phone_number', ''),
        'date_of_birth': getattr(user, 'date_of_birth', None),
        'address': getattr(user, 'address', ''),
        'emergency_contact': getattr(user, 'emergency_contact', ''),
        'medical_conditions': getattr(user, 'medical_conditions', ''),
        'dietary_requirements': getattr(user, 'dietary_requirements', ''),
        'exported_at': timezone.now().isoformat()
    }
    
    # Add any additional profile fields
    if hasattr(user, 'profile'):
        profile = user.profile
        profile_data.update({
            'bio': getattr(profile, 'bio', ''),
            'avatar': getattr(profile, 'avatar', ''),
            'website': getattr(profile, 'website', ''),
            'social_links': getattr(profile, 'social_links', {}),
        })
    
    zip_file.writestr('profile.json', json.dumps(profile_data, indent=2, cls=DjangoJSONEncoder))


def export_events_data(user, zip_file):
    """Export events data"""
    # Events created by user
    created_events = Event.objects.filter(created_by=user).values(
        'id', 'name', 'description', 'start_date', 'end_date',
        'status', 'created_at', 'updated_at'
    )
    
    # Events user is registered for
    registered_events = Event.objects.filter(
        registrations__user=user
    ).values(
        'id', 'name', 'description', 'start_date', 'end_date',
        'status', 'created_at', 'updated_at'
    ).distinct()
    
    events_data = {
        'created_events': list(created_events),
        'registered_events': list(registered_events),
        'exported_at': timezone.now().isoformat()
    }
    
    zip_file.writestr('events.json', json.dumps(events_data, indent=2, cls=DjangoJSONEncoder))


def export_registrations_data(user, zip_file):
    """Export registrations data"""
    registrations = Registration.objects.filter(user=user).values(
        'id', 'event_id', 'event__name', 'status', 'created_at',
        'updated_at', 'notes', 'emergency_contact', 'medical_conditions',
        'dietary_requirements', 't_shirt_size', 'accommodation_required'
    )
    
    registrations_data = {
        'registrations': list(registrations),
        'exported_at': timezone.now().isoformat()
    }
    
    zip_file.writestr('registrations.json', json.dumps(registrations_data, indent=2, cls=DjangoJSONEncoder))


def export_tickets_data(user, zip_file):
    """Export tickets data"""
    # Ticket orders
    orders = TicketOrder.objects.filter(user=user).values(
        'id', 'event_id', 'event__name', 'total_cents', 'currency',
        'status', 'payment_provider', 'created_at', 'updated_at'
    )
    
    # Individual tickets
    tickets = Ticket.objects.filter(order__user=user).values(
        'id', 'order_id', 'ticket_type__name', 'serial', 'status',
        'issued_at', 'used_at'
    )
    
    tickets_data = {
        'orders': list(orders),
        'tickets': list(tickets),
        'exported_at': timezone.now().isoformat()
    }
    
    zip_file.writestr('tickets.json', json.dumps(tickets_data, indent=2, cls=DjangoJSONEncoder))


def export_notifications_data(user, zip_file):
    """Export notifications data"""
    notifications = Notification.objects.filter(user=user).values(
        'id', 'title', 'message', 'notification_type', 'read',
        'created_at', 'data'
    )
    
    notifications_data = {
        'notifications': list(notifications),
        'exported_at': timezone.now().isoformat()
    }
    
    zip_file.writestr('notifications.json', json.dumps(notifications_data, indent=2, cls=DjangoJSONEncoder))


def export_audit_logs(user, zip_file):
    """Export audit logs related to user"""
    from audit.models import AuditLog
    
    audit_logs = AuditLog.objects.filter(
        user=user
    ).values(
        'id', 'action', 'model_name', 'object_id', 'changes',
        'ip_address', 'user_agent', 'created_at'
    )
    
    audit_data = {
        'audit_logs': list(audit_logs),
        'exported_at': timezone.now().isoformat()
    }
    
    zip_file.writestr('audit_logs.json', json.dumps(audit_data, indent=2, cls=DjangoJSONEncoder))


def create_export_summary(user, zip_file):
    """Create export summary"""
    summary = {
        'export_info': {
            'user_id': user.id,
            'user_email': user.email,
            'exported_at': timezone.now().isoformat(),
            'data_retention_period_days': 365,  # Default retention period
            'data_types_included': [
                'profile', 'events', 'registrations', 'tickets', 
                'notifications', 'audit_logs'
            ]
        },
        'data_summary': {
            'total_events_created': Event.objects.filter(created_by=user).count(),
            'total_events_registered': Event.objects.filter(registrations__user=user).distinct().count(),
            'total_registrations': Registration.objects.filter(user=user).count(),
            'total_ticket_orders': TicketOrder.objects.filter(user=user).count(),
            'total_tickets': Ticket.objects.filter(order__user=user).count(),
            'total_notifications': Notification.objects.filter(user=user).count(),
        },
        'privacy_notice': {
            'purpose': 'This export contains all personal data associated with your account.',
            'retention': 'Data will be retained for 12 months from the export date.',
            'deletion': 'You can request deletion of your data at any time.',
            'contact': 'For privacy concerns, contact: privacy@timelyevents.com'
        }
    }
    
    zip_file.writestr('README.txt', json.dumps(summary, indent=2, cls=DjangoJSONEncoder))


def anonymize_user_data(user):
    """
    Anonymize user data instead of deleting
    
    Args:
        user: User instance to anonymize
    """
    # Anonymize user profile
    user.email = f'anonymized_{user.id}@deleted.local'
    user.username = f'anonymized_{user.id}'
    user.first_name = 'Anonymized'
    user.last_name = 'User'
    user.phone_number = ''
    user.address = ''
    user.emergency_contact = ''
    user.medical_conditions = ''
    user.dietary_requirements = ''
    user.is_active = False
    user.save()
    
    # Anonymize registrations
    registrations = Registration.objects.filter(user=user)
    for registration in registrations:
        registration.notes = '[Anonymized]'
        registration.emergency_contact = ''
        registration.medical_conditions = ''
        registration.dietary_requirements = ''
        registration.save()
    
    # Anonymize tickets (keep for audit purposes but remove personal data)
    orders = TicketOrder.objects.filter(user=user)
    for order in orders:
        order.customer_name = 'Anonymized User'
        order.customer_email = f'anonymized_{order.id}@deleted.local'
        order.customer_phone = ''
        order.notes = '[Anonymized]'
        order.save()
    
    # Anonymize notifications
    notifications = Notification.objects.filter(user=user)
    for notification in notifications:
        notification.title = '[Anonymized]'
        notification.message = '[Anonymized]'
        notification.save()


def delete_user_data(user):
    """
    Permanently delete user data
    
    Args:
        user: User instance to delete data for
    """
    # Delete related data first
    Registration.objects.filter(user=user).delete()
    TicketOrder.objects.filter(user=user).delete()
    Notification.objects.filter(user=user).delete()
    
    # Delete user profile if exists
    if hasattr(user, 'profile'):
        user.profile.delete()
    
    # Delete audit logs
    from audit.models import AuditLog
    AuditLog.objects.filter(user=user).delete()
    
    # Finally delete the user
    user.delete()
