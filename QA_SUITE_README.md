# Pre-Launch QA Suite - Quick Start Guide

Welcome to the TIMELY Pre-Launch QA Suite. This guide will help you systematically verify all critical functionality before going live.

---

## 📚 What's Included

1. **PRE_LAUNCH_QA_SUITE.md** (15,000+ words)
   - Comprehensive test cases for P0, P1, P2 priorities
   - Step-by-step verification procedures
   - Evidence collection requirements
   - 92+ test cases covering all critical flows

2. **CRITICAL_FIXES_REQUIRED.md**
   - 6 HIGH priority fixes (blocking launch)
   - 3 MEDIUM priority fixes (fix before scaling)
   - 3 LOW priority recommendations
   - Code examples and implementation guidance

3. **QUICK_LAUNCH_CHECKLIST.md** (1 page)
   - Printable checklist
   - Quick verification of all critical items
   - Sign-off section for stakeholders

4. **run_qa_tests.sh**
   - Automated test script
   - Runs P0, P1, P2 tests
   - Generates evidence artifacts

---

## 🚀 Quick Start (30-Minute Overview)

### Step 1: Review Critical Fixes (10 minutes)
```bash
open CRITICAL_FIXES_REQUIRED.md
```

**Action Items**:
- Review the 6 HIGH priority fixes
- Assess which are already implemented
- Plan fix timeline (all HIGH fixes must be done before launch)

### Step 2: Run Automated Tests (10 minutes)
```bash
./run_qa_tests.sh all
```

This will:
- Start Django and Vite dev servers
- Run automated tests for auth, database, webhooks, security
- Generate evidence artifacts in `qa_evidence/` folder

### Step 3: Manual Verification (10 minutes)
```bash
open QUICK_LAUNCH_CHECKLIST.md
```

Print this and manually verify:
- Complete one full ticket purchase
- Test role-based access control
- Upload a file and verify security
- Check notification delivery

---

## 📋 Full Testing Workflow (2-3 Days)

### Day 1: P0 Testing & Critical Fixes

**Morning (4 hours)**:
1. Read `PRE_LAUNCH_QA_SUITE.md` sections 1-8 (P0 tests)
2. Fix any HIGH priority issues from `CRITICAL_FIXES_REQUIRED.md`
3. Set up test environment:
   ```bash
   # Backend
   cd timely-backend
   python manage.py migrate
   python manage.py createsuperuser
   
   # Frontend
   cd timely-frontend
   npm install
   
   # Stripe CLI
   stripe login
   stripe listen --forward-to localhost:8000/api/payments/webhooks/stripe/
   ```

**Afternoon (4 hours)**:
4. Run automated tests:
   ```bash
   ./run_qa_tests.sh p0
   ```
5. Manual P0 testing:
   - Stripe end-to-end (section 1.1-1.5)
   - Auth & permissions (section 2)
   - Data integrity (section 3)
6. Collect evidence (screenshots, videos, logs)
7. Document any issues found

### Day 2: P1 & P2 Testing

**Morning (4 hours)**:
1. Fix any MEDIUM priority issues
2. Run P1 tests:
   ```bash
   ./run_qa_tests.sh p1
   ```
3. Manual P1 verification:
   - Security headers
   - Rate limiting
   - Accessibility audit (Lighthouse)
   - Performance testing

**Afternoon (4 hours)**:
4. Run P2 tests:
   ```bash
   ./run_qa_tests.sh p2
   ```
5. Mobile responsiveness testing
6. Search and filter functionality
7. Admin workflows

### Day 3: Edge Cases & Final Verification

**Morning (3 hours)**:
1. Edge case testing:
   - Concurrent ticket purchases (race conditions)
   - 3DS card flows
   - Network flakiness (slow 3G, offline)
   - Long sessions (token refresh)
2. Browser compatibility:
   - Chrome, Firefox, Safari
   - Mobile browsers (iOS Safari, Chrome Android)

**Afternoon (2 hours)**:
3. Reconciliation:
   - Stripe Dashboard totals vs Database totals
   - Verify all webhooks processed correctly
4. Final checklist review:
   ```bash
   open QUICK_LAUNCH_CHECKLIST.md
   ```
5. Stakeholder sign-off

---

## 🔍 Test Environment Setup

### Prerequisites

```bash
# Check versions
python --version  # Should be 3.9+
node --version    # Should be 18+
stripe --version  # Stripe CLI

# Backend setup
cd timely-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend setup
cd timely-frontend
npm install
```

### Environment Variables

Create `.env` files:

**Backend** (`timely-backend/.env`):
```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost/timely_test
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`timely-frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Test Data

