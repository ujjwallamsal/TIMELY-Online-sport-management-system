# common/audit.py
from django.contrib.contenttypes.models import ContentType
from .models import AuditLog


class AuditLogMixin:
    """Mixin to add audit logging to viewsets"""
    
    def perform_create(self, serializer):
        """Log creation actions"""
        instance = serializer.save()
        if hasattr(instance, 'created_by') and not instance.created_by:
            instance.created_by = self.request.user
            instance.save()
        
        AuditLog.log_action(
            actor=self.request.user,
            action='CREATE',
            target=instance,
            target_description=str(instance),
            details={
                'data': serializer.validated_data,
                'viewset': self.__class__.__name__,
            },
            request=self.request
        )
        return instance
    
    def perform_update(self, serializer):
        """Log update actions"""
        instance = serializer.instance
        old_data = {
            field.name: getattr(instance, field.name)
            for field in instance._meta.fields
            if field.name in serializer.validated_data
        }
        
        instance = serializer.save()
        
        changes = {}
        for field, new_value in serializer.validated_data.items():
            old_value = old_data.get(field)
            if old_value != new_value:
                changes[field] = {
                    'old': old_value,
                    'new': new_value
                }
        
        AuditLog.log_action(
            actor=self.request.user,
            action='UPDATE',
            target=instance,
            target_description=str(instance),
            details={
                'changes': changes,
                'viewset': self.__class__.__name__,
            },
            request=self.request
        )
        return instance
    
    def perform_destroy(self, instance):
        """Log deletion actions"""
        AuditLog.log_action(
            actor=self.request.user,
            action='DELETE',
            target=instance,
            target_description=str(instance),
            details={
                'viewset': self.__class__.__name__,
            },
            request=self.request
        )
        instance.delete()
    
    def log_custom_action(self, action, target, details=None):
        """Log a custom action"""
        if details is None:
            details = {}
        
        AuditLog.log_action(
            actor=self.request.user,
            action=action,
            target=target,
            target_description=str(target),
            details=details,
            request=self.request
        )


class AdminAuditMixin(AuditLogMixin):
    """Mixin for admin-specific audit logging"""
    
    def log_admin_action(self, action, target, details=None):
        """Log admin-specific actions"""
        if details is None:
            details = {}
        
        details.update({
            'admin_action': True,
            'viewset': self.__class__.__name__,
        })
        
        return self.log_custom_action(action, target, details)
    
    def log_bulk_action(self, action, targets, details=None):
        """Log bulk actions"""
        if details is None:
            details = {}
        
        details.update({
            'bulk_action': True,
            'target_count': len(targets),
            'viewset': self.__class__.__name__,
        })
        
        # Log individual actions for each target
        for target in targets:
            self.log_custom_action(action, target, details)
