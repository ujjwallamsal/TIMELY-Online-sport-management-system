# Pre-Launch QA Testing Suite

**Purpose**: Systematic verification of all P0 (Must-Pass), P1 (Strongly Recommended), and P2 (Operational) items before production launch.

---

## 📋 Testing Framework

### Test Recording
- Record short clips (30-60s) for each critical flow
- Take screenshots of success & failure states  
- Save artifacts in `/qa_evidence/` folder with naming: `P0_stripe_webhook_success.png`

### Test Environment Setup
```bash
# Backend
cd timely-backend
source venv/bin/activate
python manage.py runserver

# Frontend  
cd timely-frontend
npm run dev

# Stripe CLI (for webhook testing)
stripe listen --forward-to localhost:8000/api/payments/webhooks/stripe/
```

---

## 🔴 P0 – MUST-PASS BEFORE LAUNCH

### 1. Stripe End-to-End

#### 1.1 Webhook Events
**Goal**: Verify all critical webhook events reach server and update database correctly

**Test Cases**:

```bash
# Test 1: Payment Success
✓ Create checkout session
✓ Complete payment with test card 4242 4242 4242 4242
✓ Verify webhook received: payment_intent.succeeded
✓ Check order status updated to PAID in database
✓ Verify ticket created in tickets table
✓ Confirm notification sent to user

# Evidence Required:
- Stripe Dashboard webhook log
- Django server log showing webhook processing
- Database query: SELECT * FROM tickets_ticketorder WHERE id=?
- Screenshot of "My Tickets" page showing new ticket
```

```bash
# Test 2: Payment Failed
✓ Create checkout session  
✓ Use declined card 4000 0000 0000 0002
✓ Verify webhook: payment_intent.payment_failed
✓ Order status remains PENDING or moves to FAILED
✓ User receives failure notification

# Evidence Required:
- Webhook log with failure event
- Order status check
```

```bash
# Test 3: Refund
✓ Complete successful purchase
✓ Admin initiates refund via backend
✓ Verify webhook: charge.refunded
✓ Order status updated to REFUNDED
✓ Ticket voided
✓ User notified

# Evidence Required:
- Refund API call log
- Webhook event
- Updated order status
```

**Critical Checks**:
- [ ] `WebhookEvent` record created for each event
- [ ] `webhook_event.processed = True` after successful processing
- [ ] No duplicate order creation from same payment_intent
- [ ] All money amounts match (Stripe Dashboard vs Database)

#### 1.2 Idempotency
**Goal**: Prevent duplicate orders from retried/abandoned checkouts

**Test Cases**:

```bash
# Test 4: Restart Checkout
✓ Create checkout session for Event X
✓ Note session_id and order_id
✓ Close browser tab before completing
✓ Create new checkout for same event
✓ Verify NEW session created (different session_id)
✓ Complete second checkout
✓ Verify ONLY ONE order/ticket exists
✓ First session should expire after 24h
```

**Implementation Check**:
```python
# ⚠️ CRITICAL FIX NEEDED: Add idempotency to stripe_gateway.py
# Current issue: No idempotency_key in session creation
# Expected fix:
session = stripe.checkout.Session.create(
    idempotency_key=f"order_{order.id}_{order.created_at.timestamp()}",
    # ... other params
)
```

- [ ] Idempotency keys implemented  
- [ ] Duplicate payment_intent IDs rejected
- [ ] Database has unique constraint on `provider_payment_intent_id`

#### 1.3 3DS/SCA & Failed Cards
**Goal**: Handle Strong Customer Authentication and card failures gracefully

**Test Cards**:
```
3DS Required: 4000 0027 6000 3184
Insufficient funds: 4000 0000 0000 9995
Expired card: 4000 0000 0000 0069
Generic decline: 4000 0000 0000 0002
```

**Test Cases**:

```bash
# Test 5: 3DS Flow
✓ Use card 4000 0027 6000 3184
✓ Complete 3DS challenge popup
✓ Verify payment succeeds after authentication
✓ Order created successfully

# Test 6: Card Declined
✓ Use card 4000 0000 0000 0002
✓ Verify clear error message to user
✓ Can retry with different card
✓ No incomplete orders created

# Test 7: Abandoned 3DS
✓ Start 3DS flow
✓ Close authentication window
✓ Return to site
✓ Session should allow retry
✓ No orphaned orders
```

- [ ] 3DS modal appears and completes
- [ ] Failed payment shows user-friendly error
- [ ] Can retry without creating duplicate orders
- [ ] Abandoned checkout can be resumed or restarted

#### 1.4 Edge Cases
```bash
# Test 8: Currency Rounding
✓ Create event with price $10.99 (1099 cents)
✓ Buy quantity=2 (should be 2198 cents, $21.98)
✓ Verify Stripe charge matches exactly
✓ No rounding errors in database

# Test 9: Free Event
✓ Create event with fee_cents=0
✓ Complete "free ticket" flow (no Stripe)
✓ Ticket issued immediately
✓ No payment_intent created

# Test 10: $0.01 Pricing
✓ Create event with fee_cents=1
✓ Complete checkout
✓ Verify 1 cent charged correctly

# Test 11: Quantity > 1
✓ Purchase 5 tickets in one order
✓ Verify 5 Ticket records created
✓ All link to same TicketOrder
✓ Each has unique serial number
```

- [ ] All currency calculations accurate to cent
- [ ] Free events bypass payment gateway
- [ ] Multi-ticket orders create correct number of tickets
- [ ] Coupons (if enabled) apply correctly

#### 1.5 Reconciliation
**Goal**: Stripe Dashboard totals = Database totals

**Test Case**:
```bash
# Test 12: Daily Reconciliation
✓ Complete 5 test purchases today
✓ Export Stripe Dashboard payments for today
✓ Run database query:
  SELECT SUM(total_cents) FROM tickets_ticketorder 
  WHERE status='paid' AND DATE(created_at) = CURRENT_DATE;
✓ Compare totals - MUST MATCH EXACTLY
```

---

### 2. Auth & Permissions

