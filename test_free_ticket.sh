#!/bin/bash
echo "Testing Free Ticket Endpoint..."
echo ""
echo "Prerequisites:"
echo "1. Backend should be running on http://127.0.0.1:8000"
echo "2. You need a valid JWT token"
echo "3. Event with ID 1 should exist and be free (fee_cents=0)"
echo ""
read -p "Enter your JWT token: " TOKEN
echo ""
curl -X POST http://127.0.0.1:8000/api/tickets/free/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_id": 1}' \
  -w "\n\nHTTP Status: %{http_code}\n"
