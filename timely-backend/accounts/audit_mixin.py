# accounts/audit_mixin.py
from django.utils import timezone
from django.http import HttpRequest
from rest_framework.viewsets import ViewSet
from rest_framework.views import APIView
from typing import Optional, Dict, Any
from common.models import AuditLog


class AuditLogMixin:
    """
    Mixin for views that need to log admin-sensitive actions to the audit log.
    Provides methods to log actions with automatic context extraction.
    """
    
    def log_audit_action(
        self, 
        request: HttpRequest,
        action: str,
        target: str,
        details: Optional[Dict[str, Any]] = None,
        actor: Optional[object] = None
    ) -> AuditLog:
        """
        Log an audit action with automatic context extraction.
        
        Args:
            request: The HTTP request object
            action: AuditLog action choice
            target: Target object description (e.g., 'Event:123', 'User:456')
            details: Additional metadata dict
            actor: User who performed the action (defaults to request.user)
        
        Returns:
            AuditLog instance
        """
        # Use provided actor or default to request user
        audit_actor = actor or getattr(request, 'user', None)
        
        # Ensure actor is a User instance or None
        if audit_actor and not hasattr(audit_actor, 'id'):
            audit_actor = None
        
        return AuditLog.log_action(
            actor=audit_actor,
            action=action,
            target_description=target,
            details=details or {},
            request=request
        )
    
    def log_user_action(self, request: HttpRequest, action: str, user_id: int, details: Optional[Dict[str, Any]] = None) -> AuditLog:
        """Log a user-related action"""
        return self.log_audit_action(
            request=request,
            action=action,
            target=f"User:{user_id}",
            details=details
        )
    
    def log_event_action(self, request: HttpRequest, action: str, event_id: int, details: Optional[Dict[str, Any]] = None) -> AuditLog:
        """Log an event-related action"""
        return self.log_audit_action(
            request=request,
            action=action,
            target=f"Event:{event_id}",
            details=details
        )
    
    def log_venue_action(self, request: HttpRequest, action: str, venue_id: int, details: Optional[Dict[str, Any]] = None) -> AuditLog:
        """Log a venue-related action"""
        return self.log_audit_action(
            request=request,
            action=action,
            target=f"Venue:{venue_id}",
            details=details
        )
    
    def log_team_action(self, request: HttpRequest, action: str, team_id: int, details: Optional[Dict[str, Any]] = None) -> AuditLog:
        """Log a team-related action"""
        return self.log_audit_action(
            request=request,
            action=action,
            target=f"Team:{team_id}",
            details=details
        )
    
    def log_fixture_action(self, request: HttpRequest, action: str, fixture_id: int, details: Optional[Dict[str, Any]] = None) -> AuditLog:
        """Log a fixture-related action"""
        return self.log_audit_action(
            request=request,
            action=action,
            target=f"Fixture:{fixture_id}",
            details=details
        )
    
    def log_result_action(self, request: HttpRequest, action: str, result_id: int, details: Optional[Dict[str, Any]] = None) -> AuditLog:
        """Log a result-related action"""
        return self.log_audit_action(
            request=request,
            action=action,
            target=f"Result:{result_id}",
            details=details
        )
    
    def log_payment_action(self, request: HttpRequest, action: str, payment_id: int, details: Optional[Dict[str, Any]] = None) -> AuditLog:
        """Log a payment-related action"""
        return self.log_audit_action(
            request=request,
            action=action,
            target=f"Payment:{payment_id}",
            details=details
        )
    
    def log_role_action(self, request: HttpRequest, action: str, user_id: int, role: str, details: Optional[Dict[str, Any]] = None) -> AuditLog:
        """Log a role-related action"""
        return self.log_audit_action(
            request=request,
            action=action,
            target=f"User:{user_id}:Role:{role}",
            details=details
        )