#### 2.1 Route Guard Matrix
**Goal**: Every role can only access their authorized routes

**Test Matrix**:

| Route | Anonymous | FAN | ATHLETE | ORGANIZER | ADMIN |
|-------|-----------|-----|---------|-----------|-------|
| `/events` | ✓ View | ✓ View | ✓ View | ✓ View | ✓ View |
| `/events/:id/checkout` | → Login | ✓ | ✓ | ✓ | ✓ |
| `/tickets/me` | → Login | ✓ | ✓ | ✓ | ✓ |
| `/registrations/create` | → Login | ✗ | ✓ | ✓ | ✓ |
| `/admin/events` | → Login | ✗ | ✗ | ✓ | ✓ |
| `/admin/users` | → Login | ✗ | ✗ | ✗ | ✓ |

**Test Cases**:

```bash
# Test 13: Direct URL Access (Not Logged In)
✓ Open incognito window
✓ Navigate to /admin/users
✓ Should redirect to /login
✓ After login as FAN, should show "Access Denied"

# Test 14: API Access Control
✓ Get auth token for FAN user
✓ Try: POST /api/adminapi/users/
✓ Should return 403 Forbidden
✓ Try: GET /api/tickets/me/
✓ Should return 200 OK with user's tickets

# Test 15: UI Visibility
✓ Login as ATHLETE
✓ Navigation should NOT show "Admin Panel" link
✓ Events page should NOT show "Create Event" button
✓ Registration forms should be visible
```

**Implementation Check**:
```typescript
// Frontend: src/components/ProtectedRoute.tsx
// ✓ Checks isAuthenticated
// ✓ Checks user.role against allowed roles
// ✓ Redirects or shows 403 page

// Backend: permissions.py  
// ✓ IsAdminOrReadOnly
// ✓ IsOrganizerOrReadOnly
// ✓ Role-based permission classes
```

- [ ] All routes have correct protection
- [ ] API returns 401 for unauthenticated, 403 for unauthorized
- [ ] UI hides unauthorized actions

#### 2.2 Token Refresh & Logout
**Goal**: Long sessions work; logout propagates

**Test Cases**:

```bash
# Test 16: Token Refresh on Long Session
✓ Login as user
✓ Wait for access token to expire (check JWT expiry time)
✓ Make API call after expiry
✓ Should auto-refresh using refresh token
✓ Request succeeds transparently

# Test 17: Clock Skew
✓ Set system clock -5 minutes
✓ Login
✓ Set clock back to correct time
✓ API calls should still work (token validation allows skew)

# Test 18: Logout Across Tabs
✓ Login in Tab A and Tab B
✓ Logout in Tab A
✓ Tab B: Try to access /tickets/me
✓ Should detect logout and redirect to login
```

**Implementation Check**:
```typescript
// api/client.ts should have refresh interceptor
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Try refresh
      const newToken = await refreshAccessToken();
      // Retry original request
    }
  }
);
```

- [ ] Access token refresh works automatically
- [ ] Refresh token stored securely (httpOnly cookie or secure storage)
- [ ] Logout clears all tokens and notifies other tabs (localStorage event)

#### 2.3 Role Application & Approval
**Goal**: Users can't spoof role changes via API

**Test Cases**:

```bash
# Test 19: Role Application Flow
✓ Login as FAN user (user_id=10)
✓ Apply for ATHLETE role via UI
✓ Check database: accounts_user.role should still be 'FAN'
✓ Check: Role application record created with status='pending'
✓ Intercept API call - should hit POST /api/accounts/apply-for-role/
✓ Try direct API: PATCH /api/accounts/users/10/ {"role": "ATHLETE"}
✓ Should return 403 Forbidden

# Test 20: Admin Approves Role
✓ Login as ADMIN
✓ Navigate to role applications
✓ Approve user_id=10 for ATHLETE
✓ Verify: accounts_user.role updated to 'ATHLETE'
✓ User receives notification
✓ User logs out and back in
✓ Token should now have role='ATHLETE'
```

**Implementation Check**:
```python
# accounts/views.py
# ✓ User can only update their own profile (except role)
# ✓ Role field is read_only in serializer
# ✓ Only admin endpoint can change role
# ✓ Audit log records role changes
```

- [ ] Role field is read-only in user profile API
- [ ] Admin-only endpoint for role approval
- [ ] Audit trail for all role changes
- [ ] JWT refreshed after role change

---

### 3. Data Integrity

#### 3.1 One Source of Truth
**Goal**: Ticket purchase updates all related data atomically

**Test Case**:

```bash
# Test 21: Concurrent Ticket Purchase
✓ Event has capacity=2, tickets_sold=0
✓ Open 3 browser tabs
✓ Tab 1, 2, 3: Start checkout for same event simultaneously
✓ Tab 1, 2: Complete payment within 1 second of each other
✓ Tab 3: Complete payment
✓ Expected: 2 orders succeed, 1 fails with "Sold Out"
✓ Verify database:
  - Event: tickets_sold=2, available=0
  - TicketOrder: 2 records with status=PAID
  - Ticket: 2 records created
  - Notifications: 2 success, 1 failure
```

**Database Check**:
```sql
-- Should have transaction isolation and row locking
BEGIN;
SELECT * FROM events_event WHERE id=? FOR UPDATE;
-- Check capacity
-- Update tickets_sold
COMMIT;
```

**Implementation Check**:
```python
# tickets/views.py or services.py
@transaction.atomic()
def purchase_tickets(order):
    event = Event.objects.select_for_update().get(id=order.event_id)
    if event.available_tickets < order.quantity:
        raise ValidationError("Sold out")
    event.tickets_sold += order.quantity
    event.save()
    # Create tickets
    # Send notifications
```

- [ ] Database transactions wrap multi-step operations
- [ ] SELECT FOR UPDATE prevents race conditions
- [ ] Event capacity enforced server-side
- [ ] Rollback on any failure

#### 3.2 Registration Status Transitions
**Goal**: State machine prevents invalid transitions

**Valid Transitions**:
```
PENDING → APPROVED
PENDING → REJECTED
REJECTED → PENDING (reapply)
```

