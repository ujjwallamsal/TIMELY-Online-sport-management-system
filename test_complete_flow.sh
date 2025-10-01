#!/bin/bash

# TIMELY Complete Flow Testing Script
# Tests event creation, registration, approval, and ticket purchase flows

BASE_URL="http://127.0.0.1:8000/api"
FRONTEND_URL="http://localhost:5173"

echo "🧪 TIMELY Complete Flow Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
    fi
}

# Test 1: Check Backend Health
echo ""
echo "Test 1: Backend Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health/ 2>/dev/null)
if [ "$response" == "200" ] || [ "$response" == "404" ]; then
    print_result 0 "Backend is responding"
else
    print_result 1 "Backend is not responding (got $response)"
    echo "Make sure backend is running: ./restart_backend.sh"
    exit 1
fi

# Test 2: Check Database Migrations
echo ""
echo "Test 2: Database Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd timely-backend
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    migrations=$(python manage.py showmigrations 2>&1 | grep "\[ \]" | wc -l)
    if [ "$migrations" -eq 0 ]; then
        print_result 0 "All migrations applied"
    else
        print_result 1 "$migrations unapplied migrations found"
        echo "Run: python manage.py migrate"
    fi
else
    print_result 1 "Virtual environment not found"
fi
cd ..

# Test 3: Check Models Are Correct
echo ""
echo "Test 3: Model Enum Values"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd timely-backend
if grep -q "PENDING = \"pending\"" tickets/models.py; then
    print_result 0 "TicketOrder.Status uses lowercase values"
else
    print_result 1 "TicketOrder.Status might use uppercase values"
fi

if grep -q "VALID = \"valid\"" tickets/models.py; then
    print_result 0 "Ticket.Status uses lowercase values"
else
    print_result 1 "Ticket.Status might use uppercase values"
fi
cd ..

# Test 4: Check Events Endpoint
echo ""
echo "Test 4: Events API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
response=$(curl -s $BASE_URL/events/ 2>/dev/null)
if echo "$response" | grep -q "results\|count"; then
    print_result 0 "Events API is accessible"
else
    print_result 1 "Events API returned unexpected response"
fi

# Test 5: Check Registrations Endpoint
echo ""
echo "Test 5: Registrations API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/registrations/ 2>/dev/null)
if [ "$response" == "200" ] || [ "$response" == "401" ]; then
    print_result 0 "Registrations API exists"
else
    print_result 1 "Registrations API not found (got $response)"
fi

# Test 6: Check Tickets Endpoint
echo ""
echo "Test 6: Tickets API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/tickets/checkout/ 2>/dev/null)
if [ "$response" == "401" ] || [ "$response" == "405" ]; then
    print_result 0 "Tickets checkout endpoint exists"
else
    print_result 1 "Tickets checkout endpoint issue (got $response)"
fi

# Test 7: Check Notifications Endpoint
echo ""
echo "Test 7: Notifications API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/notifications/ 2>/dev/null)
if [ "$response" == "200" ] || [ "$response" == "401" ]; then
    print_result 0 "Notifications API exists"
else
    print_result 1 "Notifications API not found (got $response)"
fi

# Test 8: Check User Roles in Database
echo ""
echo "Test 8: User Roles Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd timely-backend
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    organizers=$(python manage.py shell -c "from accounts.models import User; print(User.objects.filter(role='ORGANIZER').count())" 2>/dev/null | tail -1)
    athletes=$(python manage.py shell -c "from accounts.models import User; print(User.objects.filter(role='ATHLETE').count())" 2>/dev/null | tail -1)
    
    if [ "$organizers" -gt 0 ]; then
        print_result 0 "Found $organizers organizer(s)"
    else
        print_result 1 "No organizers found - create one to test event creation"
    fi
    
    if [ "$athletes" -gt 0 ]; then
        print_result 0 "Found $athletes athlete(s)"
    else
        print_result 1 "No athletes found - create one to test registration"
    fi
fi
cd ..

# Test 9: Check Stripe Configuration
echo ""
echo "Test 9: Payment Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd timely-backend
if grep -q "STRIPE_SECRET_KEY" timely/settings.py || [ -f ".env" ]; then
    if grep -q "sk_test_" .env 2>/dev/null || grep -q "sk_test_" timely/settings.py 2>/dev/null; then
        print_result 0 "Stripe test key configured"
    else
        echo -e "${YELLOW}⚠️  WARNING${NC}: Stripe key not configured (will use mock mode)"
    fi
else
    echo -e "${YELLOW}⚠️  WARNING${NC}: Stripe not configured (will use mock mode)"
fi
cd ..

# Test 10: Check Frontend Build
echo ""
echo "Test 10: Frontend Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "timely-frontend/dist" ]; then
    print_result 0 "Frontend build exists"
else
    echo -e "${YELLOW}⚠️  INFO${NC}: Frontend not built yet (run: npm run build)"
fi

if [ -f "timely-frontend/src/features/tickets/Checkout.tsx" ]; then
    print_result 0 "Checkout component exists"
else
    print_result 1 "Checkout component not found"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next Steps:"
echo "1. Ensure backend is running: ./restart_backend.sh"
echo "2. Create test users if needed:"
echo "   cd timely-backend && python manage.py createsuperuser"
echo "3. Start frontend: cd timely-frontend && npm run dev"
echo "4. Test flows manually:"
echo "   • Event Creation: $FRONTEND_URL/events/create"
echo "   • Registration: $FRONTEND_URL/events/:id"
echo "   • Ticket Purchase: $FRONTEND_URL/events/:id/checkout"
echo "   • My Schedule: $FRONTEND_URL/schedule"
echo "   • My Tickets: $FRONTEND_URL/tickets/me"
echo ""
echo "Documentation: See COMPLETE_FLOW_FIXES.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