```bash
# Create test users
cd timely-backend
python manage.py shell < create_test_users.py

# This creates:
# - admin@example.com (ADMIN role)
# - organizer@example.com (ORGANIZER role)
# - athlete@example.com (ATHLETE role)
# - fan@example.com (FAN role)
# All passwords: testpass123
```

---

## 📸 Evidence Collection Guide

### What to Capture

For each P0 test:
1. **Screenshots**: Before/after states, error messages, database queries
2. **Video**: Complete flows (30-60s each)
3. **Logs**: Server logs, webhook events, API responses
4. **Reports**: Reconciliation spreadsheets, Lighthouse reports

### Folder Structure

```
qa_evidence/
├── P0_stripe/
│   ├── 01_successful_checkout.mp4
│   ├── 02_webhook_log.png
│   ├── 03_database_record.png
│   └── reconciliation_2025-10-01.csv
├── P0_auth/
│   ├── route_guard_matrix.xlsx
│   └── role_approval_flow.mp4
├── P0_data_integrity/
│   └── concurrent_purchase.mp4
├── P0_files/
│   ├── valid_upload.png
│   └── malicious_file_blocked.png
├── P0_notifications/
│   └── realtime_delivery.mp4
├── P0_profile/
│   └── avatar_propagation.mp4
└── P0_reliability/
    └── slow_3g_test.mp4
```

### Tools for Evidence Collection

**Screenshots**: 
- macOS: Cmd+Shift+4
- Windows: Snipping Tool
- Browser: DevTools → Capture screenshot

**Screen Recording**:
- macOS: QuickTime Player → New Screen Recording
- Windows: Xbox Game Bar (Win+G)
- Browser: Chrome DevTools → Performance → Record

**Database Queries**:
```bash
# Connect to database
psql timely_db

# Example queries
SELECT * FROM tickets_ticketorder WHERE id = 123;
SELECT COUNT(*), SUM(total_cents) FROM tickets_ticketorder WHERE status='paid';
```

---

## 🚨 Critical Test Scenarios

### Must-Test Scenarios (Cannot Skip)

1. **Stripe Payment Success**
   - Buy ticket with test card 4242 4242 4242 4242
   - Verify order created, ticket issued, webhook processed

2. **Concurrent Ticket Purchase**
   - Event with 2 tickets remaining
   - 3 users checkout simultaneously
   - Only 2 succeed, 1 gets "Sold Out"

3. **Route Guard Enforcement**
   - FAN user tries to access `/admin/users`
   - Should see 403 or "Access Denied" page

4. **File Upload Security**
   - Upload 15MB file → Rejected with error
   - Upload renamed .exe → Detected and blocked

5. **Registration Status Validation**
   - Try API: PATCH /registrations/X/ {"status": "APPROVED"}
   - Should fail 403 (only admin can approve)

6. **Real-Time Notifications**
   - Admin sends announcement
   - User receives notification within 2 seconds (no refresh)

7. **Token Refresh**
   - Stay logged in for 30 minutes
   - Make API call → Should auto-refresh token

8. **Reconciliation**
   - Complete 10 test purchases
   - Stripe Dashboard total = Database total (exact match)

---

## 🐛 Common Issues & Solutions

### Issue 1: Stripe Webhooks Not Received

**Symptoms**: Payment succeeds but order status stays PENDING

**Solution**:
```bash
# Check Stripe CLI is running
stripe listen --forward-to localhost:8000/api/payments/webhooks/stripe/

# Check webhook secret in .env matches Stripe CLI output
echo $STRIPE_WEBHOOK_SECRET

# Check Django logs
tail -f /tmp/django.log | grep webhook
```

### Issue 2: CORS Errors

**Symptoms**: Frontend can't call backend API

**Solution**:
```python
# timely-backend/timely/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
]
```

### Issue 3: Database Locked (SQLite)

**Symptoms**: "Database is locked" error during concurrent tests

**Solution**:
- Use PostgreSQL for testing (required for production)
- SQLite doesn't support proper concurrent access

### Issue 4: Rate Limiting Too Aggressive

**Symptoms**: Getting 429 errors during legitimate testing

**Solution**:
```python
# Temporarily increase limits for testing
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'anon': '1000/hour',  # Increased for testing
        'user': '10000/hour',
    }
}
```

---

## 📊 Test Results Template

Use this template to document test results:

