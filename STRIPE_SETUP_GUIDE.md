# Stripe Integration Setup Guide

This guide explains how to properly configure Stripe for both test and live environments in the TIMELY sports management system.

## Overview

The system uses Stripe for payment processing with the following architecture:
- **Frontend**: Uses Stripe.js with publishable key (`pk_...`) for client-side operations
- **Backend**: Uses Stripe secret key (`sk_...`) for server-side operations like creating checkout sessions
- **Environment Variables**: All keys are stored in environment variables for security

## Frontend Configuration

### 1. Environment Variables

Create a `.env` file in the `timely-frontend/` directory:

```bash
# API Configuration
VITE_API_BASE_URL=http://127.0.0.1:8000/api

# Stripe Configuration
# For TEST mode (development):
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# For LIVE mode (production):
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 2. Key Validation

The frontend now includes validation to ensure:
- The publishable key is configured
- The key format is correct (starts with `pk_`)
- Clear error messages if configuration is missing

### 3. Stripe Initialization

The frontend properly initializes Stripe with:
```typescript
const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
```

## Backend Configuration

### 1. Environment Variables

Set these environment variables for the Django backend:

```bash
# For TEST mode (development):
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# For LIVE mode (production):
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Automatic Mode Detection

The backend automatically detects the environment:
- If Stripe keys are properly configured → Uses real Stripe API
- If keys are missing/invalid → Falls back to mock mode for development

### 3. Session Creation Flow

1. Frontend calls `POST /api/tickets/checkout/` with payment details
2. Backend creates a `TicketOrder` record in `PENDING` status
3. Backend creates Stripe checkout session using secret key
4. Backend returns `sessionId` to frontend
5. Frontend redirects to Stripe Checkout using `stripe.redirectToCheckout()`

## Key Security Principles

### ✅ Correct Implementation

**Frontend (publishable key only):**
```typescript
// ✅ GOOD: Only uses publishable key
const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
await stripe.redirectToCheckout({ sessionId: sessionId });
```

**Backend (secret key only):**
```python
# ✅ GOOD: Only uses secret key for session creation
stripe.api_key = settings.STRIPE_SECRET_KEY
session = stripe.checkout.Session.create(...)
```

### ❌ Security Violations

```typescript
// ❌ BAD: Never use secret key in frontend
const stripe = await loadStripe('sk_live_...');

// ❌ BAD: Never hardcode keys
const stripe = await loadStripe('pk_live_51RlSLk04uHP1v9oT8qmHezo6k1tMC7OUfldYJWfepczOwYD83wN4EdMjfDkzWNH4j5uqUinlhZF3BEVZsAvqZK4B00WelakbQd');
```

## Environment Setup

### Development (Test Mode)

1. **Get test keys from Stripe Dashboard:**
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy the publishable key (`pk_test_...`)
   - Copy the secret key (`sk_test_...`)

2. **Set frontend environment:**
   ```bash
   cd timely-frontend
   echo "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_..." >> .env
   ```

3. **Set backend environment:**
   ```bash
   export STRIPE_SECRET_KEY="sk_test_..."
   export STRIPE_PUBLISHABLE_KEY="pk_test_..."
   ```

4. **Restart servers:**
   ```bash
   # Restart frontend dev server
   npm run dev
   
   # Restart Django server
   python manage.py runserver
   ```

### Production (Live Mode)

1. **Get live keys from Stripe Dashboard:**
   - Go to https://dashboard.stripe.com/apikeys
   - Copy the publishable key (`pk_live_...`)
   - Copy the secret key (`sk_live_...`)

2. **Set production environment variables:**
   ```bash
   export STRIPE_SECRET_KEY="sk_live_..."
   export STRIPE_PUBLISHABLE_KEY="pk_live_..."
   export VITE_STRIPE_PUBLISHABLE_KEY="pk_live_..."
   ```

## Testing the Integration

### 1. Verify Frontend Configuration

Check browser console for errors:
- ✅ "Stripe loaded successfully"
- ❌ "Stripe publishable key is not configured"

### 2. Test Checkout Flow

1. Navigate to an event with tickets
2. Click "Purchase Tickets"
3. Fill in payment details
4. Submit payment

**Expected behavior:**
- ✅ Redirects to Stripe Checkout page
- ✅ Can complete test payment with test card numbers
- ❌ Shows error if keys are misconfigured

### 3. Test Card Numbers (Test Mode Only)

```
Visa: 4242424242424242
Visa (debit): 4000056655665556
Mastercard: 5555555555554444
American Express: 378282246310005
Declined: 4000000000000002
```

## Troubleshooting

### Common Issues

1. **"Stripe publishable key is not configured"**
   - Check `.env` file exists in `timely-frontend/`
   - Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set
   - Restart frontend dev server

2. **"Invalid Stripe publishable key format"**
   - Ensure key starts with `pk_`
   - Check for typos in the key

3. **Backend falls back to mock mode**
   - Verify `STRIPE_SECRET_KEY` environment variable is set
   - Check Django logs for Stripe configuration messages

4. **Checkout session creation fails**
   - Verify secret key has correct permissions
   - Check Stripe Dashboard for API errors
   - Ensure webhook endpoints are configured

### Debug Commands

```bash
# Check environment variables
echo $STRIPE_SECRET_KEY
echo $VITE_STRIPE_PUBLISHABLE_KEY

# Test Stripe connection (backend)
python manage.py shell
>>> import stripe
>>> stripe.api_key = settings.STRIPE_SECRET_KEY
>>> stripe.Customer.list(limit=1)
```

## Production Deployment

### Environment Variables

Set these in your production environment:

```bash
# Production Stripe Keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend Build
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Webhook Configuration

1. Set webhook endpoint in Stripe Dashboard:
   ```
   https://yourdomain.com/api/tickets/webhook/
   ```

2. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

3. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### Security Checklist

- [ ] Never commit live keys to version control
- [ ] Use environment variables for all keys
- [ ] Enable HTTPS in production
- [ ] Configure webhook endpoints
- [ ] Test with real cards in test mode first
- [ ] Monitor Stripe Dashboard for errors

## Support

For Stripe-specific issues:
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com/

For application-specific issues:
- Check Django logs: `python manage.py runserver`
- Check browser console for frontend errors
- Verify environment variables are loaded correctly
