# Quick Pre-Launch Checklist

Print this page and check off each item as you verify it.

---

## 🔴 P0 - MUST PASS (Blocking Launch)

### Stripe End-to-End
- [ ] Successful payment creates order + ticket
- [ ] Webhook `payment_intent.succeeded` processed
- [ ] Webhook `payment_intent.payment_failed` handled
- [ ] Webhook `charge.refunded` processed
- [ ] Idempotency: Restarting checkout doesn't duplicate orders
- [ ] 3DS card (4000 0027 6000 3184) completes successfully
- [ ] Declined card (4000 0000 0000 0002) shows error message
- [ ] Stripe Dashboard totals = Database totals (reconciliation)
- [ ] Free event (fee=0) bypasses Stripe
- [ ] Quantity > 1 creates correct number of tickets

### Auth & Permissions
- [ ] Anonymous user can't access `/tickets/me` (redirects to login)
- [ ] FAN can't access `/admin/users` (403 Forbidden)
- [ ] Direct API call to admin endpoint returns 403
- [ ] Role application doesn't directly change user.role
- [ ] Admin approval updates role correctly
- [ ] Token refresh works on long session
- [ ] Logout in one tab logs out all tabs

### Data Integrity
- [ ] Concurrent ticket purchase enforces capacity (race condition test)
- [ ] Registration status transitions validated (can't jump PENDING→APPROVED via API)
- [ ] All ticket purchase updates: order, tickets, capacity, notifications
- [ ] Database transactions rollback on error

### File Handling
- [ ] Valid image (5MB) uploads successfully
- [ ] Oversized file (15MB) rejected with clear error
- [ ] Renamed .exe file detected and rejected
- [ ] EXIF data stripped from photos
- [ ] Private document URL inaccessible when logged out
- [ ] Public gallery image accessible without auth

### Notifications
- [ ] Clicking notification navigates to correct page
- [ ] Notification marked as read after click
- [ ] Unread badge count accurate
- [ ] WebSocket delivers notification in real-time (< 2 seconds)
- [ ] Polling fallback works if WebSocket fails

### Profile & Settings
- [ ] Profile page loads without infinite loop
- [ ] Avatar update propagates to navbar/notifications immediately
- [ ] Email validation errors clear and helpful

### Results, Venues, Fixtures
- [ ] Organizer edit reflects on public page without refresh
- [ ] Non-organizer can't edit event (403 from API)
- [ ] Event times display correctly in viewer's timezone

### Reliability
- [ ] Zero console errors on main pages
- [ ] 404 pages show friendly UI (not blank screen)
- [ ] Slow 3G: Loading skeletons appear, eventually loads
- [ ] Failed API request shows "Try Again" button

---

## 🟡 P1 - STRONGLY RECOMMENDED

### Security & Privacy
- [ ] CORS configured (only allowed origins)
- [ ] CSRF protection enabled for session auth
- [ ] Cookies have Secure, HttpOnly, SameSite flags
- [ ] SECRET_KEY and STRIPE_SECRET_KEY in env (not hardcoded)
- [ ] Rate limiting active (429 after repeated failed logins)

### Observability
- [ ] Server logs include request IDs
- [ ] PII redacted in logs (no full card numbers, passwords)
- [ ] Error tracking configured (Sentry or similar)

### Accessibility
- [ ] Keyboard-only navigation works (Tab, Enter, Escape)
- [ ] Focus visible on all interactive elements
- [ ] Screen reader announces buttons/forms correctly
- [ ] Color contrast passes WCAG AA (4.5:1 for normal text)

### Performance
- [ ] Lighthouse Performance score > 80 (mobile)
- [ ] LCP < 2.5 seconds
- [ ] Images lazy-loaded and responsive
- [ ] Static assets cached (Cache-Control headers)

### Email/SMS
- [ ] Order confirmation email sent and received
- [ ] Email displays correctly on mobile
- [ ] Deep links in email navigate to correct page

---

## 🟢 P2 - OPERATIONAL CHECKS

### Admin Workflows
- [ ] Audit log records who approved what and when
- [ ] Soft delete and restore works
- [ ] Database migration rollback tested

### Search & Filters
- [ ] Event search returns correct results
- [ ] Filters (sport, date, location) work
- [ ] Pagination functional
- [ ] Empty state shows friendly message

### Mobile Responsiveness
- [ ] Tested on iPhone SE (375px width)
- [ ] No horizontal scroll
- [ ] Touch targets ≥ 44x44px
- [ ] Toast doesn't cover CTA buttons

---

## 🚨 Critical Fixes Status

- [ ] **Fix 1**: Idempotency keys added to Stripe checkout
- [ ] **Fix 2**: Database locking for ticket capacity (race condition fixed)
- [ ] **Fix 3**: EXIF metadata stripping implemented
- [ ] **Fix 4**: Private file URLs secured
- [ ] **Fix 5**: Rate limiting on auth/checkout endpoints
- [ ] **Fix 6**: Notification endpoint path verified

---

## 📸 Evidence Collected

- [ ] Stripe webhook logs (screenshot)
- [ ] Reconciliation report (Stripe vs DB)
- [ ] Route guard matrix (table/spreadsheet)
- [ ] Concurrent purchase video (race condition)
- [ ] File upload security tests (screenshots)
- [ ] Real-time notification delivery (video)
- [ ] Lighthouse reports (accessibility, performance)

---

## ✅ Final Sign-Off

**Tested By**: ________________________  
**Date**: __________  
**Environment**: [ ] Staging  [ ] Production  

**All P0 tests passed**: [ ] YES  [ ] NO  
**Critical fixes implemented**: [ ] YES  [ ] NO  

**Ready for launch**: [ ] YES  [ ] NO  

**Notes**:
_____________________________________________
_____________________________________________
_____________________________________________

---

## 🔗 Quick Links

- Full Test Suite: `PRE_LAUNCH_QA_SUITE.md`
- Critical Fixes: `CRITICAL_FIXES_REQUIRED.md`
- Run Automated Tests: `./run_qa_tests.sh`
- Evidence Folder: `qa_evidence/`

