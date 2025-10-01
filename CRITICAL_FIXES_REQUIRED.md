# Critical Fixes Required Before Launch

**Date**: October 1, 2025  
**Priority**: BLOCKING LAUNCH

---

## 🔴 HIGH PRIORITY (Must Fix Immediately)

### 1. Missing Idempotency Keys in Stripe Checkout

**Status**: ❌ NOT IMPLEMENTED  
**Risk**: Users can accidentally create duplicate orders  
**Impact**: Financial discrepancies, customer confusion

**Current Code** (`timely-backend/payments/stripe_gateway.py:237`):
```python
session = stripe.checkout.Session.create(
    payment_method_types=['card'],
    line_items=line_items,
    mode='payment',
    # ... other params
)
```

**Required Fix**:
```python
session = stripe.checkout.Session.create(
    idempotency_key=f"order_{order.id}_{int(order.created_at.timestamp())}",
    payment_method_types=['card'],
    line_items=line_items,
    mode='payment',
    # ... other params
)
```

**Verification**:
1. Create checkout session, note order_id
2. Force browser refresh during checkout
3. Complete new checkout
4. Verify only ONE order exists in database
5. Check Stripe Dashboard shows single payment intent

**Files to Update**:
- `timely-backend/payments/stripe_gateway.py` (line ~237)
- `timely-backend/payments/provider.py` (StripeProvider.create_session)

---

### 2. Race Condition in Ticket Capacity Enforcement

**Status**: ❌ VULNERABLE TO RACE CONDITIONS  
**Risk**: Overselling tickets when multiple users purchase simultaneously  
**Impact**: Event capacity exceeded, legal/safety issues

**Current Issue**: No database-level locking on capacity checks

**Required Fix**:

**Option A**: Pessimistic Locking (Recommended)
```python
# tickets/services.py
from django.db import transaction

@transaction.atomic()
def create_ticket_order(user, event_id, quantity):
    # Lock the row until transaction completes
    event = Event.objects.select_for_update().get(id=event_id)
    
    if event.available_tickets < quantity:
        raise ValidationError("Not enough tickets available")
    
    # Update capacity atomically
    event.tickets_sold = F('tickets_sold') + quantity
    event.save(update_fields=['tickets_sold'])
    
    # Create order and tickets
    order = TicketOrder.objects.create(...)
    return order
```

**Option B**: Optimistic Locking
```python
# Add version field to Event model
class Event(models.Model):
    # ... existing fields
    version = models.IntegerField(default=1)
    
def create_ticket_order(user, event_id, quantity):
    max_retries = 3
    for attempt in range(max_retries):
        event = Event.objects.get(id=event_id)
        old_version = event.version
        
        if event.available_tickets < quantity:
            raise ValidationError("Sold out")
        
        # Try to update with version check
        updated = Event.objects.filter(
            id=event_id, 
            version=old_version
        ).update(
            tickets_sold=F('tickets_sold') + quantity,
            version=F('version') + 1
        )
        
        if updated > 0:
            # Success! Version matched
            break
        elif attempt == max_retries - 1:
            raise ConflictError("Try again")
    
    # Create order...
```

**Verification**:
1. Set event capacity to 2, tickets_sold=0
2. Open 3 browser tabs
3. Simultaneously checkout in all 3 tabs
4. Expected: 2 succeed, 1 fails with "Sold Out"
5. Database: `tickets_sold=2`, only 2 orders exist

**Files to Update**:
- `timely-backend/tickets/views.py` or create `tickets/services.py`
- `timely-backend/events/models.py` (if using optimistic locking)

---

### 3. EXIF Metadata Not Stripped from Uploaded Photos

**Status**: ❌ NOT IMPLEMENTED  
**Risk**: User privacy violation (GPS coordinates, camera serial numbers exposed)  
**Impact**: GDPR/privacy law violations, user safety

**Current Code** (`timely-backend/mediahub/services/storage.py`):
```python
def validate_media_file(file: UploadedFile) -> Tuple[str, str]:
    # Validates type and size, but doesn't strip EXIF
    return kind, mime_type
```

**Required Fix**:
```python
# Add to mediahub/services/storage.py
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile

def strip_exif_data(image_file: UploadedFile) -> ContentFile:
    """
    Remove EXIF metadata from image file.
    Returns new file without metadata.
    """
    try:
        # Open image
        img = Image.open(image_file)
        
        # Extract image data without EXIF
        data = list(img.getdata())
        image_without_exif = Image.new(img.mode, img.size)
        image_without_exif.putdata(data)
        
        # Save to bytes
        output = BytesIO()
        img_format = img.format or 'JPEG'
        image_without_exif.save(output, format=img_format, quality=85)
        output.seek(0)
        
        # Return as ContentFile
        return ContentFile(output.read(), name=image_file.name)
        
    except Exception as e:
        logger.error(f"Error stripping EXIF: {e}")
        # Fail safe: return original if processing fails
        return image_file

# Update MediaItemCreateSerializer.create()
def create(self, validated_data):
    file = validated_data.get('file')
    
    # Strip EXIF if image
    if file and file.content_type.startswith('image/'):
        file = strip_exif_data(file)
        validated_data['file'] = file
    
    return super().create(validated_data)
```

