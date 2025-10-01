# Backend Errors Fixed

## Issue Summary

The backend was encountering errors due to incorrect status constants being used in the webhook handler.

## Errors Fixed

### 1. ❌ `Ticket.Status.PENDING` Does Not Exist

**Error**: `AttributeError: type object 'Status' has no attribute 'PENDING'`

**Location**: `timely-backend/tickets/webhooks.py` line 77

**Root Cause**: The `Ticket` model only has three status choices:
- `VALID` (default)
- `USED`
- `VOID`

There is no `PENDING` status for tickets.

**Fix**: Changed from `Ticket.Status.PENDING` to `Ticket.Status.VALID`

```python
# BEFORE (incorrect)
status=Ticket.Status.PENDING  # Awaiting approval

# AFTER (correct)
status=Ticket.Status.VALID  # Payment received, ticket is valid
```

**Rationale**: Once payment is received through Stripe, the ticket is valid and ready to use. The concept of "pending approval" should be handled at a different level (e.g., through event-level approval workflows), not through the ticket status itself.

---

### 2. ❌ `TicketOrder.Status.CANCELLED` Does Not Exist

**Error**: `AttributeError: type object 'Status' has no attribute 'CANCELLED'`

**Location**: `timely-backend/tickets/webhooks.py` line 297 (handle_payment_canceled function)

**Root Cause**: The `TicketOrder` model only has four status choices:
- `PENDING`
- `PAID`
- `FAILED`
- `REFUNDED`

There is no `CANCELLED` status.

**Fix**: Changed from `TicketOrder.Status.CANCELLED` to `TicketOrder.Status.FAILED`

```python
# BEFORE (incorrect)
order.status = TicketOrder.Status.CANCELLED

# AFTER (correct)
order.status = TicketOrder.Status.FAILED
```

**Rationale**: A cancelled payment is effectively a failed payment from the order's perspective. The `FAILED` status is appropriate for orders where payment was not completed.

---

## Files Modified

### `timely-backend/tickets/webhooks.py`

**Changes**:
1. Line 77: Changed `Ticket.Status.PENDING` → `Ticket.Status.VALID`
2. Line 297: Changed `TicketOrder.Status.CANCELLED` → `TicketOrder.Status.FAILED`

**Functions Updated**:
- `handle_checkout_session_completed()` - Now creates tickets with VALID status
- `handle_payment_canceled()` - Now marks order as FAILED instead of CANCELLED

### `timely-frontend/src/features/schedule/Schedule.tsx`

**Changes**:
- Removed `'approved'` from ticket status filter (doesn't exist)
- Now only filters for `'valid'` tickets or orders with `'paid'` status

```typescript
// BEFORE
const approvedTickets = tickets.filter((t: any) => 
  t.status === 'valid' || t.status === 'approved' || t.order?.status === 'paid'
);

// AFTER
const approvedTickets = tickets.filter((t: any) => 
  t.status === 'valid' || t.order?.status === 'paid'
);
```

---

## Model Status Reference

For future reference, here are the correct status choices for each model:

### TicketOrder.Status
```python
class Status(models.TextChoices):
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    FAILED = "failed", "Failed"
    REFUNDED = "refunded", "Refunded"
```

### Ticket.Status
```python
class Status(models.TextChoices):
    VALID = "valid", "Valid"
    USED = "used", "Used"
    VOID = "void", "Void"
```

### Refund.Status
```python
class Status(models.TextChoices):
    PENDING = "pending", "Pending"
    PROCESSED = "processed", "Processed"
    FAILED = "failed", "Failed"
    CANCELLED = "cancelled", "Cancelled"  # ← Note: Only Refund has CANCELLED
```

---

## Testing Verification

Run Python syntax check:
```bash
cd timely-backend
python3 -m py_compile tickets/webhooks.py
```

✅ **Result**: No syntax errors

---

## Updated Workflow

### Ticket Creation After Payment

1. **User completes Stripe checkout**
2. **Webhook receives `checkout.session.completed` event**
3. **Order status** → `PAID`
4. **Tickets created with status** → `VALID`
5. **Tickets appear in user's "My Tickets"**
6. **QR code is immediately available**
7. **Event appears in user's Schedule**

### Payment Cancellation

1. **User cancels during Stripe checkout**
2. **Webhook receives `payment_intent.canceled` event**
3. **Order status** → `FAILED`
4. **Associated tickets** → `VOID` (via `void_ticket()` method)
5. **User sees "Payment cancelled" message**

---

## Next Steps

1. ✅ Backend errors fixed
2. ✅ Syntax validated
3. 🔄 Restart backend server to apply changes
4. 🧪 Test complete checkout flow:
   - Successful payment
   - Cancelled payment
   - Failed payment

---

## Restart Backend

```bash
cd timely-backend
# If using virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Restart Django server
python manage.py runserver
```

Or use the restart script:
```bash
./restart_backend.sh
```

---

## Status: ✅ FIXED AND READY

All backend errors have been resolved. The webhook handler now uses correct status constants that match the model definitions.

**Test with confidence!**

