# api/middleware.py - API Middleware
import time
import json
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from .models import AuditLog, APIMetrics

User = get_user_model()


class AuditLoggingMiddleware(MiddlewareMixin):
    """Middleware to automatically log admin-sensitive actions"""
    
    # Actions that should be logged
    AUDIT_ACTIONS = {
        'POST': ['create', 'approve', 'reject', 'publish', 'unpublish', 'cancel'],
        'PUT': ['update'],
        'PATCH': ['update'],
        'DELETE': ['delete'],
    }
    
    # Endpoints that should be audited
    AUDIT_ENDPOINTS = [
        '/api/users/',
        '/api/events/',
        '/api/registrations/',
        '/api/fixtures/',
        '/api/results/',
        '/api/announcements/',
        '/api/reports/',
    ]
    
    def process_request(self, request):
        """Store request start time for metrics"""
        request._audit_start_time = time.time()
        return None
    
    def process_response(self, request, response):
        """Log audit actions and API metrics"""
        # Log API metrics
        if hasattr(request, '_audit_start_time'):
            response_time = int((time.time() - request._audit_start_time) * 1000)
            self._log_api_metrics(request, response, response_time)
        
        # Log audit actions
        if self._should_audit(request, response):
            self._log_audit_action(request, response)
        
        return response
    
    def _should_audit(self, request, response):
        """Check if this request should be audited"""
        if not request.user.is_authenticated:
            return False
        
        # Only audit successful requests
        if response.status_code >= 400:
            return False
        
        # Check if endpoint should be audited
        path = request.path
        if not any(audit_endpoint in path for audit_endpoint in self.AUDIT_ENDPOINTS):
            return False
        
        # Check if method has audit actions
        method = request.method
        if method not in self.AUDIT_ACTIONS:
            return False
        
        return True
    
    def _log_audit_action(self, request, response):
        """Log the audit action"""
        try:
            method = request.method
            path = request.path
            user = request.user
            
            # Determine action type
            action = self._determine_action(method, path)
            if not action:
                return
            
            # Get target information
            target, target_description = self._get_target_info(request, response)
            
            # Get details
            details = self._get_action_details(request, response)
            
            # Log the action
            AuditLog.log_action(
                actor=user,
                action=action,
                target=target,
                target_description=target_description,
                details=details,
                request=request
            )
        except Exception as e:
            # Don't let audit logging break the request
            print(f"Audit logging error: {e}")
    
    def _determine_action(self, method, path):
        """Determine the action type from method and path"""
        if method == 'POST':
            if '/approve/' in path:
                return 'approve'
            elif '/reject/' in path:
                return 'reject'
            elif '/publish/' in path:
                return 'publish'
            elif '/unpublish/' in path:
                return 'unpublish'
            elif '/cancel/' in path:
                return 'cancel'
            else:
                return 'create'
        elif method in ['PUT', 'PATCH']:
            return 'update'
        elif method == 'DELETE':
            return 'delete'
        return None
    
    def _get_target_info(self, request, response):
        """Get target object and description"""
        try:
            # Try to get object from response data
            if hasattr(response, 'data') and isinstance(response.data, dict):
                data = response.data
                if 'id' in data:
                    # Try to determine model from path
                    model_class = self._get_model_from_path(request.path)
                    if model_class:
                        try:
                            target = model_class.objects.get(id=data['id'])
                            target_description = str(target)
                            return target, target_description
                        except:
                            pass
            
            # Fallback to path-based description
            path_parts = request.path.strip('/').split('/')
            if len(path_parts) >= 3:
                resource = path_parts[2]  # e.g., 'events', 'users'
                if len(path_parts) >= 4 and path_parts[3].isdigit():
                    target_id = path_parts[3]
                    target_description = f"{resource} #{target_id}"
                else:
                    target_description = resource
            else:
                target_description = request.path
            
            return None, target_description
        except:
            return None, request.path
    
    def _get_model_from_path(self, path):
        """Get model class from API path"""
        path_mapping = {
            'users': User,
            'events': 'events.models.Event',
            'registrations': 'registrations.models.Registration',
            'fixtures': 'fixtures.models.Fixture',
            'results': 'results.models.Result',
            'announcements': 'notifications.models.Notification',
        }
        
        for key, model in path_mapping.items():
            if f'/{key}/' in path:
                if isinstance(model, str):
                    # Lazy import to avoid circular imports
                    module_name, class_name = model.rsplit('.', 1)
                    module = __import__(module_name, fromlist=[class_name])
                    return getattr(module, class_name)
                return model
        return None
    
    def _get_action_details(self, request, response):
        """Get additional details about the action"""
        details = {
            'method': request.method,
            'path': request.path,
            'status_code': response.status_code,
        }
        
        # Add request data for non-GET requests
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                if hasattr(request, 'data'):
                    # Filter sensitive fields
                    data = dict(request.data)
                    sensitive_fields = ['password', 'token', 'secret', 'key']
                    for field in sensitive_fields:
                        if field in data:
                            data[field] = '***REDACTED***'
                    details['request_data'] = data
            except:
                pass
        
        return details
    
    def _log_api_metrics(self, request, response, response_time):
        """Log API usage metrics"""
        from django.conf import settings
        # Skip metrics in DEBUG mode unless explicitly enabled
        if not getattr(settings, 'API_METRICS_ENABLED', not settings.DEBUG):
            return
            
        try:
            APIMetrics.objects.create(
                endpoint=request.path,
                method=request.method,
                user=request.user if request.user.is_authenticated else None,
                response_time_ms=response_time,
                status_code=response.status_code,
            )
        except Exception as e:
            # Don't let metrics logging break the request
            print(f"Metrics logging error: {e}")


class RateLimitingMiddleware(MiddlewareMixin):
    """Rate limiting middleware"""
    
    def process_request(self, request):
        """Check rate limits"""
        # Skip rate limiting for certain paths
        if request.path.startswith('/admin/') or request.path.startswith('/static/'):
            return None
        
        # Implement rate limiting logic here
        # This is a placeholder - implement based on your requirements
        return None
