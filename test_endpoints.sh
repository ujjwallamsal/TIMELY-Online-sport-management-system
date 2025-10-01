#!/bin/bash

echo "=== Testing Critical Endpoints ==="
echo ""

# Test 1: Health check
echo "1. Health Check:"
curl -s http://localhost:8000/api/health/ | jq -r '.ok // "FAILED"'
echo ""

# Test 2: Login to get token
echo "2. Login Test:"
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"spectator@timely.local","password":"spec123"}' | jq -r '.access // empty')

if [ -n "$TOKEN" ]; then
  echo "✓ Login successful"
else
  echo "✗ Login failed"
fi
echo ""

# Test 3: Notifications unread count
echo "3. Notifications Unread Count:"
if [ -n "$TOKEN" ]; then
  curl -s http://localhost:8000/api/notifications/unread-count/ \
    -H "Authorization: Bearer $TOKEN" | jq -r 'if .count != null then "✓ Unread count: \(.count)" else "✗ FAILED" end'
else
  echo "✗ Skipped (no token)"
fi
echo ""

# Test 4: My Tickets endpoint
echo "4. My Tickets Endpoint:"
if [ -n "$TOKEN" ]; then
  RESPONSE=$(curl -s http://localhost:8000/api/tickets/me/tickets/ \
    -H "Authorization: Bearer $TOKEN")
  echo "$RESPONSE" | jq -r 'if type == "array" or .results != null then "✓ Endpoint returns valid data" else "✗ FAILED: \(.)" end'
else
  echo "✗ Skipped (no token)"
fi
echo ""

# Test 5: News list
echo "5. News List (Public):"
curl -s http://localhost:8000/api/news/ | jq -r 'if type == "array" or .results != null then "✓ News endpoint working" else "✗ FAILED" end'
echo ""

# Test 6: Gallery media list
echo "6. Gallery Media (Public):"
curl -s http://localhost:8000/api/gallery/media/ | jq -r 'if type == "array" or .results != null then "✓ Gallery endpoint working" else "✗ FAILED" end'
echo ""

# Test 7: Applications endpoint
echo "7. User Applications:"
if [ -n "$TOKEN" ]; then
  curl -s http://localhost:8000/api/auth/applications/ \
    -H "Authorization: Bearer $TOKEN" | jq -r 'if .athlete != null or .coach != null or .organizer != null then "✓ Applications endpoint working" else "✗ FAILED" end'
else
  echo "✗ Skipped (no token)"
fi
echo ""

echo "=== Test Summary ==="
echo "All critical endpoints tested"
