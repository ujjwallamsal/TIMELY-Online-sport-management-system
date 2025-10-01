# Stripe Integration - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Create Environment Files

**Backend** - Create `timely-backend/.env`:
```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost/dbname

# Stripe Keys - Get from your Stripe Dashboard
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**Frontend** - Create `timely-frontend/.env`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY
```

> ⚠️ **Get actual Stripe keys from your project documentation** (not stored in git for security).

### 2. Database Migrations (Already Applied ✅)

The migrations have been applied. If you need to reapply:

```bash
cd timely-backend
source venv/bin/activate
python manage.py migrate tickets
```

### 3. Start Stripe Webhook Forwarding (Development Only)

Open a **new terminal** and run:

```bash
# Install Stripe CLI first (one time only)
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to your local backend
stripe listen --forward-to http://127.0.0.1:8000/api/stripe/webhook/
```

**Copy the webhook secret** (starts with `whsec_...`) and paste it into your `timely-backend/.env` as `STRIPE_WEBHOOK_SECRET`.

**Keep this terminal running** while testing!

### 4. Start the Backend

```bash
cd timely-backend
source venv/bin/activate
python manage.py runserver
```

### 5. Start the Frontend

```bash
cd timely-frontend
npm run dev
```

## ✅ Test the Flow (2 minutes)

### Test Card Numbers
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future expiry date, any CVC

### Test Steps

1. **Login** as a Spectator/Athlete
2. **Browse Events** at http://localhost:5173/events
3. **Click "Get Ticket"** on a paid event
4. **Enter quantity** (1-10)
5. **Click "Proceed to Checkout"**
6. **Use test card** `4242 4242 4242 4242`
7. **Complete payment** in Stripe Checkout
8. **Redirected to success page** ✓
9. **Check My Tickets** - should show "Pending Approval" badge
10. **Admin approves** in Django Admin at http://127.0.0.1:8000/admin
11. **Check My Tickets again** - should show "Approved" with QR code available

### Test Free Events

1. **Click "Get Ticket"** on a free event (fee_cents = 0)
2. **Immediately redirected** to "Submitted for approval"
3. **Check My Tickets** - shows "Pending Approval"
4. **Admin approves** → Shows "Approved"

## 📁 Key Files Changed

### Backend
- `tickets/models.py` - Added approval workflow fields
- `tickets/views_checkout.py` - Real Stripe checkout endpoint (NEW)
- `tickets/views_webhook.py` - Webhook handler (NEW)
- `tickets/urls.py` - Updated routes
- `api/urls.py` - Added webhook route

### Frontend
- `features/tickets/Checkout.tsx` - Real Stripe integration
- `features/tickets/CheckoutSuccess.tsx` - Success page (NEW)
- `features/tickets/CheckoutCancel.tsx` - Cancel page (NEW)
- `features/tickets/MyTickets.tsx` - Shows approval status
- `app/routes.tsx` - Added new routes

## 🔍 Troubleshooting

### Webhook not firing?
- Check Stripe CLI is running: `stripe listen --forward-to ...`
- Check webhook secret is in backend `.env`
- Check Django logs for errors

### Payment succeeds but order not updated?
- Check webhook logs in Stripe CLI terminal
- Check Django console for webhook processing errors
- Verify `client_reference_id` is being set

### QR code not showing?
- Ticket must be in `approved` or `valid` status
- Check admin approved the ticket
- Check `qr_payload` field is populated

### TypeScript errors?
- Run `npm install` in frontend
- Restart VS Code / IDE
- Check all imports are correct

## 📊 Admin Approval Process

1. Go to http://127.0.0.1:8000/admin
2. Navigate to **Tickets > Ticket Orders**
3. Click on an order with status "Paid"
4. Scroll to **Tickets** section (inline)
5. Change ticket status from "Pending Approval" to "Approved"
6. Click **Save**
7. User receives notification automatically

## 🎯 What's Next?

- [ ] Implement QR code generation (currently placeholder)
- [ ] Add PDF ticket download
- [ ] Add email notifications
- [ ] Implement refund flow
- [ ] Add analytics dashboard

## 📚 Full Documentation

See `STRIPE_INTEGRATION_README.md` for complete documentation including:
- Detailed payment flow
- API endpoint specifications
- Database schema changes
- Production deployment guide
- Security considerations

## 💡 Tips

- **Use test mode** during development (test keys start with `pk_test_` and `sk_test_`)
- **Keep Stripe CLI running** to receive webhooks locally
- **Check Django logs** for webhook processing details
- **Use Django Admin** for all approval workflows
- **Notifications** are created automatically on payment and approval

## 🔐 Security Reminder

- ✅ Environment files are gitignored
- ✅ Never commit Stripe keys
- ✅ Webhook signatures are verified
- ✅ Use HTTPS in production
- ✅ Rotate keys if compromised

---

**Ready to test!** Start with step 3 (Stripe CLI) and work through the test flow above. 🚀

