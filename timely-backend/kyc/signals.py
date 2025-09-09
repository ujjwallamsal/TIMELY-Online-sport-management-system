# kyc/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import KycProfile, KycDocument
from accounts.models import AuditLog


@receiver(post_save, sender=KycProfile)
def kyc_profile_audit_log(sender, instance, created, **kwargs):
    """Log KYC profile changes"""
    if created:
        AuditLog.log_action(
            user=instance.user,
            action=AuditLog.ActionType.CREATE,
            resource_type='KYC Profile',
            resource_id=str(instance.pk),
            details={'status': instance.status}
        )
    else:
        # Log status changes
        if hasattr(instance, '_old_status') and instance._old_status != instance.status:
            AuditLog.log_action(
                user=instance.user,
                action=AuditLog.ActionType.UPDATE,
                resource_type='KYC Profile',
                resource_id=str(instance.pk),
                details={
                    'old_status': instance._old_status,
                    'new_status': instance.status
                }
            )


@receiver(post_save, sender=KycDocument)
def kyc_document_audit_log(sender, instance, created, **kwargs):
    """Log KYC document uploads"""
    if created:
        AuditLog.log_action(
            user=instance.kyc_profile.user,
            action=AuditLog.ActionType.CREATE,
            resource_type='KYC Document',
            resource_id=str(instance.pk),
            details={
                'document_type': instance.document_type,
                'file_name': instance.file_name
            }
        )
