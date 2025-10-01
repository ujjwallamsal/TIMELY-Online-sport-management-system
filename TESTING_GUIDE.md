# Timely - Testing Guide

## 🧪 Complete Testing Guide for All Roles

This guide provides step-by-step testing instructions for all implemented features across different user roles.

---

## 🚀 Quick Start

### Start the Application

```bash
# Terminal 1: Backend
cd timely-backend
python manage.py runserver

# Terminal 2: Frontend  
cd timely-frontend
npm run dev
```

**Access:** http://localhost:5173

---

## 👥 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@timely.local | admin123 |
| Organizer | organizer@timely.local | org123 |
| Athlete | athlete@timely.local | ath123 |
| Coach | coach@timely.local | coach123 |
| Spectator | spectator@timely.local | spec123 |

---

## ✅ Feature Testing Checklist

### 1. Authentication Features

#### Password Visibility Toggle ✅
1. Go to `/login`
2. Enter any text in password field
3. Click eye icon → password becomes visible
4. Click again → password hidden
5. Go to `/register`
6. Verify eye icons work on both password fields

**Expected:** Toggle works on all password fields

---

#### Login Redirect Flow ✅
1. **Logout** if logged in
2. Visit `/news/1` (or any protected content)
3. Verify redirected to `/login?returnTo=/news/1`
4. Login with any account
5. Verify automatically redirected back to `/news/1`

**Expected:** Seamless redirect after login

---

### 2. Notifications System

#### Unread Count Badge ✅
1. Login as any user
2. Look at bell icon in navbar
3. Verify red badge shows unread count

**Test Backend:**
```bash
# Get token after login from browser dev tools → Application → localStorage → timely_access_token
curl http://127.0.0.1:8000/api/notifications/unread_count/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Returns `{"count": X}`

---

#### Notification Bell Dropdown ✅
1. Login as any user
2. Click bell icon in navbar
3. **Verify:**
   - Dropdown appears
   - Shows last 5 notifications
   - Unread notifications have blue background
   - Time ago shows (e.g., "2 minutes ago")
   - "Mark all read" button visible if unread > 0

4. Click any unread notification
5. **Verify:**
   - Notification turns gray (marked as read)
   - Badge count decreases
   - If notification has link_url, navigates there
   - Dropdown closes

6. Click "Mark all read"
7. **Verify:**
   - All notifications turn gray
   - Badge disappears
   - Dropdown closes

8. Click "View all notifications"
9. **Verify:** Navigates to `/notifications` page

**Expected:** All dropdown interactions work smoothly

---

### 3. Welcome Message ✅

1. **Logout** → Visit homepage
2. **Verify:** Sees "Welcome to Timely"

3. **Login** as spectator@timely.local
4. **Verify:** Sees "Welcome back, Spectator!" (or first name if set)

5. **Login** as other roles
6. **Verify:** Welcome message changes per role

**Expected:** Personalized greeting for authenticated users

---

### 4. Profile Page ✅

#### No Infinite Re-render
1. Login as any user
2. Visit `/profile`
3. Open browser DevTools → Console
4. Open React DevTools if available
5. **Verify:** No continuous re-render messages
6. **Verify:** No performance warnings

**Expected:** Profile loads once, no re-renders

---

#### Profile Update
1. On profile page, click "Edit Profile"
2. Change first name to "TestUser"
3. Click "Save"
4. **Verify:**
   - Success toast appears
   - New name shows in profile
   - New name shows in navbar
   - Notification created

**Expected:** Profile updates successfully

---

### 5. Gallery Features ✅

#### Upload Media
1. Login as any user
2. Go to `/gallery`
3. Click "My Gallery" tab
4. Click "Upload" button
5. **Fill form:**
   - Select an image file (JPG/PNG)
   - Title: "Test Image"
   - Description: "Testing upload"
   - Visibility: Select "Private"
6. Click "Upload"

**Verify:**
- Success toast appears
- Notification created
- Image appears in "My Gallery"
- Image does NOT appear in "All Media (Public)"

7. Upload another image with visibility "Public"
8. **Verify:** Appears in both "My Gallery" and "All Media (Public)"

**Backend Test:**
```bash
curl -X POST http://127.0.0.1:8000/api/gallery/media/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.jpg" \
  -F "title=Test Upload" \
  -F "description=Testing" \
  -F "is_public=true" \
  -F "visibility=public"
