# common/security.py
import time
import hashlib
import hmac
import logging
from functools import wraps
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import json

logger = logging.getLogger(__name__)

# In-memory rate limiting storage (simple dict for dev; use Redis in production)
_rate_limit_storage = {}

def get_client_ip(request):
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def rate_limit(max_attempts=5, window_minutes=5, key_func=None):
    """
    Rate limiting decorator for authentication endpoints.
    
    Args:
        max_attempts: Maximum attempts allowed in the time window
        window_minutes: Time window in minutes
        key_func: Function to generate rate limit key (defaults to IP + email)
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Generate rate limit key
            if key_func:
                key = key_func(request)
            else:
                ip = get_client_ip(request)
                email = request.data.get('email', '') if hasattr(request, 'data') else ''
                key = f"rate_limit:{ip}:{email}"
            
            # Check current attempts
            current_time = time.time()
            window_seconds = window_minutes * 60
            
            # Clean old entries
            _rate_limit_storage[key] = [
                attempt_time for attempt_time in _rate_limit_storage.get(key, [])
                if current_time - attempt_time < window_seconds
            ]
            
            # Check if limit exceeded
            if len(_rate_limit_storage.get(key, [])) >= max_attempts:
                logger.warning(f"Rate limit exceeded for key: {key}")
                return JsonResponse({
                    'error': 'Too many attempts. Please try again later.',
                    'retry_after': window_seconds
                }, status=429)
            
            # Record this attempt
            if key not in _rate_limit_storage:
                _rate_limit_storage[key] = []
            _rate_limit_storage[key].append(current_time)
            
            # Call the original view
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

def verify_stripe_webhook_signature(request):
    """
    Verify Stripe webhook signature.
    
    Args:
        request: Django request object with webhook payload
        
    Returns:
        tuple: (is_valid, error_message)
    """
    webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', None)
    if not webhook_secret:
        return False, "Webhook secret not configured"
    
    signature = request.META.get('HTTP_STRIPE_SIGNATURE')
    if not signature:
        return False, "Missing Stripe signature"
    
    try:
        # Get the raw body
        body = request.body
        
        # Verify signature
        expected_sig = hmac.new(
            webhook_secret.encode('utf-8'),
            body,
            hashlib.sha256
        ).hexdigest()
        
        # Stripe sends signature in format "t=timestamp,v1=signature"
        sig_parts = signature.split(',')
        timestamp = None
        signature_value = None
        
        for part in sig_parts:
            if part.startswith('t='):
                timestamp = part[2:]
            elif part.startswith('v1='):
                signature_value = part[3:]
        
        if not timestamp or not signature_value:
            return False, "Invalid signature format"
        
        # Verify timestamp (prevent replay attacks)
        current_time = int(time.time())
        if abs(current_time - int(timestamp)) > 300:  # 5 minutes tolerance
            return False, "Timestamp too old"
        
        # Verify signature
        payload = f"{timestamp}.{body.decode('utf-8')}"
        expected_sig = hmac.new(
            webhook_secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature_value, expected_sig):
            return False, "Invalid signature"
        
        return True, None
        
    except Exception as e:
        logger.error(f"Webhook signature verification error: {str(e)}")
        return False, f"Signature verification failed: {str(e)}"

def log_security_event(event_type, request, details=None, user=None):
    """
    Log security-related events.
    
    Args:
        event_type: Type of security event (e.g., 'login_attempt', 'role_change')
        request: Django request object
        details: Additional details dictionary
        user: User object if available
    """
    ip = get_client_ip(request)
    user_info = {
        'user_id': user.id if user else None,
        'username': user.username if user else None,
        'email': user.email if user else None,
    }
    
    log_data = {
        'event_type': event_type,
        'ip_address': ip,
        'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        'timestamp': time.time(),
        'user': user_info,
        'details': details or {},
    }
    
    logger.info(f"Security event: {event_type}", extra=log_data)

def log_auth_attempt(request, success, user=None, details=None):
    """Log authentication attempt."""
    event_type = 'login_success' if success else 'login_failed'
    log_security_event(event_type, request, details, user)

def log_role_change(request, user, old_roles, new_roles, details=None):
    """Log role change event."""
    change_details = {
        'old_roles': old_roles,
        'new_roles': new_roles,
        **(details or {})
    }
    log_security_event('role_change', request, change_details, user)

def log_webhook_event(request, webhook_type, success, details=None):
    """Log webhook event."""
    event_type = f'webhook_{webhook_type}_{"success" if success else "failed"}'
    log_security_event(event_type, request, details)

def generate_secure_token(length=32):
    """Generate a secure random token."""
    import secrets
    return secrets.token_urlsafe(length)

def hash_sensitive_data(data):
    """Hash sensitive data for logging (one-way)."""
    return hashlib.sha256(data.encode('utf-8')).hexdigest()[:16]

class SecurityHeadersMiddleware:
    """Add security headers to responses."""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # HSTS (only in production with HTTPS)
        if not settings.DEBUG and request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        return response