**Verification**:
1. Take photo with smartphone (includes GPS EXIF)
2. Upload to gallery
3. Download uploaded image
4. Run: `exiftool uploaded_image.jpg`
5. Verify NO GPS, camera serial, or personal metadata present

**Files to Update**:
- `timely-backend/mediahub/services/storage.py` (add strip_exif_data function)
- `timely-backend/mediahub/serializers.py` (call in create method)
- `timely-backend/requirements.txt` (ensure `Pillow>=10.0.0`)

---

## 🟡 MEDIUM PRIORITY (Fix Before Scaling)

### 4. Private File URLs Publicly Accessible in Production

**Status**: ⚠️ SECURE IN PRODUCTION, VULNERABLE IN DEBUG MODE  
**Risk**: KYC documents, medical records accessible without authentication  
**Impact**: Severe privacy breach, regulatory violations

**Current Issue**: 
- Django DEBUG=True serves all `/media/` files publicly
- No authentication check on file access
- Predictable URLs if UUIDs are not used

**Required Fix**:

**Option A**: Django View for Private Files
```python
# Create: common/views.py
from django.http import FileResponse, Http404
from django.contrib.auth.decorators import login_required
from pathlib import Path

@login_required
def serve_private_media(request, file_path):
    """
    Serve private files with permission check.
    """
    # Determine file ownership/permissions
    if file_path.startswith('documents/'):
        # Registration documents
        parts = file_path.split('/')
        registration_id = parts[1]
        
        registration = Registration.objects.get(id=registration_id)
        
        # Check permission
        if not (request.user == registration.user or 
                request.user.is_staff or
                request.user.role in ['ORGANIZER', 'ADMIN']):
            return HttpResponseForbidden("Access denied")
    
    # Serve file
    file_full_path = Path(settings.MEDIA_ROOT) / file_path
    if not file_full_path.exists():
        raise Http404("File not found")
    
    return FileResponse(open(file_full_path, 'rb'))

# urls.py
urlpatterns = [
    path('media/private/<path:file_path>', serve_private_media),
]
```

**Option B**: Nginx X-Accel-Redirect (Production)
```python
# views.py
@login_required
def serve_private_media(request, file_path):
    # ... permission check ...
    
    # Let nginx serve the file
    response = HttpResponse()
    response['X-Accel-Redirect'] = f'/protected/{file_path}'
    response['Content-Type'] = ''
    return response

# nginx.conf
location /protected/ {
    internal;
    alias /var/www/timely/media/;
}
```

**Option C**: Presigned URLs (S3/CloudStorage)
```python
# For AWS S3
import boto3
from botocore.config import Config

def get_presigned_url(file_key, expiration=300):
    """
    Generate presigned URL that expires in 5 minutes.
    """
    s3 = boto3.client('s3', config=Config(signature_version='s3v4'))
    url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': settings.AWS_STORAGE_BUCKET_NAME, 'Key': file_key},
        ExpiresIn=expiration
    )
    return url

# Serializer
class RegistrationDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    def get_file_url(self, obj):
        # Return presigned URL instead of direct file URL
        return get_presigned_url(obj.file.name)
```

**Verification**:
1. Upload registration document as User A
2. Copy file URL from network tab
3. Logout
4. Try to access URL in incognito window
5. Should return 403 Forbidden or redirect to login

**Files to Update**:
- `timely-backend/common/views.py` (create serve_private_media)
- `timely-backend/timely/urls.py` (add private media route)
- Production nginx config (if using X-Accel-Redirect)

---

### 5. No Rate Limiting on Critical Endpoints

**Status**: ⚠️ PARTIALLY IMPLEMENTED  
**Risk**: API abuse, DDoS, credential stuffing attacks  
**Impact**: Service downtime, compromised accounts

**Required Fix**:
```python
# common/throttles.py
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle

class AuthThrottle(UserRateThrottle):
    """Rate limit for authentication endpoints"""
    rate = '5/minute'

class CheckoutThrottle(UserRateThrottle):
    """Rate limit for checkout/payment endpoints"""
    rate = '10/minute'

class RegistrationThrottle(UserRateThrottle):
    """Rate limit for registration submissions"""
    rate = '3/hour'

# views.py
from rest_framework.decorators import throttle_classes

@api_view(['POST'])
@throttle_classes([AuthThrottle])
def login(request):
    # ... login logic

@api_view(['POST'])
@throttle_classes([CheckoutThrottle])
def stripe_checkout(request):
    # ... checkout logic
```