class AuditLogViewMixin(AuditLogMixin):
    """
    View mixin that automatically logs common actions for ViewSets and APIViews.
    Extends AuditLogMixin with automatic action detection.
    """
    
    # Map of HTTP methods to audit actions for different model types
    AUDIT_ACTIONS = {
        'User': {
            'POST': 'CREATE',
            'PUT': 'UPDATE',
            'PATCH': 'UPDATE',
            'DELETE': 'DELETE',
        },
        'Event': {
            'POST': 'CREATE',
            'PUT': 'UPDATE',
            'PATCH': 'UPDATE',
            'DELETE': 'DELETE',
        },
        'Venue': {
            'POST': 'CREATE',
            'PUT': 'UPDATE',
            'PATCH': 'UPDATE',
            'DELETE': 'DELETE',
        },
        'Team': {
            'POST': 'CREATE',
            'PUT': 'UPDATE',
            'PATCH': 'UPDATE',
            'DELETE': 'DELETE',
        },
        'TeamMember': {
            'POST': 'CREATE',
            'PUT': 'UPDATE',
            'PATCH': 'UPDATE',
            'DELETE': 'DELETE',
        },
        'Fixture': {
            'POST': 'CREATE',
            'PUT': 'UPDATE',
            'PATCH': 'UPDATE',
            'DELETE': 'DELETE',
        },
        'Result': {
            'POST': 'CREATE',
            'PUT': 'UPDATE',
            'PATCH': 'UPDATE',
            'DELETE': 'UPDATE',  # Results aren't deleted, just updated
        },
    }
    
    def get_model_name(self) -> str:
        """Get the model name for this view. Override in subclasses if needed."""
        if hasattr(self, 'queryset') and self.queryset:
            return self.queryset.model.__name__
        elif hasattr(self, 'model') and self.model:
            return self.model.__name__
        else:
            return 'Unknown'
    
    def should_audit_action(self, request: HttpRequest, action: str) -> bool:
        """
        Determine if this action should be audited.
        Override in subclasses to customize audit behavior.
        """
        # Don't audit safe methods (GET, HEAD, OPTIONS)
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return False
        
        # Don't audit if user is not authenticated (for system actions)
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin users might want to skip some audits for bulk operations
        # This can be overridden in subclasses
        return True
    
    def get_audit_details(self, request: HttpRequest, instance: Optional[object] = None) -> Dict[str, Any]:
        """
        Get additional details for audit logging.
        Override in subclasses to provide model-specific details.
        """
        details = {
            'method': request.method,
            'path': request.path,
            'timestamp': timezone.now().isoformat(),
        }
        
        if instance:
            details['instance_id'] = getattr(instance, 'id', None)
            details['instance_type'] = instance.__class__.__name__
        
        return details
    
    def perform_create_with_audit(self, serializer):
        """Perform create operation with audit logging"""
        instance = serializer.save()
        
        if self.should_audit_action(self.request, 'create'):
            model_name = self.get_model_name()
            action = self.AUDIT_ACTIONS.get(model_name, {}).get('POST')
            
            if action:
                details = self.get_audit_details(self.request, instance)
                self.log_audit_action(
                    request=self.request,
                    action=action,
                    target=f"{model_name}:{instance.id}",
                    details=details
                )
        
        return instance
    
    def perform_update_with_audit(self, serializer):
        """Perform update operation with audit logging"""
        instance = serializer.save()
        
        if self.should_audit_action(self.request, 'update'):
            model_name = self.get_model_name()
            action = self.AUDIT_ACTIONS.get(model_name, {}).get(self.request.method)
            
            if action:
                details = self.get_audit_details(self.request, instance)
                self.log_audit_action(
                    request=self.request,
                    action=action,
                    target=f"{model_name}:{instance.id}",
                    details=details
                )
        
        return instance
    
    def perform_destroy_with_audit(self, instance):
        """Perform destroy operation with audit logging"""
        instance_id = instance.id
        model_name = self.get_model_name()
        
        if self.should_audit_action(self.request, 'destroy'):
            action = self.AUDIT_ACTIONS.get(model_name, {}).get('DELETE')
            
            if action:
                details = self.get_audit_details(self.request, instance)
                self.log_audit_action(
                    request=self.request,
                    action=action,
                    target=f"{model_name}:{instance_id}",
                    details=details
                )
        
        instance.delete()