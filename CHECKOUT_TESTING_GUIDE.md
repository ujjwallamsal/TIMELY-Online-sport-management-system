# Checkout Testing Guide

## Quick Test Checklist

### Pre-Test Setup

1. **Start Backend**
   ```bash
   cd timely-backend
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   python manage.py runserver
   ```

2. **Start Frontend**
   ```bash
   cd timely-frontend
   npm run dev
   ```

3. **Create Test Event** (if needed)
   - Login as Organizer
   - Create event with fee (e.g., $10.00 = 1000 cents)

### Test 1: Console Errors Check ✅

**Steps:**
1. Open browser DevTools (F12) → Console tab
2. Navigate to `/events/:id/checkout`
3. **Expected**: Zero console errors
4. Check Network tab → Should see only 1 request to `/api/events/:id/`

**Pass Criteria:**
- ✅ No console errors
- ✅ No console warnings about API calls
- ✅ Only 1 API call visible in Network tab

---

### Test 2: Mock Payment (No Stripe Configured) ✅

**Setup**: Ensure `STRIPE_SECRET_KEY` is not set or is invalid

**Steps:**
1. Go to `/events/:id/checkout`
2. Set quantity to 2
3. Click "Continue to Payment"
4. **Expected**: Immediate success message "Mock Payment Successful"
5. Should redirect to `/tickets/me`
6. Check My Tickets page for 2 new tickets with `TKT-MOCK-*` serials

**Pass Criteria:**
- ✅ No console errors
- ✅ Success message shown
- ✅ Redirected to My Tickets
- ✅ Correct number of tickets created

---

### Test 3: Stripe Checkout Flow ✅

**Setup**: Set valid `STRIPE_SECRET_KEY` in backend `.env`

**Steps:**
1. Go to `/events/:id/checkout`
2. Set quantity to 1
3. Click "Continue to Payment"
4. **Expected**: Redirect to Stripe's hosted checkout page
5. Enter test card: `4242 4242 4242 4242`
6. Expiry: `12/34`, CVC: `123`
7. Click "Pay"
8. **Expected**: Redirect back to `/tickets/success`
9. Check `/tickets/me` for new ticket

**Pass Criteria:**
- ✅ No console errors during flow
- ✅ Successfully redirects to Stripe
- ✅ Successfully completes payment
- ✅ Redirects to success page
- ✅ Ticket appears in My Tickets

---

### Test 4: Quantity Validation ✅

**Steps:**
1. Go to checkout page
2. Try to enter quantity 0 → Should be prevented or auto-correct to 1
3. Try to enter quantity 11 → Should be prevented or auto-correct to 10
4. Try to enter negative number → Should be prevented

**Pass Criteria:**
- ✅ Quantity stays within 1-10 range
- ✅ Error message shows for invalid values
- ✅ No API call made with invalid quantity

---

### Test 5: Error Handling ✅

**Test A: Invalid Event ID**
1. Navigate to `/events/99999/checkout` (non-existent event)
2. **Expected**: "Event Not Found" message with button to browse events
3. No console errors

**Test B: Network Error**
1. Stop backend server
2. Try to checkout
3. **Expected**: User-friendly error message
4. No unhandled promise rejections in console

**Pass Criteria:**
- ✅ Graceful error messages
- ✅ No console errors
- ✅ Can recover (retry button works)

---

### Test 6: Cancel Flow ✅

**Steps:**
1. Start checkout with Stripe
2. On Stripe page, click "Back" or close window
3. **Expected**: Redirect to `/tickets/cancel`
4. Should show cancellation message
5. No console errors

**Pass Criteria:**
- ✅ Cancel page loads correctly
- ✅ Clear message about cancellation
- ✅ "Try Again" button works
- ✅ No console errors

---

### Test 7: Background Queries Check ✅

**Steps:**
1. Open DevTools → Network tab
2. Navigate to checkout page
3. Wait 30 seconds on the page
4. Check Network tab

**Expected:**
- Only initial event fetch
- No polling/refetching
- No badge count queries
- No list endpoint calls

**Pass Criteria:**
- ✅ Zero background queries
- ✅ No refetch on window focus
- ✅ No polling intervals

---

### Test 8: Multiple Tickets ✅

**Steps:**
1. Go to checkout
2. Set quantity to 5
3. Complete payment (mock or Stripe)
4. Check My Tickets page

**Expected:**
- 5 separate tickets created
- Each with unique serial number
- Each with unique QR code

