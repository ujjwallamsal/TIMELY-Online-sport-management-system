# audit/hooks.py
"""
Audit logging helper functions for KYC and role changes
"""
from django.contrib.auth import get_user_model
from common.models import AuditLog

User = get_user_model()


def audit_log(action, actor, target=None, meta=None, ip_address=None, user_agent=None):
    """
    Generic audit logging helper function
    
    Args:
        action: AuditLog.ActionType choice
        actor: User who performed the action
        target: Target user (if applicable)
        meta: Additional metadata dict
        ip_address: Client IP address
        user_agent: Client user agent
    
    Returns:
        AuditLog instance
    """
    resource_type = 'User'
    resource_id = str(target.id) if target else str(actor.id)
    
    details = meta or {}
    if target and target != actor:
        details['target_user'] = target.email
    
    return AuditLog.log_action(
        user=actor,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent
    )


def audit_kyc_action(action, actor, kyc_profile, meta=None, ip_address=None, user_agent=None):
    """
    Audit KYC-related actions
    
    Args:
        action: AuditLog.ActionType choice
        actor: User who performed the action (admin)
        kyc_profile: KycProfile instance
        meta: Additional metadata dict
        ip_address: Client IP address
        user_agent: Client user agent
    
    Returns:
        AuditLog instance
    """
    details = meta or {}
    details.update({
        'target_user': kyc_profile.user.email,
        'kyc_status': kyc_profile.status,
        'kyc_id': str(kyc_profile.pk)
    })
    
    return AuditLog.log_action(
        user=actor,
        action=action,
        resource_type='KYC Profile',
        resource_id=str(kyc_profile.pk),
        details=details,
        ip_address=ip_address,
        user_agent=user_agent
    )


def audit_role_change(action, actor, target_user, old_role, new_role, meta=None, ip_address=None, user_agent=None):
    """
    Audit role change actions
    
    Args:
        action: AuditLog.ActionType choice
        actor: User who performed the action (admin)
        target_user: User whose role was changed
        old_role: Previous role
        new_role: New role
        meta: Additional metadata dict
        ip_address: Client IP address
        user_agent: Client user agent
    
    Returns:
        AuditLog instance
    """
    details = meta or {}
    details.update({
        'target_user': target_user.email,
        'old_role': old_role,
        'new_role': new_role
    })
    
    return AuditLog.log_action(
        user=actor,
        action=action,
        resource_type='User Role',
        resource_id=str(target_user.pk),
        details=details,
        ip_address=ip_address,
        user_agent=user_agent
    )


def audit_role_request_action(action, actor, role_request, meta=None, ip_address=None, user_agent=None):
    """
    Audit role request actions
    
    Args:
        action: AuditLog.ActionType choice
        actor: User who performed the action
        role_request: RoleRequest instance
        meta: Additional metadata dict
        ip_address: Client IP address
        user_agent: Client user agent
    
    Returns:
        AuditLog instance
    """
    details = meta or {}
    details.update({
        'target_user': role_request.user.email,
        'requested_role': role_request.requested_role,
        'request_status': role_request.status,
        'request_id': str(role_request.pk)
    })
    
    return AuditLog.log_action(
        user=actor,
        action=action,
        resource_type='Role Request',
        resource_id=str(role_request.pk),
        details=details,
        ip_address=ip_address,
        user_agent=user_agent
    )