**Invalid Transitions**:
```
APPROVED → PENDING (can't undo approval)
REJECTED → APPROVED (must go through reapply)
```

**Test Cases**:

```bash
# Test 22: Normal Flow
✓ User submits registration (status=PENDING)
✓ Organizer approves (status=APPROVED)
✓ Try to change back to PENDING via API
✓ Should fail with 400 Bad Request

# Test 23: Reapply After Rejection
✓ Organizer rejects registration (status=REJECTED, reason="Missing docs")
✓ User sees rejection with reason
✓ User uploads missing document
✓ User clicks "Resubmit"
✓ Status → PENDING (new review cycle)

# Test 24: API Spoofing Attempt
✓ Get registration_id=50 (status=PENDING)
✓ Direct API: PATCH /api/registrations/50/ {"status": "APPROVED"}
✓ Should return 403 (only organizer/admin can approve)
✓ Status remains PENDING
```

**Implementation Check**:
```python
# registrations/serializers.py: RegistrationStatusActionSerializer
# ✓ validate() checks current status
# ✓ Only allows valid transitions
# ✓ Permission check for approval

# registrations/views.py
# ✓ Separate endpoints: /approve/, /reject/, /reapply/
# ✓ Not using generic PATCH for status
```

- [ ] Status transitions enforced in serializer validation
- [ ] Separate API endpoints for each action
- [ ] Permission checks on state change endpoints
- [ ] Audit log records who changed status and when

---

### 4. File Handling

#### 4.1 Upload Security
**Goal**: Malicious files rejected; safe files processed correctly

**Test Cases**:

```bash
# Test 25: Valid File Upload (Gallery)
✓ Login as ORGANIZER
✓ Navigate to event gallery
✓ Upload valid JPEG (2MB)
✓ File saved to /media/gallery/{event_id}/{uuid}.jpg
✓ Database record created
✓ Image accessible at /media/... URL

# Test 26: Size Limit
✓ Try upload 15MB image
✓ Should fail with "File too large. Maximum size is 10MB"

# Test 27: Type Validation
✓ Rename malicious.exe → malicious.jpg
✓ Try upload
✓ Backend checks MIME type (not just extension)
✓ Should reject: "Unsupported file type"

# Test 28: Unsafe Extensions
✓ Try upload: script.php, shell.sh, payload.svg (with XSS)
✓ All should be rejected

# Test 29: EXIF Strip (Privacy)
✓ Upload photo with GPS EXIF data
✓ Download uploaded file
✓ Check EXIF: exiftool downloaded_image.jpg
✓ GPS data should be stripped
```

**Implementation Check**:
```python
# mediahub/services/storage.py: validate_media_file()
# ✓ Checks file.size
# ✓ Reads magic bytes to detect MIME type
# ✓ Validates extension matches MIME type
# ✓ Rejects unsafe types

# ⚠️ MISSING: EXIF stripping
# Add Pillow-based EXIF removal:
from PIL import Image
def strip_exif(image_file):
    img = Image.open(image_file)
    data = list(img.getdata())
    image_without_exif = Image.new(img.mode, img.size)
    image_without_exif.putdata(data)
    return image_without_exif
```

- [ ] File size limits enforced (10MB images, 100MB videos)
- [ ] MIME type detection via magic bytes
- [ ] Extension whitelist: jpg, png, webp, mp4, webm, pdf
- [ ] EXIF data stripped from photos **(⚠️ NOT YET IMPLEMENTED)**
- [ ] Antivirus scanning (optional but recommended for production)

#### 4.2 Private vs Public Files
**Goal**: Private files not guessable by URL

**Test Cases**:

```bash
# Test 30: Private Document URLs
✓ Upload registration document (KYC doc, medical clearance)
✓ Document saved with UUID filename
✓ Copy file URL from network tab
✓ Logout
✓ Try to access URL in incognito window
✓ Should return 403 Forbidden or redirect to login

# Test 31: Public Gallery Images
✓ Upload gallery image with visibility=PUBLIC
✓ Logout
✓ Access image URL
✓ Should display (publicly accessible)

# Test 32: Organizer-Only Media
✓ Upload media with visibility=PRIVATE
✓ Login as different user (not organizer)
✓ Try to access URL
✓ Should return 403
```

**Implementation Check**:
```python
# Option 1: Serve private files through Django view
# urls.py: path('media/private/<path:file_path>', serve_private_file)
# View checks user permissions before serving

# Option 2: Presigned URLs (S3/CloudFront)
# Generate time-limited signed URLs
# Expire after 5 minutes

# ⚠️ CURRENT ISSUE: Django DEBUG=True serves all media publicly
# Production: Use nginx with X-Accel-Redirect or S3 bucket policies
```

- [ ] Private file URLs include auth check
- [ ] Public files accessible without auth
- [ ] Filenames use UUIDs (not predictable)
- [ ] Directory listing disabled

---

### 5. Notifications

#### 5.1 Click-Through & Mark Read
**Goal**: Clicking notification opens correct detail and marks read

**Test Cases**:

```bash
# Test 33: Order Confirmation Notification
✓ Complete ticket purchase (order_id=123)
✓ Check notifications: New notification "Order Confirmed"
✓ notification.link_url = "/tickets/me/123"
✓ Click notification
✓ Redirects to order detail page
✓ Notification marked as read (read_at timestamp set)
✓ Unread badge count decrements

# Test 34: Registration Approval
✓ Registration approved (reg_id=45)
✓ Notification sent to athlete
✓ link_url = "/registrations/45"
✓ Click → opens registration detail
✓ Shows "APPROVED" status

# Test 35: Announcement
✓ Organizer posts announcement to Event X
✓ All registered users receive notification
✓ link_url = "/events/X" or "/announcements/Y"
✓ Click → opens announcement detail
```

**API Check**:
```bash
# Unread count endpoint
GET /api/notifications/unread-count/
Response: {"count": 5}

# ⚠️ Check: Endpoint path is /unread_count/ or /unread-count/?
# Verify frontend API call matches backend URL
```