**Settings**:
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    }
}

# For production, use Redis-based throttling
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://localhost:6379/1',
    }
}
```

**Verification**:
```bash
# Test login rate limit
for i in {1..10}; do
    curl -X POST http://localhost:8000/api/accounts/login/ \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"wrong"}'
done
# After 5 requests, should return 429
```

**Files to Update**:
- `timely-backend/common/throttles.py` (create custom throttle classes)
- `timely-backend/accounts/views.py` (add to login/register)
- `timely-backend/payments/views.py` (add to checkout)
- `timely-backend/timely/settings.py` (configure throttle rates)

---

### 6. Unread Notification Count Endpoint Path Inconsistency

**Status**: ⚠️ POTENTIAL MISMATCH  
**Risk**: Broken notification badge, user confusion  
**Impact**: Poor UX, support requests

**Investigation Required**:
Check if frontend and backend agree on endpoint path:
- Backend: `/api/notifications/unread_count/` (snake_case)
- OR: `/api/notifications/unread-count/` (kebab-case)

**Current Backend** (`notifications/views.py:89`):
```python
@action(detail=False, methods=['get'])
def unread_count(self, request):
    # DRF action creates: /api/notifications/unread_count/
```

**Frontend Check Required**:
```typescript
// Search for: ENDPOINTS.notifications or unread
// Verify path matches backend
```

**Fix** (Standardize on kebab-case):
```python
# Backend: notifications/urls.py
router.register('notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('notifications/unread-count/', 
         NotificationViewSet.as_view({'get': 'unread_count'}),
         name='notification-unread-count'),
]

# OR use DRF's url_path
@action(detail=False, methods=['get'], url_path='unread-count')
def unread_count(self, request):
    # Creates: /api/notifications/unread-count/
```

**Verification**:
1. Login
2. Open DevTools → Network
3. Check notification badge renders
4. Look for API call to `/unread.../`
5. Verify returns 200 with count

---

## 🔵 LOW PRIORITY (Nice to Have)

### 7. Missing Database Unique Constraints

**Recommendation**: Add unique constraint on `provider_payment_intent_id`
```python
# tickets/models.py
class TicketOrder(models.Model):
    provider_payment_intent_id = models.CharField(
        max_length=255, 
        blank=True,
        unique=True,  # ADD THIS
        help_text="Payment provider intent ID"
    )
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['provider_payment_intent_id'],
                condition=~Q(provider_payment_intent_id=''),
                name='unique_payment_intent'
            )
        ]
```

---

### 8. Error Tracking Not Configured

**Recommendation**: Set up Sentry

```bash
# Install
pip install sentry-sdk
npm install @sentry/react
```

```python
# settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    integrations=[DjangoIntegration()],
    environment=os.getenv('ENVIRONMENT', 'development'),
    traces_sample_rate=0.1,  # 10% of transactions
)
```

```typescript
// main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.1,
});
```

---

### 9. Missing Request ID Middleware

**Recommendation**: Add request tracing

```python
# common/middleware.py
import uuid
import logging

logger = logging.getLogger(__name__)

class RequestIDMiddleware:
    """Add unique request ID to each request for tracing"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        request.id = str(uuid.uuid4())
        
        # Add to response header
        response = self.get_response(request)
        response['X-Request-ID'] = request.id
        
        return response

# settings.py
MIDDLEWARE = [
    'common.middleware.RequestIDMiddleware',
    # ... other middleware
]

# Logging configuration
LOGGING = {
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} request_id={request_id} {message}',
            'style': '{',
        }
    }
}
```

---

## 📋 Implementation Checklist

- [ ] **Fix 1**: Add idempotency keys to Stripe checkout
- [ ] **Fix 2**: Implement database locking for ticket capacity
- [ ] **Fix 3**: Strip EXIF metadata from uploaded images
- [ ] **Fix 4**: Secure private file URLs
- [ ] **Fix 5**: Add rate limiting to critical endpoints
- [ ] **Fix 6**: Verify/fix notification endpoint path
- [ ] **Fix 7**: Add unique constraints (optional)
- [ ] **Fix 8**: Configure Sentry (optional)
- [ ] **Fix 9**: Add request ID middleware (optional)

---

## 🧪 Testing After Fixes

For each fix, run the verification steps listed above, then:

1. **Regression Test**: Ensure existing functionality still works
2. **Edge Case Test**: Try to break it (concurrent requests, rapid retries, etc.)
3. **Documentation**: Update API docs and code comments
4. **Code Review**: Have another developer review the changes
5. **Deployment Plan**: Test on staging before production

---

## 📞 Support

If you encounter issues implementing these fixes:
- Check Django/Stripe documentation
- Search for similar implementations in the codebase
- Test thoroughly in development environment
- Create database backups before running migrations

**Remember**: These fixes are CRITICAL for launch. Do not skip them.

