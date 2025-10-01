# Debug Checkout 500 Error

## Quick Fix Steps

### Step 1: Restart Backend Server
The serializer has been updated. You need to restart the Django server to pick up the changes.

```bash
# Stop the current server (Ctrl+C)
cd timely-backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py runserver
```

### Step 2: Check Backend Logs
Look at the terminal where Django is running. When you try to checkout, you should see error messages there.

**Look for lines like:**
```
ERROR: Checkout validation failed: ...
ERROR: Unexpected error during checkout: ...
```

### Step 3: Check What Data is Being Sent

Open browser DevTools → Network tab → Find the failed `/api/tickets/checkout/` request → Check the "Payload" or "Request" tab.

**Expected payload:**
```json
{
  "event_id": 1,
  "quantity": 2,
  "amount": 2000,
  "currency": "USD"
}
```

---

## Common Issues & Fixes

### Issue 1: Serializer Validation Error (400, not 500)

**Symptom**: Backend logs show "Checkout validation failed"

**Cause**: Data format is incorrect

**Fix**: Check that frontend is sending the correct data format.

---

### Issue 2: Event Not Found (404, not 500)

**Symptom**: "Event not found" in response

**Cause**: Event ID doesn't exist in database

**Fix**: 
1. Go to `/events` and check if events exist
2. Try creating a new event as Organizer
3. Use a valid event ID

---

### Issue 3: Database Connection Error (500)

**Symptom**: Can't connect to database

**Fix**:
```bash
cd timely-backend
python manage.py migrate
python manage.py runserver
```

---

### Issue 4: Missing STRIPE_SECRET_KEY (Should work in mock mode)

**Symptom**: Stripe-related error even though using mock mode

**Expected Behavior**: Should return `{mode: 'mock', ...}` when Stripe key is not configured

**Fix**: Check backend logs to ensure it's entering mock mode:
```
INFO: Using mock payment mode
```

---

### Issue 5: Import Error or Module Not Found (500)

**Symptom**: "ModuleNotFoundError" or "ImportError" in logs

**Fix**:
```bash
cd timely-backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py runserver
```

---

## Manual API Test

Test the API directly to isolate frontend vs backend issues:

### Using curl:
```bash
# Get your auth token first (from browser DevTools → Application → Local Storage)
TOKEN="your_token_here"

curl -X POST http://127.0.0.1:8000/api/tickets/checkout/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": 1,
    "quantity": 2
  }'
```

### Expected Success Response:
```json
{
  "sessionId": "mock_session_1",
  "ticket_order_id": 1,
  "tickets": ["TKT-MOCK-ABC12345", "TKT-MOCK-XYZ67890"],
  "mode": "mock"
}
```

### Expected Error Responses:

**400 Bad Request:**
```json
{
  "detail": {
    "event_id": ["This field is required."]
  }
}
```

**404 Not Found:**
```json
{
  "detail": "Event not found"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Server error. Please try again later."
}
```

---

## Changes Made to Fix 500 Errors

### 1. Updated CheckoutSerializer
- Made `amount` optional (calculated by backend)
- Made `currency` optional (defaults to USD)
- Added `quantity` field with validation (1-10)

**File**: `timely-backend/tickets/serializers.py`

### 2. Improved Error Logging
- Added detailed logging for validation failures
- Added logging for request data when errors occur
- Better exception handling

**File**: `timely-backend/tickets/views_ticketing.py`

### 3. Removed Duplicate Validation
- Serializer now handles quantity validation
- Backend uses validated data from serializer

---

## Step-by-Step Debugging

### 1. Check if Backend is Running
```bash
curl http://127.0.0.1:8000/api/health/
```

Should return: `{"status": "ok"}` or similar

### 2. Check if You're Authenticated
```bash
# Check browser DevTools → Application → Local Storage
# Look for "token" or "auth" key
```

### 3. Check if Event Exists
```bash
# Visit in browser:
http://127.0.0.1:8000/api/events/
```

Should show list of events with IDs

### 4. Try Checkout with Valid Event ID
Use the event ID from step 3 in your checkout request

### 5. Check Backend Terminal
Look for error messages immediately after clicking "Continue to Payment"

---

## If Still Getting 500 Errors

### Check these files haven't been modified incorrectly:

1. **timely-backend/tickets/serializers.py** - Line 39-54
   Should show updated `CheckoutSerializer` with optional fields

2. **timely-backend/tickets/views_ticketing.py** - Line 49-55
   Should use `serializer.validated_data.get('quantity', 1)`

3. **Django settings** - Check if ALLOWED_HOSTS includes '127.0.0.1'

### Verify your environment:
```bash
cd timely-backend
source venv/bin/activate
python manage.py check
python manage.py showmigrations
```

Should show no errors and all migrations applied

---

## Expected Console Output (Backend)

When checkout works correctly, you should see:

```
INFO: Stripe API key present: False
INFO: Using mock payment mode
INFO: Mock tickets created: ['TKT-MOCK-ABC12345', 'TKT-MOCK-XYZ67890'] for user 1
```

When checkout fails, you should see:

```
ERROR: Checkout validation failed: {'event_id': ['Event not found']}
```

or

```
ERROR: Unexpected error during checkout: 'NoneType' object has no attribute 'fee_cents'
ERROR: Request data: {'event_id': 1, 'quantity': 2, ...}
ERROR: Event ID: 1, Quantity: 2
```

---

## Quick Checklist

- [ ] Backend server is running (see "Starting development server" message)
- [ ] Virtual environment is activated (venv)
- [ ] You can access http://127.0.0.1:8000/api/health/
- [ ] You're logged in (check DevTools → Application → Local Storage for token)
- [ ] Event exists (visit /events page)
- [ ] Using correct event ID in checkout URL
- [ ] Browser console shows the request to /api/tickets/checkout/
- [ ] Backend terminal shows logs when you click checkout

---

## Emergency Fallback

If nothing works, try this minimal test:

1. Stop backend server
2. Delete `timely-backend/db.sqlite3` (backup first if needed)
3. Run:
   ```bash
   cd timely-backend
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   ```
4. Login as superuser
5. Create a new event
6. Try checkout again

---

## Get Help

Include this information when asking for help:

1. **Backend Terminal Output** (last 50 lines when error occurs)
2. **Browser Console Errors** (F12 → Console tab)
3. **Network Request Details** (F12 → Network → Failed request → Headers & Payload)
4. **Django Version**: Run `python manage.py version`
5. **Python Version**: Run `python --version`

---

**Status**: Serializer updated, awaiting server restart
**Last Updated**: October 1, 2025