- [ ] `link_url` field populated correctly
- [ ] Frontend parses `link_url` and navigates
- [ ] Mark as read: PATCH /api/notifications/{id}/ {"read_at": "now"}
- [ ] Unread count updates in real-time
- [ ] Unread badge uses correct API endpoint

#### 5.2 Real-Time Delivery
**Goal**: WebSocket/SSE + polling fallback both work

**Test Cases**:

```bash
# Test 36: WebSocket Real-Time
✓ Login user A in browser
✓ Open DevTools → Network → WS tab
✓ Verify WebSocket connection established
✓ In separate admin panel: Send announcement to user A
✓ Within 1 second: Notification appears in browser (no refresh)
✓ Toast/banner shows notification

# Test 37: SSE Fallback (if implemented)
✓ Block WebSocket in browser (network throttling)
✓ Should fall back to SSE: EventSource connection
✓ Notifications still arrive in real-time

# Test 38: Polling Fallback
✓ Disable WebSocket and SSE
✓ Frontend should poll GET /api/notifications/?unread=true every 30s
✓ New notifications appear after <30s delay
```

**Implementation Check**:
```typescript
// Frontend: src/hooks/useNotifications.ts
useEffect(() => {
  // Try WebSocket
  const ws = new WebSocket(`ws://localhost:8000/ws/notifications/`);
  ws.onerror = () => {
    // Fall back to polling
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
  };
}, []);
```

- [ ] WebSocket consumer implemented: `notifications/consumers.py`
- [ ] ASGI routing configured
- [ ] Frontend establishes WS connection on login
- [ ] Polling fallback for unreliable connections
- [ ] Reconnect logic if WS drops

---

### 6. Profile & Settings

#### 6.1 No Re-Render Loops
**Goal**: Profile page stable under slow API

**Test Cases**:

```bash
# Test 39: Slow API Response
✓ Throttle network to "Slow 3G" in DevTools
✓ Navigate to /profile
✓ Should show loading skeleton
✓ After load: Profile displays once
✓ Monitor console: No infinite loop logs
✓ Monitor network: No repeated GET /api/accounts/users/me/

# Test 40: Avatar Update Propagation
✓ Upload new avatar on profile page
✓ Avatar updates on profile page
✓ Check navbar: Avatar updated
✓ Check notifications panel: Avatar updated
✓ All without page refresh
```

**Implementation Check**:
```typescript
// Common issue: useEffect missing dependency
useEffect(() => {
  fetchUser();
}, []); // ✓ Empty array = run once

// NOT:
useEffect(() => {
  fetchUser();
}); // ✗ No dependency array = runs every render
```

- [ ] No infinite re-render warnings in console
- [ ] API calls happen once per page load
- [ ] React Query cache used to share user data across components
- [ ] Avatar URL cached and invalidated on update

#### 6.2 Email Change & Validation
**Goal**: Email change flow secure and clear

**Test Cases**:

```bash
# Test 41: Email Change (If Enabled)
✓ Navigate to profile settings
✓ Change email from old@example.com → new@example.com
✓ Submit
✓ Receive verification email at new@example.com
✓ Click link
✓ Email updated, verification_status = verified

# Test 42: Validation Errors
✓ Try invalid email: "not-an-email"
✓ Should show "Please enter a valid email address"
✓ Try duplicate email (already in use)
✓ Should show "Email already registered"
```

- [ ] Email validation on frontend and backend
- [ ] Duplicate email check
- [ ] Verification email sent if email changes
- [ ] Old email notified of change (security)

---

### 7. Results, Venues, Fixtures

#### 7.1 Instant Reflection of Edits
**Goal**: Organizer edits appear immediately without refresh

**Test Cases**:

```bash
# Test 43: Organizer Edits Event
✓ Open Event Detail page in browser A (as public user)
✓ Open Event Edit page in browser B (as organizer)
✓ Browser B: Change event name "Marathon" → "Ultra Marathon"
✓ Save
✓ Browser A: Event name should update within 2 seconds (via WebSocket or refetch)

# Test 44: Fixture Time Change
✓ Athlete viewing "My Schedule" page
✓ Organizer changes fixture time in admin
✓ Athlete's schedule should reflect new time
✓ If using WebSocket: Instant update
✓ If using polling: Update within 1 minute

# Test 45: Venue Capacity Change
✓ Event at 90/100 capacity
✓ Organizer increases capacity to 150
✓ Event detail page: Available tickets updates
✓ No page refresh needed
```

**Implementation Check**:
```python
# Backend: Send WebSocket message on save
@receiver(post_save, sender=Event)
def notify_event_change(sender, instance, **kwargs):
    from channels.layers import get_channel_layer
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"event_{instance.id}",
        {"type": "event_update", "data": EventSerializer(instance).data}
    )

# Frontend: Subscribe to event channel
useEffect(() => {
  const ws = new WebSocket(`ws://localhost:8000/ws/events/${eventId}/`);
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    setEvent(data);
  };
}, [eventId]);
```

- [ ] Real-time updates for events, fixtures, venues
- [ ] Optimistic UI updates on edit
- [ ] Revalidation on focus (React Query)
- [ ] Toast notification: "Event updated by organizer"

#### 7.2 Unauthorized Edit Attempts
**Goal**: Non-organizers can't edit events

**Test Cases**:

```bash
# Test 46: API Authorization
✓ Login as FAN user
✓ Get event_id=10 (created by organizer_user_id=5)
✓ Try: PATCH /api/events/10/ {"name": "Hacked Event"}
✓ Should return 403 Forbidden
✓ Event name unchanged

# Test 47: UI Hidden
✓ Login as ATHLETE
✓ View event detail page
✓ "Edit Event" button should NOT be visible
✓ Direct navigation to /admin/events/10/edit
✓ Should show 403 page or redirect
```

- [ ] Backend permission check: IsOwnerOrAdmin
- [ ] Frontend: Edit buttons only for authorized users
- [ ] Audit log records failed edit attempts

#### 7.3 Time Zone Correctness
**Goal**: Event times display correctly for viewer's timezone

**Test Cases**:

```bash
# Test 48: Event Local Time
✓ Create event: "Sydney Marathon, Jan 15, 2025 6:00 AM AEDT (UTC+11)"
✓ Store in database as UTC: 2025-01-14 19:00:00 UTC
✓ Viewer in Los Angeles (PST, UTC-8):
  - Should see: Jan 14, 2025 11:00 AM PST