```

**Expected:** Upload works, visibility control works

---

### 6. News Login Gating ✅

1. **Logout**
2. Visit any news article (e.g., `/news/1`)
3. **Verify:**
   - See only excerpt
   - See "Sign in to Continue" button
   - Full article hidden

4. Click "Sign in to Continue"
5. **Verify:** Redirected to `/login?returnTo=/news/1`

6. Login with any account
7. **Verify:**
   - Redirected back to article
   - Full article now visible

**Expected:** Login gating works, redirect preserves destination

---

### 7. Tickets - Free Event Flow ✅

#### Setup (Organizer)
1. Login as `organizer@timely.local`
2. Create new event with:
   - Name: "Free Community Run"
   - Fee: Leave as 0 or set to 0
   - Other required fields
3. Save event
4. Note the event ID

#### Test (Spectator)
1. Login as `spectator@timely.local`
2. Go to Events → Find "Free Community Run"
3. Click event → Click "Get Ticket"
4. **Verify:**
   - No Stripe checkout
   - Success message appears immediately
   - Notification created
   - Redirected to "My Tickets"
   - Ticket shows in "My Tickets" with QR code

**Backend Test:**
```bash
# Run: ./test_free_ticket.sh
# Or manually:
curl -X POST http://127.0.0.1:8000/api/tickets/free/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_id": 1}'
```

**Expected Response:**
```json
{
  "success": true,
  "ticket_order_id": 123,
  "ticket_id": 456,
  "serial": "TKT-FREE-ABC12345",
  "event_name": "Free Community Run",
  "message": "Free ticket issued successfully"
}
```

**Expected:** Instant free ticket creation

---

### 8. Tickets - Paid Event Flow (Partial)

1. Login as `organizer@timely.local`
2. Create event with fee_cents > 0 (e.g., 1000 = $10.00)
3. Login as `spectator@timely.local`
4. Click "Get Ticket" on paid event

**Current State:** May show Stripe error due to payload mismatch

**To Fix:** See FINAL_DELIVERABLES.md section on Paid Ticket Stripe Flow

---

## 🔍 Backend Endpoint Testing

### Test All Key Endpoints

```bash
# Get your token from browser DevTools after login
TOKEN="your_jwt_token_here"

# 1. Unread count
curl http://127.0.0.1:8000/api/notifications/unread_count/ \
  -H "Authorization: Bearer $TOKEN"

# 2. Recent notifications
curl http://127.0.0.1:8000/api/notifications/?page_size=5 \
  -H "Authorization: Bearer $TOKEN"

# 3. Mark notification read
curl -X PATCH http://127.0.0.1:8000/api/notifications/1/mark_read/ \
  -H "Authorization: Bearer $TOKEN"

# 4. Mark all read
curl -X POST http://127.0.0.1:8000/api/notifications/mark_all_read/ \
  -H "Authorization: Bearer $TOKEN"

# 5. Free ticket
curl -X POST http://127.0.0.1:8000/api/tickets/free/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_id": 1}'

# 6. Upload to gallery
curl -X POST http://127.0.0.1:8000/api/gallery/media/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@image.jpg" \
  -F "title=Test" \
  -F "visibility=public"

# 7. User profile
curl http://127.0.0.1:8000/api/me/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Common Issues & Fixes

### Issue: 404 on notifications/unread-count/
**Fix:** Ensure using underscore: `/api/notifications/unread_count/`

### Issue: Gallery upload returns 405
**Fix:** Ensure multipart/form-data header and correct field names

### Issue: Profile re-renders infinitely
**Fix:** Already fixed - if still occurs, clear browser cache

### Issue: Free ticket returns 400 "Not a free event"
**Fix:** Ensure event.fee_cents is exactly 0 in database

### Issue: Login doesn't redirect back
**Fix:** Ensure using `returnTo` query param, not `next`

---

## 📊 Feature Completion Status

| Feature | Status | Notes |
|---------|--------|-------|
| Password toggle | ✅ | Fully working |
| Login redirect | ✅ | Fully working |
| Unread count | ✅ | Fixed endpoint |
| Notification dropdown | ✅ | Full functionality |
| Welcome message | ✅ | Personalized |
| Profile fix | ✅ | No re-renders |
| Gallery upload | ✅ | With visibility |
| News gating | ✅ | With redirect |
| Free tickets | ✅ | Backend + frontend |
| Paid tickets | 🚧 | Needs payload fix |
| Change password | 🚧 | UI ready, endpoint TBD |
| SSE error handling | 🚧 | Polling works |

---

## 🎯 Next Steps

1. **Test paid ticket flow** after fixing payload mismatch
2. **Verify change password endpoint** exists
3. **Test SSE error handling** with intentional failures
4. **Remove any floating footer icons**
5. **Test all roles end-to-end**

---

## 📝 Test Results Template

```
Date: _________
Tester: _________
Role: _________

[ ] Password toggle works
[ ] Login redirect works
[ ] Notification badge shows count
[ ] Notification dropdown works
[ ] Mark as read works
[ ] Welcome message personalized
[ ] Profile loads without errors
[ ] Gallery upload works
[ ] News gating works
[ ] Free ticket works
[ ] Paid ticket works (if available)

Issues Found:
1. _________________
2. _________________

Notes:
_____________________
```

---

**Last Updated:** October 1, 2025  
**Version:** 1.0