**Pass Criteria:**
- ✅ Correct number of tickets created
- ✅ All tickets have unique serials
- ✅ All tickets are VALID status

---

## Performance Tests

### Page Load Performance
```bash
# Using Lighthouse in Chrome DevTools
1. Open DevTools → Lighthouse tab
2. Select "Performance" category
3. Run audit on checkout page

Expected Scores:
- Performance: ≥90
- Accessibility: ≥90
- Best Practices: ≥90
```

### Network Usage
```bash
# Monitor network calls
1. Open DevTools → Network tab
2. Load checkout page
3. Count API calls

Expected:
- Initial load: 1 call (event details)
- During stay: 0 calls
- After 1 minute: 0 calls
```

---

## API Endpoint Tests

### Manual API Test (Using curl or Postman)

**Valid Checkout Request:**
```bash
curl -X POST http://localhost:8000/api/tickets/checkout/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": 1,
    "quantity": 2,
    "amount": 2000,
    "currency": "USD"
  }'
```

**Expected Response (Mock Mode):**
```json
{
  "sessionId": "mock_session_1",
  "ticket_order_id": 1,
  "tickets": ["TKT-MOCK-ABC12345", "TKT-MOCK-XYZ67890"],
  "mode": "mock"
}
```

**Expected Response (Stripe Mode):**
```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6",
  "ticket_order_id": 1,
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

---

## Automated Test Script

```javascript
// test-checkout.js
describe('Checkout Flow', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password');
  });

  it('should complete checkout with no console errors', () => {
    cy.visit('/events/1/checkout');
    
    // Check for console errors
    cy.window().then((win) => {
      cy.spy(win.console, 'error');
    });
    
    // Select quantity
    cy.get('input[type="number"]').clear().type('2');
    
    // Submit checkout
    cy.contains('Continue to Payment').click();
    
    // Verify no console errors
    cy.window().then((win) => {
      expect(win.console.error).not.to.be.called;
    });
  });

  it('should validate quantity range', () => {
    cy.visit('/events/1/checkout');
    
    // Try invalid quantity
    cy.get('input[type="number"]').clear().type('15');
    
    // Should show error
    cy.contains('Maximum 10 tickets').should('be.visible');
  });
});
```

---

## Regression Tests

After deploying fixes, verify these don't break:

- [ ] Event detail page still works
- [ ] My Tickets page still shows tickets
- [ ] Navigation badges still update (on non-checkout pages)
- [ ] Other payment flows not affected
- [ ] User registration still works
- [ ] Event creation still works

---

## Production Checklist

Before deploying to production:

### Backend
- [ ] `STRIPE_SECRET_KEY` set to live key (starts with `sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` configured
- [ ] `FRONTEND_URL` points to production domain
- [ ] Webhook endpoint verified in Stripe Dashboard
- [ ] Database migrations applied
- [ ] Test with live test mode first

### Frontend
- [ ] `VITE_API_BASE_URL` points to production API
- [ ] Build succeeds without errors
- [ ] No console errors in production build
- [ ] Test all flows on staging first

### Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor webhook delivery success rate
- [ ] Track checkout completion rate
- [ ] Alert on payment failures

---

## Troubleshooting

### Issue: "Payment processing error"
**Solution**: Check backend logs for Stripe error details

### Issue: Checkout redirects to 404
**Solution**: Verify `FRONTEND_URL` in backend settings

### Issue: Webhook not firing
**Solutions**:
1. Check webhook endpoint URL in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` matches
3. Check webhook delivery logs in Stripe Dashboard
4. Ensure endpoint is publicly accessible (use ngrok for local testing)

### Issue: Console errors still appearing
**Solutions**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear React Query cache
3. Check Network tab for failing requests
4. Verify API responses match expected format

---

## Success Metrics

Track these metrics post-deployment:

1. **Checkout Completion Rate**: Should be ≥80%
2. **Console Error Rate**: Should be 0%
3. **API Call Volume**: Should be ~1 call per checkout
4. **Payment Success Rate**: Should match Stripe's success rate
5. **User Abandonment**: Monitor where users drop off

---

## Contact & Support

For issues with:
- **Checkout Flow**: Check this guide first
- **Stripe Integration**: Refer to Stripe docs
- **Backend Errors**: Check Django logs
- **Frontend Errors**: Check browser console

**Status**: ✅ All Tests Passing
**Last Updated**: October 1, 2025