✓ Viewer in Sydney:
  - Should see: Jan 15, 2025 6:00 AM AEDT

# Test 49: Athlete Schedule
✓ Athlete has fixtures in multiple time zones
✓ Schedule page shows all times in athlete's local timezone
✓ Original timezone indicated: "6:00 AM (Sydney time)"
```

**Implementation**:
```typescript
// Always store in UTC, display in local
import { formatInTimeZone } from 'date-fns-tz';

const localTime = formatInTimeZone(
  event.start_datetime, 
  Intl.DateTimeFormat().resolvedOptions().timeZone,
  'PPpp'
);
```

- [ ] All datetimes stored as UTC in database
- [ ] Frontend converts to user's local timezone
- [ ] Event timezone shown explicitly if different from user's
- [ ] DST transitions handled correctly

---

### 8. Reliability

#### 8.1 Zero Console Errors
**Goal**: Clean console on all main pages

**Test Cases**:

```bash
# Test 50: Main Pages Console Check
✓ Clear console
✓ Visit each page:
  - /events
  - /events/:id
  - /tickets/me
  - /registrations
  - /profile
  - /admin/events
✓ No red errors in console
✓ Yellow warnings acceptable (document in QA notes)

# Common Errors to Watch For:
- "Cannot read property of undefined"
- "Maximum update depth exceeded"
- "Failed to fetch"
- "404 Not Found" for API calls
```

- [ ] No console errors on main pages
- [ ] 404 errors caught and displayed as "Not Found" UI
- [ ] Failed API calls show retry button
- [ ] Error boundaries catch React errors

#### 8.2 Network Flakiness
**Goal**: App handles slow/offline gracefully

**Test Cases**:

```bash
# Test 51: Slow 3G
✓ DevTools → Network → Throttle: Slow 3G
✓ Navigate to events page
✓ Should show loading skeletons
✓ Eventually loads data (even if slow)
✓ No "Error" messages for slow responses

# Test 52: Offline
✓ Turn off WiFi
✓ Try to load events page
✓ Should show: "You're offline. Showing cached data."
✓ Or: "Unable to connect. Try again" button

# Test 53: Failed Request Retry
✓ DevTools → Network → Block request pattern: /api/events/
✓ Navigate to events page
✓ Shows error: "Failed to load events"
✓ "Try Again" button appears
✓ Click → Retries request
✓ Unblock → Data loads successfully
```

**Implementation Check**:
```typescript
// React Query automatic retry
const { data, error, refetch } = useQuery({
  queryKey: ['events'],
  queryFn: fetchEvents,
  retry: 3,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
});

if (error) {
  return (
    <div>
      <p>Failed to load events</p>
      <button onClick={() => refetch()}>Try Again</button>
    </div>
  );
}
```

- [ ] Loading states shown during requests
- [ ] Failed requests auto-retry 3 times with exponential backoff
- [ ] Manual "Try Again" button on persistent failures
- [ ] Timeout set for long requests (30s)

---

## 🟡 P1 – STRONGLY RECOMMENDED

### 9. Security & Privacy

#### 9.1 CORS/CSRF Rules
```bash
# Test 54: CORS
✓ From external site (jsbin.com): 
  fetch('http://localhost:8000/api/events/')
✓ Should fail with CORS error (unless origin whitelisted)

# Backend Check:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "https://timely.example.com",  # Production
]
```

```bash
# Test 55: CSRF Protection
✓ API endpoints using session auth should require CSRF token
✓ GET requests: No CSRF needed
✓ POST/PUT/DELETE: CSRF token required in header or cookie
```

**Implementation**:
```python
# settings.py
CORS_ALLOWED_ORIGINS = [...]
CSRF_TRUSTED_ORIGINS = [...]
CSRF_COOKIE_HTTPONLY = False  # JS needs to read
CSRF_COOKIE_SECURE = True  # Production HTTPS only
```

#### 9.2 Cookie Flags & CSP
```bash
# Test 56: Cookie Security
✓ Open DevTools → Application → Cookies
✓ Check cookies:
  - sessionid: HttpOnly=True, Secure=True, SameSite=Lax
  - csrftoken: HttpOnly=False, Secure=True, SameSite=Lax
```

```bash
# Test 57: Content Security Policy
✓ Check response headers:
  Content-Security-Policy: default-src 'self'; script-src 'self'; ...
✓ No inline <script> tags in HTML
✓ All scripts loaded from same origin or CDN
```

#### 9.3 Secret Management
```bash
# Test 58: Environment Variables
✓ Verify .env file NOT in git: git ls-files | grep .env
✓ .env.example should exist with dummy values
✓ Check Django settings:
  SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
  STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY')
✓ Never hardcoded

# Test 59: Key Rotation
✓ Change STRIPE_SECRET_KEY in .env
✓ Restart server
✓ New checkouts should use new key
✓ Old webhook signatures should fail (expected)
```

#### 9.4 API Rate Limiting
```bash
# Test 60: Authentication Endpoints
✓ Script: Attempt login 20 times/second
✓ After 5 failed attempts: Should return 429 Too Many Requests
✓ Locked out for 5 minutes
✓ Then can retry

# Test 61: Checkout Endpoint
✓ Create 100 checkout sessions in 1 minute
✓ After 50: Rate limit triggered
✓ Response: 429, "Retry after 60 seconds"
```

**Implementation**:
```python
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'auth': '5/minute',  # Login attempts
        'checkout': '10/minute',  # Checkout sessions
    }
}
```

---

### 10. Observability

#### 10.1 Request IDs & Logs
```bash
# Test 62: Request Tracing
✓ Make API call: POST /api/tickets/checkout/
✓ Check response header: X-Request-ID: abc123...
✓ Check server log:
  [INFO] request_id=abc123 user=10 POST /api/tickets/checkout/ 201