```markdown
# QA Test Results - [Date]

## Environment
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- Database: PostgreSQL 14
- Stripe Mode: Test

## P0 Tests

### 1. Stripe End-to-End
- ✅ Payment success flow
- ✅ Webhook processing
- ⚠️ Idempotency keys not implemented (see CRITICAL_FIXES #1)
- ✅ 3DS flow
- ✅ Failed card handling
- ✅ Reconciliation matched

### 2. Auth & Permissions
- ✅ Route guards enforced
- ✅ Role application flow
- ✅ Token refresh
- ✅ Cross-tab logout

### 3. Data Integrity
- ⚠️ Race condition in ticket capacity (see CRITICAL_FIXES #2)
- ✅ Registration status validation
- ✅ Transaction rollback

### 4. File Handling
- ✅ Size limits enforced
- ✅ Type validation
- ❌ EXIF stripping not implemented (see CRITICAL_FIXES #3)
- ⚠️ Private URLs accessible in DEBUG mode (see CRITICAL_FIXES #4)

... (continue for all sections)

## Issues Found

| ID | Severity | Description | Status | Fix ETA |
|----|----------|-------------|--------|---------|
| 1  | HIGH     | No idempotency keys | Open | Oct 2 |
| 2  | HIGH     | Race condition | Open | Oct 2 |
| 3  | HIGH     | EXIF not stripped | Open | Oct 3 |
| 4  | MEDIUM   | Private files | Open | Oct 3 |

## Sign-Off

- [ ] All P0 tests passed or have fix plan
- [ ] All HIGH priority fixes scheduled
- [ ] Evidence collected and archived
- [ ] Ready for staging deployment

**Tested By**: [Your Name]
**Date**: October 1, 2025
**Next Review**: After fixes implemented
```

---

## 🔄 Continuous Testing (Post-Launch)

After launch, establish regular testing cadence:

### Daily Checks
- [ ] Stripe reconciliation (Dashboard vs Database)
- [ ] Error logs review (Sentry/logs)
- [ ] Uptime monitoring (99.9% target)

### Weekly Checks
- [ ] P0 smoke tests (10 critical flows)
- [ ] Database backup verification
- [ ] Security scan (OWASP ZAP or similar)

### Monthly Checks
- [ ] Full P0 regression test suite
- [ ] Performance audit (Lighthouse)
- [ ] Dependency updates (npm audit, pip check)

### Quarterly Checks
- [ ] Full P0+P1 test suite
- [ ] Penetration testing
- [ ] Disaster recovery drill
- [ ] Capacity planning review

---

## 📞 Support & Resources

### Documentation
- [PRE_LAUNCH_QA_SUITE.md](./PRE_LAUNCH_QA_SUITE.md) - Full test suite
- [CRITICAL_FIXES_REQUIRED.md](./CRITICAL_FIXES_REQUIRED.md) - Fix guide
- [QUICK_LAUNCH_CHECKLIST.md](./QUICK_LAUNCH_CHECKLIST.md) - Quick reference

### External Resources
- [Stripe Testing](https://stripe.com/docs/testing)
- [Django Testing](https://docs.djangoproject.com/en/4.2/topics/testing/)
- [React Testing](https://react.dev/learn/testing)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Test Cards
```
Success: 4242 4242 4242 4242
3DS: 4000 0027 6000 3184
Declined: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
Expired: 4000 0000 0000 0069
```

---

## ✅ Launch Readiness Criteria

Before launching to production:

1. **All HIGH Priority Fixes Complete**
   - ✅ Idempotency keys implemented
   - ✅ Race condition fixed
   - ✅ EXIF stripping working
   - ✅ Private files secured
   - ✅ Rate limiting active
   - ✅ Notification endpoint verified

2. **P0 Tests 100% Pass Rate**
   - All 92 P0 test cases passed
   - Evidence collected for each
   - No blocking issues

3. **Reconciliation Verified**
   - Stripe Dashboard = Database (exact match)
   - All webhooks processed correctly
   - No orphaned orders

4. **Security Verified**
   - CORS configured
   - CSRF enabled
   - Secrets in environment variables
   - Rate limiting tested
   - Cookie flags secure

5. **Stakeholder Sign-Off**
   - Tech Lead reviewed code
   - QA Lead verified tests
   - Product Manager approved

**Only then**: Deploy to production 🚀

---

## 🎯 Success Metrics

Track these KPIs post-launch:

- **Checkout Success Rate**: >95% (target)
- **Payment Processing Time**: <3 seconds (p95)
- **Webhook Processing**: <5 seconds (p95)
- **API Error Rate**: <0.1%
- **Page Load Time**: <2.5s LCP (mobile)
- **Uptime**: 99.9%

---

**Good luck with your launch! 🚀**

Remember: Quality over speed. Better to delay launch and get it right than to launch broken.