✓ If error occurs:
  [ERROR] request_id=abc123 Stripe error: card_declined
```

**Implementation**:
```python
# middleware.py
import uuid

class RequestIDMiddleware:
    def __call__(self, request):
        request.id = str(uuid.uuid4())
        response = self.get_response(request)
        response['X-Request-ID'] = request.id
        return response

# logging config
LOGGING = {
    'formatters': {
        'verbose': {
            'format': '[{levelname}] request_id={request_id} {message}',
        }
    }
}
```

#### 10.2 PII Redaction
```bash
# Test 63: Log Inspection
✓ grep server.log for "card_number"
✓ Should find: card_number=****1234 (last 4 only)
✓ Should NOT find full card numbers

✓ grep server.log for "email"
✓ Should find: email=u***r@example.com (partially masked)
```

```python
import re

def mask_pii(log_message):
    # Mask email
    log_message = re.sub(r'([a-zA-Z0-9._%+-]+)@', r'\1***@', log_message)
    # Mask card numbers
    log_message = re.sub(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?(\d{4})\b', r'****\1', log_message)
    return log_message
```

#### 10.3 Client Error Tracking
```bash
# Test 64: Sentry Integration (Optional)
✓ Cause intentional error: Throw error in component
✓ Check Sentry dashboard
✓ Error should appear with:
  - User ID
  - URL path
  - Browser/OS
  - Stack trace
```

```typescript
// Frontend: src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  beforeSend(event, hint) {
    // Filter out noisy errors
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
      return null;
    }
    return event;
  },
});
```

---

### 11. Accessibility

#### 11.1 Keyboard-Only Navigation
```bash
# Test 65: Tab Navigation
✓ Unplug mouse
✓ Navigate site using only Tab, Enter, Space, Arrows
✓ All interactive elements should be reachable
✓ Focus indicators visible (blue outline)
✓ Can complete ticket checkout with keyboard only

# Test 66: Modal Focus Trap
✓ Open modal (e.g., "Confirm Purchase")
✓ Press Tab repeatedly
✓ Focus should cycle within modal (not escape to background)
✓ Press Escape → Modal closes, focus returns to trigger button
```

#### 11.2 Screen Reader Friendly
```bash
# Test 67: ARIA Labels (macOS VoiceOver, Windows Narrator)
✓ Enable screen reader
✓ Navigate to "Get Ticket" button
✓ Should announce: "Get Ticket button, Buy ticket for Marathon event"
✓ Form fields should announce: "Email address, required text field"

# Test 68: Image Alt Text
✓ All <img> tags should have alt attribute
✓ Decorative images: alt=""
✓ Meaningful images: alt="Sydney Marathon 2025 finish line photo"
```

**Implementation**:
```tsx
<button
  aria-label={`Get ticket for ${event.name}`}
  onClick={handleCheckout}
>
  Get Ticket
</button>

<input
  type="email"
  aria-label="Email address"
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>
{error && <span id="email-error" role="alert">{error}</span>}
```

#### 11.3 Color Contrast
```bash
# Test 69: WCAG AA Compliance
✓ Use tool: Chrome DevTools → Lighthouse → Accessibility
✓ Or: https://webaim.org/resources/contrastchecker/
✓ Text contrast ratio:
  - Normal text: ≥ 4.5:1
  - Large text (18pt+): ≥ 3:1
  - Interactive elements: ≥ 3:1

# Common Failures:
- Light gray text on white background
- "Disabled" button text too faint
```

---

### 12. Performance

#### 12.1 Largest Contentful Paint (LCP)
```bash
# Test 70: Mobile Performance
✓ Chrome DevTools → Lighthouse
✓ Device: Mobile
✓ Run audit
✓ LCP should be < 2.5 seconds
✓ Check:
  - Images lazy-loaded
  - Critical CSS inlined
  - Fonts preloaded
```

#### 12.2 Image Optimization
```bash
# Test 71: Responsive Images
✓ View event card with 1000x1000 banner image
✓ On mobile: Should load 400x400 thumbnail
✓ On desktop: Load full size
✓ Check network: <img srcset="...">

# Test 72: Format Optimization
✓ Upload PNG image (2MB)
✓ Backend converts to WebP (500KB) and JPEG (800KB)
✓ Frontend: <picture>
  <source type="image/webp" srcset="image.webp">
  <img src="image.jpg">
</picture>
```

#### 12.3 Caching Headers
```bash
# Test 73: Static Assets
✓ Load page, check response headers:
  - /static/css/main.css: Cache-Control: max-age=31536000, immutable
  - /static/js/bundle.js: Cache-Control: max-age=31536000, immutable
✓ Reload page: Assets loaded from disk cache (0ms)

# Test 74: API Responses
✓ GET /api/events/: Cache-Control: max-age=60
✓ GET /api/accounts/users/me/: Cache-Control: no-cache, private
```

#### 12.4 React Query Stale Policies
```bash
# Test 75: Event Capacity Accuracy
✓ View event with 5 tickets remaining
✓ Another user buys 1 ticket
✓ Your browser: Showing "5 available" (stale)
✓ After 30 seconds: Refetch, now shows "4 available"
✓ If you click "Buy", API returns current capacity (server-side check)
```

```typescript
useQuery({
  queryKey: ['event', eventId],
  queryFn: () => fetchEvent(eventId),
  staleTime: 30000,  // Data fresh for 30s
  cacheTime: 300000, // Keep in cache for 5min
  refetchOnWindowFocus: true,  // Refetch when tab regains focus
});
```

---

### 13. Email/SMS

#### 13.1 Transactional Emails
```bash
# Test 76: Order Receipt Email
✓ Complete ticket purchase
✓ Check email inbox (use Mailtrap/MailHog for testing)
✓ Subject: "Your tickets for [Event Name]"
✓ Body includes:
  - Order number
  - Event details
  - Ticket QR code (or download link)
  - Support contact
✓ Click "View Tickets" → Deep links to /tickets/me/{order_id}

# Test 77: Registration Approved Email
✓ Admin approves registration
✓ Athlete receives email
✓ Subject: "Your registration for [Event] has been approved!"
✓ Click "View Registration" → Deep links to /registrations/{id}
```

#### 13.2 Mobile Email Rendering
```bash
# Test 78: Gmail Mobile App
✓ Forward test email to real Gmail account
✓ Open on iPhone/Android
✓ Email should be:
  - Responsive (fits screen width)
  - Images load correctly
  - CTA buttons tappable
  - Links work
```

**Implementation**:
```python
# Use Django email templates
from django.core.mail import EmailMultiAlternatives

def send_order_confirmation(order):
    context = {
        'order': order,
        'tickets': order.tickets.all(),
        'deep_link': f"{settings.FRONTEND_URL}/tickets/me/{order.id}",
    }
    html_content = render_to_string('emails/order_confirmation.html', context)
    text_content = strip_tags(html_content)
    
    email = EmailMultiAlternatives(
        subject=f"Your tickets for {order.event.name}",
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[order.user.email],
    )
    email.attach_alternative(html_content, "text/html")
    email.send()
```

---

## 🟢 P2 – OPERATIONAL CHECKS

### 14. Admin Workflows

#### 14.1 Audit Trail
```bash
# Test 79: Who Did What When
✓ Login as admin
✓ Approve registration_id=10
✓ Query audit log:
  SELECT * FROM audit_log WHERE object_id=10 AND object_type='registration'
✓ Should show:
  - timestamp: 2025-01-15 14:30:00
  - user: admin@example.com
  - action: status_change
  - old_value: PENDING
  - new_value: APPROVED

# Test 80: Export Audit Log
✓ Admin panel: Export audit log as CSV
✓ Download should include all fields
✓ Import into Excel → Verify readability
```

#### 14.2 Soft Delete & Restore
```bash
# Test 81: Soft Delete Event
✓ Admin: Delete event_id=50
✓ Database: event.deleted_at = NOW()
✓ Public: Event no longer listed
✓ Admin panel: Event shows in "Deleted Events"
✓ Admin: Restore event
✓ Database: event.deleted_at = NULL
✓ Public: Event visible again

# Test 82: Cascade Soft Delete
✓ Delete event with tickets/registrations
✓ All related records soft deleted
✓ Restore event → All records restored
```

#### 14.3 Migrations Rollback
```bash
# Test 83: Database Migration Test
✓ Create database backup: pg_dump timely_db > backup.sql
✓ Run migration: python manage.py migrate
✓ Verify new schema: \d accounts_user
✓ Rollback: python manage.py migrate accounts 0010_previous
✓ Verify schema reverted
✓ Reapply: python manage.py migrate
```

---

### 15. Search & Filters

#### 15.1 Events Search
```bash
# Test 84: Search Functionality
✓ Navigate to /events
✓ Search: "Marathon"
✓ Results: All events with "Marathon" in name or description
✓ Search: "Sydney"
✓ Results: Events in Sydney (venue_name match)

# Test 85: Filters
✓ Filter by Sport: "Running"
✓ Filter by Date: "Upcoming"
✓ Combined: Running + Upcoming + Sydney
✓ Results update correctly
```

#### 15.2 Pagination
```bash
# Test 86: Large Result Set
✓ Create 100 test events
✓ Navigate to /events
✓ Should show 20 per page (configurable)
✓ Pagination controls at bottom
✓ Click "Next" → Page 2 loads
✓ URL updates: /events?page=2
✓ Direct URL access: /events?page=5 → Works
```

#### 15.3 Empty States
```bash
# Test 87: No Results
✓ Search: "ZZZ_NONEXISTENT"
✓ Should show friendly message:
  "No events found for 'ZZZ_NONEXISTENT'"
  "Try different keywords or browse all events"
✓ Button: "Clear Filters" or "Browse All"

# Test 88: Empty List
✓ Navigate to /tickets/me (no tickets purchased)
✓ Should show:
  "You haven't purchased any tickets yet"
  "Explore Events" button
✓ NOT: Blank page or error
```

---

### 16. Mobile Responsiveness

#### 16.1 Small Screens
```bash
# Test 89: iPhone SE (375x667)
✓ DevTools → Device: iPhone SE
✓ Navigate all main pages
✓ Check:
  - No horizontal scroll
  - Text readable (not too small)
  - Buttons tappable (min 44x44px)
  - Forms usable
  - Tables scroll horizontally or stack

# Test 90: Long Names Wrapping
✓ Create event with very long name:
  "The 2025 International Ultra Marathon Championship Series Finals"
✓ View on mobile
✓ Name should wrap (not truncate mid-word)
✓ Card height adjusts
```

#### 16.2 Toast Notifications
```bash
# Test 91: Toast Position (Mobile)
✓ Complete action that triggers toast
✓ Toast appears at top or bottom (not middle)
✓ Does NOT cover "Checkout" button
✓ Dismissible by tap
✓ Auto-dismisses after 5 seconds
```

---

## 📸 Evidence Collection

### Required Artifacts

For each P0 test, collect:

1. **Screenshots**:
   - Success state (e.g., "Payment successful" page)
   - Failure state (e.g., "Card declined" error message)
   - Database query results (e.g., `SELECT * FROM tickets_ticketorder WHERE id=X`)

2. **Video Clips** (30-60s each):
   - Complete checkout flow (start to finish)
   - Concurrent ticket purchase race condition
   - Webhook event processing
   - Real-time notification delivery

3. **Logs**:
   - Stripe webhook event logs (from Stripe Dashboard)
   - Django server logs (with request IDs)
   - Audit trail exports

4. **Reconciliation Report**:
   ```
   Date: 2025-01-15
   Stripe Dashboard Total: $1,250.00 (25 payments)
   Database Total:         $1,250.00 (25 paid orders)
   Difference:             $0.00 ✓
   ```

### Folder Structure

```
/qa_evidence/
  ├── P0_stripe/
  │   ├── 01_successful_checkout.mp4
  │   ├── 02_webhook_success_log.png
  │   ├── 03_database_order_record.png
  │   ├── 04_refund_flow.mp4
  │   └── reconciliation_2025-01-15.csv
  ├── P0_auth/
  │   ├── route_guard_matrix.xlsx
  │   ├── direct_url_403.png
  │   ├── api_403_response.png
  │   └── role_approval_flow.mp4
  ├── P0_data_integrity/
  │   ├── concurrent_purchase_race.mp4
  │   ├── database_transaction_log.txt
  │   └── capacity_enforcement.png
  ├── P0_files/
  │   ├── valid_upload_success.png
  │   ├── size_limit_rejection.png
  │   ├── malicious_file_blocked.png
  │   └── private_url_403.png
  ├── P0_notifications/
  │   ├── websocket_realtime.mp4
  │   ├── click_through_navigation.mp4
  │   └── unread_count_api.png
  ├── P0_profile/
  │   ├── no_render_loop_console.png
  │   ├── avatar_propagation.mp4
  │   └── slow_api_loading_state.png
  ├── P0_reliability/
  │   ├── zero_console_errors.png
  │   ├── slow_3g_loading.mp4
  │   └── offline_retry_button.png
  ├── P1_security/
  │   ├── cors_test_result.png
  │   ├── cookie_security_flags.png
  │   ├── rate_limit_429.png
  │   └── env_secrets_check.txt
  ├── P1_accessibility/
  │   ├── lighthouse_accessibility_score.png
  │   ├── keyboard_navigation.mp4
  │   └── screen_reader_test.mp4
  ├── P1_performance/
  │   ├── lighthouse_performance_score.png
  │   ├── lcp_metrics.png
  │   └── caching_headers.png
  └── P2_operational/
      ├── audit_trail_export.csv
      ├── search_filters.mp4
      └── mobile_responsiveness.mp4
```

---

## 🚨 Critical Fixes Identified During QA

### HIGH PRIORITY (Blocking Launch)

1. **Idempotency Keys Missing**
   - **Location**: `timely-backend/payments/stripe_gateway.py:237`
   - **Issue**: Checkout session creation doesn't use idempotency keys
   - **Fix**:
     ```python
     session = stripe.checkout.Session.create(
         idempotency_key=f"order_{order.id}_{int(order.created_at.timestamp())}",
         # ... rest of params
     )
     ```
   - **Test**: Restart same checkout, verify no duplicate orders

2. **EXIF Data Not Stripped**
   - **Location**: `timely-backend/mediahub/services/storage.py`
   - **Issue**: Uploaded photos retain GPS and camera metadata
   - **Fix**:
     ```python
     from PIL import Image
     
     def strip_exif(image_file):
         img = Image.open(image_file)
         data = list(img.getdata())
         img_no_exif = Image.new(img.mode, img.size)
         img_no_exif.putdata(data)
         return img_no_exif
     ```
   - **Test**: Upload photo with GPS EXIF, verify removed

3. **Race Condition in Ticket Capacity**
   - **Location**: `timely-backend/tickets/views.py` or service layer
   - **Issue**: Concurrent purchases can oversell tickets
   - **Fix**: Add `select_for_update()` in transaction
     ```python
     @transaction.atomic()
     def create_order(event_id, quantity):
         event = Event.objects.select_for_update().get(id=event_id)
         if event.available_tickets < quantity:
             raise ValidationError("Sold out")
         event.tickets_sold += quantity
         event.save()
     ```
   - **Test**: Concurrent checkout simulation

### MEDIUM PRIORITY (Fix Before Users Scale)

4. **Private File URLs Publicly Accessible**
   - **Issue**: `/media/` files served by Django in DEBUG mode, no auth check
   - **Fix**: Implement protected file serving view or use nginx X-Accel-Redirect
   - **Test**: Logout, try to access KYC document URL

5. **Unread Count Endpoint Path Mismatch**
   - **Issue**: Frontend may call `/unread-count/` while backend uses `/unread_count/`
   - **Fix**: Standardize on kebab-case or snake_case
   - **Test**: Check Network tab, verify 200 response

6. **No Rate Limiting on Checkout**
   - **Issue**: Can create unlimited checkout sessions per minute
   - **Fix**: Add throttle class to checkout view
   - **Test**: Script 100 checkout requests in 1 minute

### LOW PRIORITY (Nice to Have)

7. **Error Tracking Not Configured**
   - **Recommendation**: Set up Sentry for both frontend and backend
   - **Benefit**: Catch production errors in real-time

8. **Accessibility Audit**
   - **Recommendation**: Run full Lighthouse accessibility audit
   - **Benefit**: WCAG 2.1 AA compliance

---

## ✅ Sign-Off Checklist

Before launching to production, the following must be completed:

- [ ] **P0 Tests**: All 92 P0 test cases passed with evidence
- [ ] **Critical Fixes**: All HIGH priority fixes implemented and verified
- [ ] **Reconciliation**: Stripe Dashboard = Database totals (test period)
- [ ] **Route Guard Matrix**: Documented and verified for all roles
- [ ] **Security Review**: CORS, CSRF, secrets, rate limiting verified
- [ ] **Performance**: LCP < 2.5s on mobile, Lighthouse score > 90
- [ ] **Accessibility**: Keyboard navigation and screen reader tested
- [ ] **Email/SMS**: Transactional emails sent and render correctly
- [ ] **Monitoring**: Logging, error tracking, and alerts configured
- [ ] **Backup & Rollback**: Database backup procedure and rollback plan tested
- [ ] **Documentation**: Admin playbook and incident response guide written

**Signed Off By**:
- [ ] Tech Lead: ________________________ Date: __________
- [ ] QA Lead: _________________________ Date: __________
- [ ] Product Manager: __________________ Date: __________

---

## 🔄 Continuous Testing

After launch:
1. **Daily**: Check Stripe reconciliation
2. **Weekly**: Review error logs and audit trail
3. **Monthly**: Run regression tests on P0 items
4. **Quarterly**: Full security audit

**END OF PRE-LAUNCH QA SUITE**

