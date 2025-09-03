# Timely - Sports Events Management System

A modern, real-time sports events management platform built with Django 5 + Django REST Framework + PostgreSQL + React (Vite).

## 🚀 Features

- **User Management & RBAC**: Complete role-based access control with Admin, Organizer, Athlete, Coach/Manager, and Spectator roles
- **JWT Authentication**: Secure cookie-based JWT authentication with automatic refresh
- **Real-time Updates**: WebSocket support via Django Channels + Redis with polling fallback
- **Modern UI**: Responsive design with Tailwind CSS, accessible forms, and production-ready aesthetics
- **Event Management**: Create, manage, and participate in sports events
- **Audit Logging**: Comprehensive tracking of sensitive operations
- **API-First**: RESTful API with OpenAPI documentation

## 🏗️ Architecture

- **Backend**: Django 5 + DRF + PostgreSQL + Redis
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Authentication**: JWT in HttpOnly cookies
- **Real-time**: Django Channels + WebSockets
- **Permissions**: Granular RBAC with DRF permissions

## 🏟️ Venues & Availability System

### Features
- **Venue Management**: CRUD operations for event venues with capacity and facilities
- **Availability Calendar**: Visual calendar showing available/blocked time slots
- **Conflict Detection**: Automatic detection of scheduling conflicts
- **Real-time Updates**: Live updates via WebSockets when venues or slots change
- **RBAC**: Organizers manage their own venues, Admins manage all venues

### Venues Run & Verify Steps

1. **Create a Venue**:
   ```bash
   # Via API
   curl -X POST http://localhost:8000/api/venues/ \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "name": "Main Stadium",
       "address": "123 Sports Ave, City, State",
       "capacity": 1000,
       "facilities": "{\"parking\": true, \"locker_rooms\": true}",
       "timezone": "UTC"
     }'
   ```

2. **Add Availability Slots**:
   ```bash
   # Add available slot
   curl -X POST http://localhost:8000/api/venues/1/slots/ \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "slots": [{
         "starts_at": "2024-01-15T10:00:00Z",
         "ends_at": "2024-01-15T12:00:00Z",
         "status": "available"
       }]
     }'
   
   # Add blocked slot
   curl -X POST http://localhost:8000/api/venues/1/slots/ \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "slots": [{
         "starts_at": "2024-01-15T14:00:00Z",
         "ends_at": "2024-01-15T16:00:00Z",
         "status": "blocked",
         "reason": "Maintenance"
       }]
     }'
   ```

3. **Check Availability**:
   ```bash
   curl "http://localhost:8000/api/venues/1/availability/?from=2024-01-15T00:00:00Z&to=2024-01-15T23:59:59Z" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

4. **Check for Conflicts**:
   ```bash
   curl -X POST http://localhost:8000/api/venues/check-conflicts/ \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "venue_id": 1,
       "starts_at": "2024-01-15T11:00:00Z",
       "ends_at": "2024-01-15T13:00:00Z"
     }'
   ```

5. **Frontend Testing**:
   - Navigate to `/venues` in the frontend
   - Create a new venue using the "Create Venue" button
   - Click the calendar icon to view availability
   - Add new availability slots using the "Add Availability Slot" button
   - Test conflict detection by trying to add overlapping slots

6. **Real-time Updates**:
   - Open multiple browser tabs/windows
   - Create or modify venues/slots in one tab
   - Observe real-time updates in other tabs (if WebSockets configured)
   - Fallback to 30-second polling if WebSockets unavailable

### API Endpoints

- `GET /api/venues/` - List venues (with search and capacity filters)
- `POST /api/venues/` - Create venue
- `GET /api/venues/{id}/` - Get venue details
- `PATCH /api/venues/{id}/` - Update venue
- `DELETE /api/venues/{id}/` - Delete venue
- `GET /api/venues/{id}/availability/` - Get availability for date range
- `POST /api/venues/{id}/slots/` - Add availability slots
- `POST /api/venues/check-conflicts/` - Check for scheduling conflicts
- `GET /api/slots/` - List venue slots
- `PATCH /api/slots/{id}/` - Update slot
- `DELETE /api/slots/{id}/` - Delete slot

### Database Schema

```sql
-- Venues table
CREATE TABLE venues_venue (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    capacity INTEGER CHECK (capacity >= 0),
    facilities JSONB,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_by_id INTEGER REFERENCES auth_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Venue slots table
CREATE TABLE venues_venueslot (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER REFERENCES venues_venue(id) ON DELETE CASCADE,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT venue_slot_ends_after_starts CHECK (ends_at > starts_at)
);
```

### Tests

Run the venue tests:
```bash
cd timely-backend
python manage.py test venues.tests.test_venues
```

Expected test results:
- ✅ create_venue_ok (201)
- ✅ update_venue_ok (200) 
- ✅ delete_venue_ok (204 by owner/admin)
- ✅ add_blocked_slot_ok
- ✅ cannot_add_inverted_slot
- ✅ check_conflicts_detects_overlap_ok
- ✅ list_filters_q_and_capacity_ok

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 13+
- Redis (optional, for production)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CAPSTONE
```

### 2. Backend Setup

```bash
cd timely-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your database and secret settings

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Seed sample data (optional)
python manage.py seed_all
```

### 3. Frontend Setup

```bash
cd timely-frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your API base URL

# Run development server
npm run dev
```

### 4. Environment Variables

#### Backend (.env)
```bash
DEBUG=True
SECRET_KEY=your-secret-key-here
DB_NAME=timely_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379  # Optional
```

#### Frontend (.env)
```bash
# Option A: baseURL without /api + paths with /api (RECOMMENDED)
VITE_API_BASE_URL=http://127.0.0.1:8000

# Option B: baseURL with /api + paths without /api

## 🎯 Registration System

The platform includes a comprehensive participant registration system with the following features:

### Participant Flow
1. **Browse Events**: View available events and divisions
2. **Start Registration**: Click "Register" on an event
3. **Multi-step Wizard**:
   - Step 1: Select event division
   - Step 2: Enter participant/team details and emergency contact
   - Step 3: Upload required documents (ID, medical clearance)
   - Step 4: Review and submit registration
4. **Payment**: Stripe integration for registration fees (test mode)
5. **Status Tracking**: Monitor registration status and approvals

### Organizer Management
- **Registration Dashboard**: View all registrations for owned events
- **Approval Workflow**: Approve, reject, or waitlist registrations
- **Document Review**: Review uploaded documents and request re-uploads
- **Payment Monitoring**: Track payment status and confirmations

### Key Features
- **Individual & Team Registrations**: Support for both registration types
- **Document Management**: Secure file uploads with validation
- **Real-time Updates**: Live status updates via WebSockets
- **Email Notifications**: Automatic confirmations and status updates
- **RBAC Security**: Role-based access control for all operations

### API Endpoints
```bash
# Participant endpoints
POST   /api/registrations/                    # Create registration
GET    /api/registrations/mine/               # List own registrations
GET    /api/registrations/{id}/               # View registration details
POST   /api/registrations/{id}/withdraw/      # Withdraw registration
POST   /api/registrations/{id}/documents/     # Upload documents
POST   /api/registrations/{id}/create_payment_intent/  # Create payment
POST   /api/registrations/{id}/confirm_payment/        # Confirm payment

# Organizer endpoints
GET    /api/registrations/?event=&status=&q=  # List registrations
POST   /api/registrations/{id}/approve/       # Approve registration
POST   /api/registrations/{id}/reject/        # Reject registration
POST   /api/registrations/{id}/waitlist/      # Waitlist registration
POST   /api/registrations/{id}/request_reupload/  # Request doc re-upload
```

### Testing the Registration System
```bash
# 1. Create test event and divisions
python manage.py seed_events

# 2. Register as participant
# - Navigate to /events
# - Click "Register" on an event
# - Complete the 4-step wizard

# 3. Test organizer approval
# - Login as organizer
# - Navigate to event management
# - Review and approve registrations

# 4. Verify real-time updates
# - Check WebSocket connections
# - Monitor email notifications
# - Verify status changes
```
# VITE_API_BASE_URL=http://127.0.0.1:8000/api

# IMPORTANT: Restart Vite after changing environment variables
```

## 🎯 Events System

The platform includes a comprehensive event management system with the following features:

### Event Management Flow
1. **Create Events**: Organizers can create events with details like name, sport, dates, location, capacity, and fees
2. **Event Lifecycle**: Events progress through draft → published → cancelled states
3. **Division Management**: Create and manage divisions within events (e.g., Senior, Junior, Women's)
4. **Public Browsing**: All users can browse published events with filtering and search
5. **Real-time Updates**: Live updates via WebSockets when events are created, updated, or published

### Organizer Features
- **Event Creation**: Full event creation with validation and date checks
- **Lifecycle Management**: Publish, unpublish, and cancel events
- **Division Management**: Create, edit, and delete divisions within events
- **Event Editor**: Comprehensive form for event management

### Key Features
- **Computed Phase**: Events automatically show as "upcoming", "ongoing", or "completed" based on current time
- **RBAC Security**: Role-based access control for all event operations
- **Real-time Updates**: Live status updates via WebSockets
- **Responsive Design**: Mobile-friendly event browsing and management
- **Advanced Filtering**: Filter by sport, date range, and search terms

### API Endpoints
```bash
# Public endpoints
GET    /api/events/                    # List published events
GET    /api/events/{id}/               # View event details
GET    /api/events/{id}/divisions/     # List event divisions

# Organizer/Admin endpoints
POST   /api/events/                    # Create event
PATCH  /api/events/{id}/               # Update event
DELETE /api/events/{id}/               # Delete event
POST   /api/events/{id}/publish/       # Publish event
POST   /api/events/{id}/unpublish/     # Unpublish event
POST   /api/events/{id}/cancel/        # Cancel event
POST   /api/events/{id}/divisions/     # Create division
PATCH  /api/events/{id}/divisions/{division_id}/  # Update division
DELETE /api/events/{id}/divisions/{division_id}/  # Delete division
```

### Testing the Events System
```bash
# 1. Create test organizer user
python manage.py shell -c "
from accounts.models import User
user, created = User.objects.get_or_create(
    email='organizer@example.com',
    defaults={
        'username': 'organizer',
        'role': 'ORGANIZER',
        'is_active': True
    }
)
print(f'Organizer user: {user.email}')
"

# 2. Create test event
python manage.py shell -c "
from events.models import Event
from accounts.models import User
from django.utils import timezone
from datetime import timedelta

user = User.objects.get(email='organizer@example.com')
event = Event.objects.create(
    name='Test Football Tournament',
    sport='Football',
    description='A test football tournament',
    start_datetime=timezone.now() + timedelta(days=7),
    end_datetime=timezone.now() + timedelta(days=8),
    location='Test Stadium',
    capacity=100,
    fee_cents=5000,
    created_by=user
)
print(f'Event created: {event.id} - {event.name}')
"

# 3. Publish the event
python manage.py shell -c "
from events.models import Event
event = Event.objects.get(name='Test Football Tournament')
event.lifecycle_status = 'published'
event.save()
print(f'Event published: {event.lifecycle_status}')
"

# 4. Create divisions
python manage.py shell -c "
from events.models import Event, Division
event = Event.objects.get(name='Test Football Tournament')
Division.objects.create(event=event, name='Senior Division', sort_order=1)
Division.objects.create(event=event, name='Junior Division', sort_order=2)
print(f'Divisions created for {event.name}')
"

# 5. Test API endpoints
curl -X GET "http://127.0.0.1:8000/api/events/" | python -m json.tool
curl -X GET "http://127.0.0.1:8000/api/events/1/" | python -m json.tool
curl -X GET "http://127.0.0.1:8000/api/events/1/divisions/" | python -m json.tool

# 6. Test frontend
# - Navigate to http://localhost:5173/events
# - Verify event appears in the list
# - Click on event to view details
# - Test filtering by sport and date range
# - Login as organizer to test event creation/editing
```

## 🎯 Registration System

The platform includes a comprehensive participant registration system with the following features:

### Registration Flow
1. **Browse Events**: View available events and divisions
2. **Start Registration**: Click "Register" on an event
3. **Multi-step Wizard**:
   - Step 1: Select event division
   - Step 2: Choose individual or team registration
   - Step 3: Upload required documents (ID, medical clearance)
   - Step 4: Pay registration fee (Stripe test mode)
   - Step 5: Review and confirm registration
4. **Status Tracking**: Monitor registration status and approvals
5. **Document Management**: Upload and manage required documents

### Organizer Management
- **Registration Dashboard**: View all registrations for owned events
- **Approval Workflow**: Approve, reject, or waitlist registrations
- **Document Review**: Review uploaded documents and request re-uploads
- **Payment Monitoring**: Track payment status and confirmations

### Key Features
- **Individual & Team Registrations**: Support for both registration types
- **Document Management**: Secure file uploads with validation
- **Real-time Updates**: Live status updates via WebSockets
- **Payment Integration**: Stripe test mode for registration fees
- **RBAC Security**: Role-based access control for all operations

### API Endpoints
```bash
# Participant endpoints
POST   /api/registrations/                    # Create registration
GET    /api/registrations/mine/               # List own registrations
GET    /api/registrations/{id}/               # View registration details
PATCH  /api/registrations/{id}/withdraw/      # Withdraw registration
POST   /api/registrations/{id}/documents/     # Upload documents
POST   /api/registrations/{id}/pay/intent/    # Create payment intent
POST   /api/registrations/{id}/pay/confirm/   # Confirm payment

# Organizer endpoints
GET    /api/registrations/?event=&status=&q=  # List registrations
PATCH  /api/registrations/{id}/approve/       # Approve registration
PATCH  /api/registrations/{id}/reject/        # Reject registration
PATCH  /api/registrations/{id}/waitlist/      # Waitlist registration
PATCH  /api/registrations/{id}/request_reupload/  # Request doc re-upload
```

### Testing the Registration System
```bash
# 1. Create test event and divisions
python manage.py shell -c "
from events.models import Event, Division
from accounts.models import User
from django.utils import timezone
from datetime import timedelta

# Create organizer
organizer, created = User.objects.get_or_create(
    email='organizer@test.com',
    defaults={
        'username': 'organizer',
        'role': 'ORGANIZER',
        'is_active': True
    }
)

# Create event
event = Event.objects.create(
    name='Test Registration Event',
    sport='Basketball',
    description='Test event for registration system',
    start_datetime=timezone.now() + timedelta(days=7),
    end_datetime=timezone.now() + timedelta(days=8),
    location='Test Arena',
    capacity=100,
    fee_cents=5000,
    created_by=organizer,
    lifecycle_status='published',
    registration_open_at=timezone.now() - timedelta(days=1),
    registration_close_at=timezone.now() + timedelta(days=6)
)

# Create divisions
Division.objects.create(event=event, name='Senior Division', sort_order=1)
Division.objects.create(event=event, name='Junior Division', sort_order=2)

print(f'Event created: {event.name} (ID: {event.id})')
print(f'Divisions created: {event.divisions.count()}')
"

# 2. Test participant registration flow
# - Navigate to http://localhost:5173/events
# - Click "Register" on the test event
# - Complete the 5-step registration wizard
# - Upload required documents
# - Complete payment (test mode)

# 3. Test organizer approval
# - Login as organizer (organizer@test.com)
# - Navigate to event management
# - Review and approve registrations

# 4. Test API endpoints
curl -X GET "http://127.0.0.1:8000/api/registrations/mine/" \
  -H "Authorization: Bearer YOUR_TOKEN"

curl -X PATCH "http://127.0.0.1:8000/api/registrations/1/approve/" \
  -H "Authorization: Bearer ORGANIZER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "All documents verified"}'

# 5. Verify real-time updates
# - Check WebSocket connections
# - Monitor registration status changes
# - Verify email notifications (console logs)
```

## 🧪 Testing

### API Testing with curl

Test the authentication endpoints to verify the API is working correctly:

#### 1. Test Login
```bash
curl -X POST http://127.0.0.1:8000/api/accounts/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Pass12345!"}'
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": { "id": 1, "email": "admin@example.com", "role": "ADMIN", ... }
}
```

#### 2. Test /me Endpoint (with auth)
```bash
# Replace YOUR_ACCESS_TOKEN with the token from login response
curl -X GET http://127.0.0.1:8000/api/accounts/users/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "id": 1,
  "email": "admin@example.com",
  "username": "admin",
  "role": "ADMIN",
  "first_name": "Admin",
  "last_name": "User"
}
```

#### 3. Test /me Endpoint (without auth - should return 401)
```bash
curl -X GET http://127.0.0.1:8000/api/accounts/users/me/
```

**Expected Response:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### Frontend Testing

1. **Start both servers:**
   ```bash
   # Backend (in timely-backend/)
   source venv/bin/activate && python manage.py runserver 127.0.0.1:8000
   
   # Frontend (in timely-frontend/)
   npm run dev
   ```

2. **Open browser console** and verify:
   - ✅ No double `/api/api/` in URLs
   - ✅ API requests show correct paths
   - ✅ Login works without 404 errors
   - ✅ Profile data loads correctly

3. **Check console logs** for the 🌐 API Request messages showing correct URLs

### Backend Tests

```bash
cd timely-backend

# Run all tests
python manage.py test

# Run specific app tests
python manage.py test accounts
python manage.py test events

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

### Frontend Tests

```bash
cd timely-frontend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Running the Application

### Development

1. **Start Backend**:
   ```bash
   cd timely-backend
   python manage.py runserver
   ```

2. **Start Frontend**:
   ```bash
   cd timely-frontend
   npm run dev
   ```

3. **Access the Application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/api
   - Admin Panel: http://localhost:8000/admin

### Production

1. **Build Frontend**:
   ```bash
   cd timely-frontend
   npm run build
   ```

2. **Collect Static Files**:
   ```bash
   cd timely-backend
   python manage.py collectstatic
   ```

3. **Use Production Server**:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/accounts/auth/register/` - User registration
- `POST /api/accounts/auth/login/` - User login
- `POST /api/accounts/auth/logout/` - User logout
- `POST /api/accounts/auth/refresh/` - Refresh JWT token
- `POST /api/accounts/auth/password-reset-request/` - Request password reset
- `POST /api/accounts/auth/password-reset-confirm/` - Confirm password reset
- `POST /api/accounts/auth/verify-email/` - Verify email address

### User Management Endpoints

- `GET /api/accounts/users/me/` - Get current user profile
- `PATCH /api/accounts/users/me/` - Update current user profile
- `POST /api/accounts/users/{id}/change-password/` - Change user password
- `PATCH /api/accounts/users/{id}/update-role/` - Update user role (admin only)

### Admin Endpoints

- `GET /api/accounts/admin/users/` - List all users (admin only)
- `POST /api/accounts/admin/users/{id}/assign-role/` - Assign role to user
- `DELETE /api/accounts/admin/users/{id}/delete-user/` - Delete user (superuser only)

### Role Management Endpoints

- `GET /api/accounts/roles/` - List user roles
- `POST /api/accounts/roles/` - Create new role
- `PATCH /api/accounts/roles/{id}/` - Update role
- `DELETE /api/accounts/roles/{id}/` - Delete role

### Audit Logs

- `GET /api/accounts/audit-logs/` - View audit logs (admin only)

## 🔐 Role-Based Access Control

### Roles and Permissions

1. **Administrator (ADMIN)**
   - Full system access
   - User management
   - Role assignment
   - System configuration

2. **Event Organizer (ORGANIZER)**
   - Create and manage events
   - Manage registrations
   - View reports
   - Manage fixtures

3. **Athlete (ATHLETE)**
   - Register for events
   - View personal results
   - Manage profile

4. **Coach/Manager (COACH/MANAGER)**
   - Manage team registrations
   - View team results
   - Team management

5. **Spectator (SPECTATOR)**
   - View events and results
   - Purchase tickets
   - Basic profile access

## 🗄️ Database Schema

### Core Models

- **User**: Custom user model with email authentication
- **UserRole**: Granular role assignments with permissions
- **AuditLog**: Comprehensive audit trail
- **EmailVerificationToken**: Email verification system
- **PasswordResetToken**: Secure password reset

### Key Relationships

- Users can have multiple roles
- Roles have granular permissions
- All sensitive operations are audited
- Email verification required for full access

## 🔒 Security Features

- JWT stored in HttpOnly cookies
- CSRF protection
- Rate limiting
- Password strength validation
- Audit logging for sensitive operations
- Role-based access control
- Secure password reset flow

## 🎨 UI/UX Features

- Responsive design with Tailwind CSS
- Accessible forms (WCAG 2.1 AA compliant)
- Modern card-based layouts
- Empty states and loading indicators
- Focus states and keyboard navigation
- Clean typography and spacing

## 🚀 Deployment

### Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment

1. **Backend**:
   - Set `DEBUG=False` in production
   - Configure production database
   - Set secure `SECRET_KEY`
   - Enable HTTPS
   - Configure Redis for production

2. **Frontend**:
   - Build with `npm run build`
   - Serve static files
   - Configure reverse proxy

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**:
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **JWT Issues**:
   - Check cookie settings
   - Verify CORS configuration
   - Check JWT secret key

3. **Frontend Build Issues**:
   - Clear `node_modules` and reinstall
   - Check Node.js version compatibility
   - Verify environment variables

### Debug Mode

Enable debug mode in backend `.env`:
```bash
DEBUG=True
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🏟️ Venues & Availability System

The platform includes a comprehensive venue management system with availability scheduling and conflict detection.

### Venue Management Features
1. **Venue CRUD**: Create, read, update, and delete venues with detailed information
2. **Availability Scheduling**: Define available, blocked, and maintenance time slots
3. **Conflict Detection**: Identify scheduling conflicts and overlapping availability
4. **Real-time Updates**: Live updates via WebSockets when venues or availability changes
5. **RBAC Security**: Role-based access control for venue management

### Key Features
- **Venue Information**: Name, address, city, state, postal code, capacity, facilities, timezone
- **Availability Slots**: Time-based slots with status (available, blocked, maintenance)
- **Conflict Detection**: Check for overlapping availability and scheduled fixtures
- **Real-time Updates**: WebSocket notifications for venue and availability changes
- **Modern UI**: Calendar-like availability grid with responsive design

### API Endpoints
```bash
# Venue Management
GET    /api/venues/                    # List venues with filters
POST   /api/venues/                    # Create venue (Admin/Organizer)
GET    /api/venues/{id}/               # Get venue details
PATCH  /api/venues/{id}/               # Update venue (Admin/Organizer)
DELETE /api/venues/{id}/               # Delete venue (Admin/Organizer)

# Availability Management
GET    /api/venues/{id}/availability/  # Get venue availability
POST   /api/venues/{id}/availability/  # Create availability slots
PATCH  /api/venues/{id}/availability/{slot_id}/  # Update slot
DELETE /api/venues/{id}/availability/{slot_id}/  # Delete slot
POST   /api/venues/{id}/block/         # Block venue slot
GET    /api/venues/{id}/conflicts/     # Check for conflicts
```

### Venues Run & Verify Steps
```bash
# 1. Create and run migrations
cd timely-backend
python manage.py makemigrations venues
python manage.py makemigrations events  # For venue FK
python manage.py migrate

# 2. Create test venue
python manage.py shell -c "
from venues.models import Venue
from django.utils import timezone
from datetime import timedelta

venue = Venue.objects.create(
    name='Test Stadium',
    address='123 Sports Ave',
    city='Test City',
    state='TS',
    postal_code='12345',
    capacity=1000,
    facilities='parking,locker rooms,first aid',
    timezone='America/New_York',
    is_active=True
)
print(f'Venue created: {venue.id} - {venue.name}')
"

# 3. Add availability slots
python manage.py shell -c "
from venues.models import Venue, VenueAvailabilitySlot
from django.utils import timezone
from datetime import timedelta

venue = Venue.objects.get(name='Test Stadium')
start_time = timezone.now() + timedelta(days=1)
end_time = start_time + timedelta(hours=2)

# Create available slot
VenueAvailabilitySlot.objects.create(
    venue=venue,
    start_datetime=start_time,
    end_datetime=end_time,
    status=VenueAvailabilitySlot.Status.AVAILABLE,
    note='Available for booking'
)

# Create blocked slot
blocked_start = timezone.now() + timedelta(days=2)
blocked_end = blocked_start + timedelta(hours=1)
VenueAvailabilitySlot.objects.create(
    venue=venue,
    start_datetime=blocked_start,
    end_datetime=blocked_end,
    status=VenueAvailabilitySlot.Status.BLOCKED,
    note='Maintenance scheduled'
)

print(f'Availability slots created for {venue.name}')
"

# 4. Test API endpoints
curl -X GET "http://127.0.0.1:8000/api/venues/" | python -m json.tool
curl -X GET "http://127.0.0.1:8000/api/venues/1/" | python -m json.tool
curl -X GET "http://127.0.0.1:8000/api/venues/1/availability/" | python -m json.tool

# 5. Test conflict detection
python manage.py shell -c "
from venues.services import get_venue_conflicts
from django.utils import timezone
from datetime import timedelta

venue_id = 1
start = timezone.now() + timedelta(days=1, hours=1)
end = start + timedelta(hours=1)

conflicts = get_venue_conflicts(venue_id, start, end)
print(f'Conflicts: {conflicts}')
"

# 6. Test frontend
# - Navigate to http://localhost:5173/venues
# - Verify venue appears in the list
# - Click "Manage Availability" to view availability grid
# - Test adding/editing availability slots
# - Verify real-time updates (or 30s polling fallback)

# 7. Test Event-Venue integration
python manage.py shell -c "
from events.models import Event
from venues.models import Venue
from accounts.models import User
from django.utils import timezone
from datetime import timedelta

# Create event with venue
user = User.objects.first()
venue = Venue.objects.get(name='Test Stadium')

event = Event.objects.create(
    name='Test Event with Venue',
    sport='Football',
    start_datetime=timezone.now() + timedelta(days=7),
    end_datetime=timezone.now() + timedelta(days=7, hours=2),
    location='Test Stadium',
    venue=venue,
    capacity=500,
    fee_cents=0,
    created_by=user
)

print(f'Event created with venue: {event.name} at {event.venue.name}')
"

# 8. Run tests
python manage.py test venues.tests.test_venues

# 9. Verify real-time updates
# - Open browser console
# - Create/update venue or availability slot
# - Check for WebSocket messages or polling updates
# - Verify UI updates automatically
```

## ⚽ Fixtures & Scheduling System

The platform includes a comprehensive fixtures and scheduling system with Round-Robin and Knockout tournament generation, conflict detection, and real-time updates.

### Fixtures Management Features
1. **Tournament Generation**: Generate Round-Robin and Knockout brackets with simple greedy placement
2. **Match Scheduling**: Schedule matches with venue assignment and time conflict detection
3. **Publish/Unpublish**: Control match visibility with proper status transitions
4. **Rescheduling**: Reschedule individual matches with conflict validation
5. **Real-time Updates**: Live updates via WebSockets with 30s polling fallback
6. **RBAC Security**: Role-based access control for fixture management

### Key Features
- **Simple Match Model**: Streamlined match structure with event, division, teams, timing, and venue
- **Conflict Detection**: Check for venue overlaps, team double-booking, and venue availability blocks
- **Tournament Types**: Round-Robin (single/multiple rounds) and Knockout (single-elimination with byes)
- **Modern UI**: List and Bracket views with responsive design and accessibility
- **Real-time Updates**: WebSocket notifications for match changes with polling fallback

### API Endpoints
```bash
# Match Management
GET    /api/fixtures/                           # List matches with filters
POST   /api/fixtures/                           # Create match
GET    /api/fixtures/{id}/                      # Get match details
PATCH  /api/fixtures/{id}/                      # Update match
DELETE /api/fixtures/{id}/                      # Delete match

# Event Fixtures Operations
GET    /api/fixtures/events/{event_id}/         # List event matches
POST   /api/fixtures/events/{event_id}/generate/  # Generate RR/KO fixtures
POST   /api/fixtures/events/{event_id}/publish/   # Publish all matches
POST   /api/fixtures/events/{event_id}/unpublish/ # Unpublish all matches
GET    /api/fixtures/events/{event_id}/conflicts/ # Get conflicts in time range

# Match Operations
POST   /api/fixtures/{match_id}/reschedule/     # Reschedule match

# Public Fixtures
GET    /api/fixtures/public/matches/            # Public match listings
```

### Fixtures Run & Verify Steps
```bash
# 1. Create and run migrations
cd timely-backend
python manage.py makemigrations fixtures
python manage.py migrate

# 2. Create test event with teams
python manage.py shell -c "
from events.models import Event, Division
from teams.models import Team
from venues.models import Venue
from accounts.models import User
from django.utils import timezone
from datetime import timedelta

# Create organizer
organizer, created = User.objects.get_or_create(
    email='organizer@fixtures.com',
    defaults={
        'username': 'organizer',
        'role': 'ORGANIZER',
        'is_active': True
    }
)

# Create event
event = Event.objects.create(
    name='Test Fixtures Tournament',
    sport='Football',
    description='Test tournament for fixtures system',
    start_datetime=timezone.now() + timedelta(days=7),
    end_datetime=timezone.now() + timedelta(days=8),
    location='Test Stadium',
    capacity=100,
    fee_cents=0,
    created_by=organizer,
    lifecycle_status='published'
)

# Create division
division = Division.objects.create(
    event=event,
    name='Open Division',
    description='Open to all teams'
)

# Create teams
teams = []
for i in range(4):
    team = Team.objects.create(
        name=f'Team {i+1}',
        sport='Football'
    )
    teams.append(team)

# Create venue
venue = Venue.objects.create(
    name='Test Stadium',
    city='Test City',
    capacity=1000
)

print(f'Event created: {event.name} (ID: {event.id})')
print(f'Division created: {division.name} (ID: {division.id})')
print(f'Teams created: {len(teams)}')
print(f'Venue created: {venue.name} (ID: {venue.id})')
"

# 3. Generate Round-Robin fixtures
python manage.py shell -c "
from fixtures.services.scheduling import generate_rr, create_matches_from_prototypes
from events.models import Event, Division
from teams.models import Team
from venues.models import Venue
from django.utils import timezone
from datetime import timedelta

event = Event.objects.get(name='Test Fixtures Tournament')
division = Division.objects.get(event=event, name='Open Division')
teams = list(Team.objects.all()[:4])
venue = Venue.objects.get(name='Test Stadium')

# Generate RR fixtures
team_ids = [team.id for team in teams]
starts_at = timezone.now() + timedelta(days=1, hours=10)

prototypes = generate_rr(
    teams=team_ids,
    rounds=1,
    starts_at=starts_at,
    duration=60,
    gap=30,
    venue_ids=[venue.id]
)

matches = create_matches_from_prototypes(
    event_id=event.id,
    division_id=division.id,
    prototypes=prototypes
)

print(f'Generated {len(matches)} Round-Robin matches')
for match in matches:
    print(f'  R{match.round_no} M{match.sequence_no}: {match.team_home_id} vs {match.team_away_id}')
"

# 4. Test API endpoints
curl -X GET "http://127.0.0.1:8000/api/fixtures/events/1/" | python -m json.tool

# 5. Generate Knockout fixtures
python manage.py shell -c "
from fixtures.services.scheduling import generate_ko, create_matches_from_prototypes
from events.models import Event, Division
from teams.models import Team
from venues.models import Venue
from django.utils import timezone
from datetime import timedelta

event = Event.objects.get(name='Test Fixtures Tournament')
division = Division.objects.get(event=event, name='Open Division')
teams = list(Team.objects.all()[:4])
venue = Venue.objects.get(name='Test Stadium')

# Clear existing matches
from fixtures.models import Match
Match.objects.filter(event=event).delete()

# Generate KO fixtures
team_ids = [team.id for team in teams]
starts_at = timezone.now() + timedelta(days=1, hours=10)

prototypes = generate_ko(
    teams=team_ids,
    starts_at=starts_at,
    duration=60,
    gap=30,
    venue_ids=[venue.id]
)

matches = create_matches_from_prototypes(
    event_id=event.id,
    division_id=division.id,
    prototypes=prototypes
)

print(f'Generated {len(matches)} Knockout matches')
for match in matches:
    print(f'  R{match.round_no} M{match.sequence_no}: {match.team_home_id} vs {match.team_away_id}')
"

# 6. Test publish/unpublish
python manage.py shell -c "
from fixtures.models import Match
from events.models import Event

event = Event.objects.get(name='Test Fixtures Tournament')
matches = Match.objects.filter(event=event)

print(f'Before publish: {[m.status for m in matches]}')

# Publish all matches
for match in matches:
    match.status = match.Status.PUBLISHED
    match.save()

print(f'After publish: {[m.status for m in matches]}')

# Unpublish all matches
for match in matches:
    match.status = match.Status.SCHEDULED
    match.save()

print(f'After unpublish: {[m.status for m in matches]}')
"

# 7. Test conflict detection
python manage.py shell -c "
from fixtures.services.conflicts import find_conflicts
from fixtures.models import Match
from events.models import Event
from django.utils import timezone
from datetime import timedelta

event = Event.objects.get(name='Test Fixtures Tournament')
matches = Match.objects.filter(event=event)

if matches.exists():
    match = matches.first()
    venue_id = match.venue_id
    starts_at = match.starts_at
    ends_at = starts_at + timedelta(minutes=match.duration_minutes)
    
    # Check for conflicts
    conflicts = find_conflicts(
        event_id=event.id,
        starts_at=starts_at,
        ends_at=ends_at,
        venue_id=venue_id
    )
    
    print(f'Conflicts found: {len(conflicts)}')
    for conflict in conflicts:
        print(f'  - {conflict.conflict_type}: {conflict.message}')
"

# 8. Test frontend
# - Navigate to http://localhost:5173/fixtures/1
# - Verify matches appear in list view
# - Test filtering by division, status, date range
# - Generate new fixtures using the action buttons
# - Test publish/unpublish functionality
# - Try rescheduling a match to see conflict detection
# - Switch to bracket view for knockout tournaments

# 9. Test real-time updates
# - Open browser console
# - Create/update/delete matches via API or frontend
# - Check for WebSocket messages or polling updates
# - Verify UI updates automatically

# 10. Run tests
python manage.py test fixtures.tests.test_fixtures

# 11. Test WebSocket connection
# - Open browser console
# - Navigate to fixtures page
# - Check for WebSocket connection status
# - Verify real-time updates or 30s polling fallback
```

## ⚽ Fixtures & Scheduling System

### Features
- **Tournament Generation**: Round-Robin and Knockout bracket generation with automatic scheduling
- **Preview & Publish Workflow**: Generate fixtures, preview proposals, accept as draft, then publish
- **Conflict Detection**: Automatic detection of venue/time conflicts with venue availability integration
- **Rescheduling**: Individual fixture rescheduling with conflict validation
- **Real-time Updates**: Live updates via WebSockets when fixtures are generated, published, or rescheduled
- **RBAC**: Organizers manage fixtures for their own events, Admins manage all fixtures

### API Endpoints
- `POST /api/fixtures/generate/` - Generate fixture proposals (RR/KO)
- `POST /api/fixtures/accept/` - Accept generated fixtures as draft
- `POST /api/fixtures/{id}/publish/` - Publish individual fixture
- `POST /api/events/{id}/fixtures/publish/` - Publish all draft fixtures for event
- `PATCH /api/fixtures/{id}/reschedule/` - Reschedule fixture with conflict checks
- `GET /api/fixtures/{id}/conflicts/` - Check conflicts for a fixture
- `GET /api/events/{id}/fixtures/` - List fixtures for an event
- `GET /api/public/events/{id}/fixtures/` - Public fixtures (published only)

### Fixtures Run & Verify Steps

1. **Generate Round-Robin Fixtures**:
   ```bash
   # Generate RR fixtures for 4 teams
   curl -X POST http://localhost:8000/api/fixtures/generate/ \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "event_id": 1,
       "mode": "rr",
       "participants": [1, 2, 3, 4],
       "slot_hints": {
         "starts_at": "2024-01-15T10:00:00Z",
         "spacing_minutes": 60
       }
     }'
   ```

2. **Accept Generated Fixtures**:
   ```bash
   # Accept the generated fixtures as draft
   curl -X POST http://localhost:8000/api/fixtures/accept/ \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "event_id": 1,
       "fixtures": [
         {
           "round_no": 1,
           "starts_at": "2024-01-15T10:00:00Z",
           "ends_at": "2024-01-15T11:00:00Z",
           "venue_id": 1,
           "entries": [
             {"side": "home", "team_id": 1},
             {"side": "away", "team_id": 2}
           ]
         }
       ]
     }'
   ```

3. **Publish All Fixtures**:
   ```bash
   # Publish all draft fixtures for an event
   curl -X POST http://localhost:8000/api/events/1/fixtures/publish/ \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

4. **Reschedule a Fixture**:
   ```bash
   # Reschedule a fixture with new time
   curl -X PATCH http://localhost:8000/api/fixtures/1/reschedule/ \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "starts_at": "2024-01-15T14:00:00Z",
       "ends_at": "2024-01-15T15:00:00Z",
       "venue_id": 2
     }'
   ```

5. **Check Conflicts**:
   ```bash
   # Check for conflicts on a fixture
   curl -X GET http://localhost:8000/api/fixtures/1/conflicts/ \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

6. **Frontend Testing**:
   - Navigate to `/fixtures` page
   - Select an event and teams
   - Generate Round-Robin or Knockout fixtures
   - Preview the generated fixtures
   - Accept as draft, then publish
   - Test rescheduling with conflict detection
   - Verify real-time updates via WebSocket

### Tournament Modes
- **Round-Robin**: Every team plays every other team once (or multiple rounds)
- **Knockout**: Single elimination tournament (requires power-of-2 participants, byes added automatically)

### Conflict Detection
- **Venue Conflicts**: Checks against existing fixtures and blocked venue slots
- **Time Overlaps**: Prevents double-booking of teams or venues
- **Validation**: Ensures end time is after start time, proper team assignments

### Real-time Features
- **WebSocket Groups**: `fixtures:event:{event_id}` for live updates
- **Message Types**: `fixtures.updated`, `fixtures.deleted`, `fixtures.entry_updated`
- **Fallback**: 30-second polling when WebSocket unavailable

## ⚽ Teams & Athletes Management System

The platform includes a comprehensive teams and athletes management system with roster management, event entries, eligibility checking, and real-time updates.

### Teams Management Features
1. **Team CRUD**: Create, read, update, and delete teams with manager/coach assignments
2. **Roster Management**: Add, edit, and remove team members with roles and permissions
3. **Event Entries**: Submit team entries to events/divisions with approval workflow
4. **Eligibility Checking**: Validate team eligibility based on sport, roster size, and age requirements
5. **Real-time Updates**: Live updates via WebSockets for roster and entry status changes
6. **RBAC Security**: Role-based access control for team management

### Key Features
- **Team Information**: Name, sport, manager, coach, contact details, and venue
- **Member Management**: Full name, date of birth, position, jersey number, role, and status
- **Entry Workflow**: Submit entries, organizer approval/rejection, team withdrawal
- **Eligibility Validation**: Sport matching, roster size limits, age requirements
- **Real-time Updates**: WebSocket notifications for roster and entry changes
- **Modern UI**: Responsive dashboard with tabs for roster and entries

### API Endpoints
```bash
# Team Management
GET    /api/teams/                    # List teams with filters
POST   /api/teams/                    # Create team
GET    /api/teams/{id}/               # Get team details
PATCH  /api/teams/{id}/               # Update team
DELETE /api/teams/{id}/               # Delete team

# Roster Management
GET    /api/teams/{id}/members/       # List team members
POST   /api/teams/{id}/members/       # Add team member
PATCH  /api/teams/members/{id}/       # Update team member
DELETE /api/teams/members/{id}/       # Remove team member

# Event Entries
GET    /api/teams/{id}/entries/       # List team entries
POST   /api/teams/{id}/entries/       # Create entry
PATCH  /api/teams/entries/{id}/withdraw/    # Withdraw entry
PATCH  /api/teams/entries/{id}/approve/     # Approve entry (organizer)
PATCH  /api/teams/entries/{id}/reject/      # Reject entry (organizer)

# Eligibility
POST   /api/teams/eligibility/check/  # Check team eligibility
```

### Teams Run & Verify Steps
```bash
# 1. Create and run migrations
cd timely-backend
python manage.py makemigrations teams
python manage.py migrate

# 2. Create test team and members
python manage.py shell -c "
from teams.models import Team, TeamMember
from accounts.models import User
from django.utils import timezone
from datetime import date, timedelta

# Create manager
manager, created = User.objects.get_or_create(
    email='manager@teams.com',
    defaults={
        'username': 'manager',
        'first_name': 'John',
        'last_name': 'Manager',
        'is_active': True
    }
)

# Create team
team = Team.objects.create(
    name='Test Basketball Team',
    sport='Basketball',
    manager=manager,
    contact_email='team@test.com',
    contact_phone='555-0123'
)

# Add team members
members_data = [
    {'full_name': 'Alice Johnson', 'position': 'Point Guard', 'jersey_number': 1, 'date_of_birth': date(1995, 5, 15)},
    {'full_name': 'Bob Smith', 'position': 'Shooting Guard', 'jersey_number': 2, 'date_of_birth': date(1996, 8, 22)},
    {'full_name': 'Charlie Brown', 'position': 'Center', 'jersey_number': 3, 'date_of_birth': date(1994, 12, 10)},
]

for member_data in members_data:
    TeamMember.objects.create(
        team=team,
        full_name=member_data['full_name'],
        position=member_data['position'],
        jersey_number=member_data['jersey_number'],
        date_of_birth=member_data['date_of_birth'],
        role=TeamMember.Role.PLAYER,
        status=TeamMember.Status.ACTIVE
    )

print(f'Team created: {team.name} (ID: {team.id})')
print(f'Members added: {team.members.count()}')
"

# 3. Create test event and division
python manage.py shell -c "
from events.models import Event, Division
from accounts.models import User
from django.utils import timezone
from datetime import timedelta

# Create organizer
organizer, created = User.objects.get_or_create(
    email='organizer@teams.com',
    defaults={
        'username': 'organizer',
        'role': 'ORGANIZER',
        'is_active': True
    }
)

# Create event
event = Event.objects.create(
    name='Test Basketball Tournament',
    sport_type='Basketball',
    description='Test tournament for teams system',
    start_datetime=timezone.now() + timedelta(days=7),
    end_datetime=timezone.now() + timedelta(days=8),
    location='Test Arena',
    capacity=100,
    fee_cents=0,
    created_by=organizer,
    lifecycle_status='published'
)

# Create division
division = Division.objects.create(
    event=event,
    name='Open Division',
    description='Open to all teams',
    max_teams=16
)

print(f'Event created: {event.name} (ID: {event.id})')
print(f'Division created: {division.name} (ID: {division.id})')
"

# 4. Test eligibility check
python manage.py shell -c "
from teams.services.eligibility import EligibilityChecker
from teams.models import Team
from events.models import Event, Division

team = Team.objects.get(name='Test Basketball Team')
event = Event.objects.get(name='Test Basketball Tournament')
division = Division.objects.get(event=event, name='Open Division')

# Check eligibility
result = EligibilityChecker.check_team_eligibility(team.id, event.id, division.id)
print(f'Eligibility check result: {result}')

# Get team summary
summary = EligibilityChecker.get_team_roster_summary(team.id)
print(f'Team summary: {summary}')
"

# 5. Create team entry
python manage.py shell -c "
from teams.models import Team, TeamEventEntry
from events.models import Event, Division

team = Team.objects.get(name='Test Basketball Team')
event = Event.objects.get(name='Test Basketball Tournament')
division = Division.objects.get(event=event, name='Open Division')

# Create entry
entry = TeamEventEntry.objects.create(
    team=team,
    event=event,
    division=division,
    note='Looking forward to competing!'
)

print(f'Entry created: {entry} (Status: {entry.status})')
"

# 6. Test organizer approval
python manage.py shell -c "
from teams.models import TeamEventEntry
from accounts.models import User

entry = TeamEventEntry.objects.get(note='Looking forward to competing!')
organizer = User.objects.get(email='organizer@teams.com')

# Approve entry
success = entry.approve(organizer, 'Welcome to the tournament!')
print(f'Entry approved: {success}')
print(f'New status: {entry.status}')
print(f'Decided by: {entry.decided_by}')
"

# 7. Test API endpoints
curl -X GET "http://127.0.0.1:8000/api/teams/" | python -m json.tool
curl -X GET "http://127.0.0.1:8000/api/teams/1/members/" | python -m json.tool
curl -X GET "http://127.0.0.1:8000/api/teams/1/entries/" | python -m json.tool

# 8. Test eligibility API
curl -X POST "http://127.0.0.1:8000/api/teams/eligibility/check/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "team_id": 1,
    "event_id": 1,
    "division_id": 1
  }' | python -m json.tool

# 9. Test frontend
# - Navigate to http://localhost:5173/teams/1
# - Verify team dashboard loads with roster and entries tabs
# - Test adding/editing team members
# - Test creating event entries
# - Test eligibility checking
# - Verify real-time updates (or 30s polling fallback)

# 10. Test real-time updates
# - Open browser console
# - Create/update team members or entries via API or frontend
# - Check for WebSocket messages or polling updates
# - Verify UI updates automatically

# 11. Run tests
python manage.py test teams.tests.test_teams

# 12. Test WebSocket connection
# - Open browser console
# - Navigate to team dashboard
# - Check for WebSocket connection status
# - Verify real-time updates or 30s polling fallback
```

### Data Model
```sql
-- Teams table
CREATE TABLE teams_team (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    sport VARCHAR(100) NOT NULL,
    manager_id INTEGER REFERENCES auth_user(id) NOT NULL,
    coach_id INTEGER REFERENCES auth_user(id),
    contact_email VARCHAR(254) NOT NULL,
    contact_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE teams_teammember (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams_team(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES auth_user(id),
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    position VARCHAR(100),
    jersey_number INTEGER CHECK (jersey_number >= 1 AND jersey_number <= 99),
    role VARCHAR(20) DEFAULT 'PLAYER',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team event entries table
CREATE TABLE teams_teamevententry (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams_team(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events_event(id) ON DELETE CASCADE,
    division_id INTEGER REFERENCES events_division(id),
    status VARCHAR(20) DEFAULT 'pending',
    note TEXT,
    decided_at TIMESTAMP WITH TIME ZONE,
    decided_by INTEGER REFERENCES auth_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tests
Run the teams tests:
```bash
cd timely-backend
python manage.py test teams.tests.test_teams
```

Expected test results:
- ✅ create_team_ok
- ✅ add_member_ok
- ✅ update_member_ok
- ✅ create_entry_pending_ok
- ✅ organizer_approve_ok
- ✅ withdraw_ok
- ✅ eligibility_check_examples_ok
- ✅ permissions_enforced_ok

## 🎫 Ticketing & Payments System

The platform includes a comprehensive ticketing and payments system with Stripe integration, digital tickets with QR codes, and real-time order management.

### Ticketing Features
1. **Ticket Types**: Create different ticket types for events/fixtures with pricing and inventory
2. **Order Management**: Complete order lifecycle from creation to payment confirmation
3. **Digital Tickets**: Generate unique QR codes for ticket validation and entry
4. **Inventory Control**: Prevent overselling with real-time inventory tracking
5. **Real-time Updates**: Live updates via WebSockets for order and ticket status changes
6. **RBAC Security**: Role-based access control for ticket management

### Payment Integration
- **Stripe Test Mode**: Full Stripe integration for secure payments
- **Webhook Processing**: Automatic order confirmation via Stripe webhooks
- **Refund Support**: Stub implementation for order cancellations and refunds
- **Payment Security**: Secure payment processing with proper error handling

### Key Features
- **Ticket Types**: Name, description, pricing, inventory, and availability controls
- **Order Processing**: Create orders, process payments, issue tickets automatically
- **QR Code Generation**: Server-generated QR payloads for ticket validation
- **Real-time Updates**: WebSocket notifications for order/ticket status changes
- **Modern UI**: Responsive checkout flow and ticket management interface
- **Inventory Management**: Prevent overselling with optimistic locking

### API Endpoints
```bash
# Public/Authenticated ticket types
GET    /api/ticketing/events/{event_id}/types/     # List available ticket types

# Order management
POST   /api/ticketing/orders/                      # Create ticket order
GET    /api/ticketing/orders/{order_id}/           # Get order details
POST   /api/ticketing/orders/{order_id}/cancel/    # Cancel order

# My tickets
GET    /api/ticketing/my-tickets/                  # List user's tickets
GET    /api/ticketing/tickets/{ticket_id}/         # Get ticket details

# Organizer/Admin ticket type management
POST   /api/ticketing/events/{event_id}/types/create/  # Create ticket type
PATCH  /api/ticketing/types/{id}/                      # Update ticket type
DELETE /api/ticketing/types/{id}/delete/               # Delete ticket type

# Organizer/Admin order management
GET    /api/ticketing/events/{event_id}/orders/    # List event orders

# Payments
POST   /api/payments/stripe/checkout/              # Create Stripe checkout session
POST   /api/payments/stripe/webhook/               # Stripe webhook endpoint
POST   /api/payments/refund/{order_id}/            # Create refund (admin/organizer)
```

### Ticketing Run & Verify Steps

1. **Set up Stripe test keys**:
   ```bash
   # Add to timely-backend/.env
   STRIPE_SECRET_KEY=sk_test_your_test_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

2. **Create and run migrations**:
   ```bash
   cd timely-backend
   python manage.py makemigrations tickets
   python manage.py migrate
   ```

3. **Create test event and ticket types**:
   ```bash
   python manage.py shell -c "
   from events.models import Event
   from tickets.models import TicketType
   from accounts.models import User
   from django.utils import timezone
   from datetime import timedelta

   # Create organizer
   organizer, created = User.objects.get_or_create(
       email='organizer@tickets.com',
       defaults={
           'username': 'organizer',
           'role': 'ORGANIZER',
           'is_active': True
       }
   )

   # Create event
   event = Event.objects.create(
       name='Test Ticketing Event',
       sport='Basketball',
       description='Test event for ticketing system',
       start_datetime=timezone.now() + timedelta(days=7),
       end_datetime=timezone.now() + timedelta(days=7, hours=2),
       location='Test Arena',
       capacity=100,
       fee_cents=0,
       created_by=organizer,
       lifecycle_status='published'
   )

   # Create ticket types
   general = TicketType.objects.create(
       event=event,
       name='General Admission',
       description='Standard seating',
       price_cents=2500,
       quantity_total=50
   )

   vip = TicketType.objects.create(
       event=event,
       name='VIP Pass',
       description='Premium seating with amenities',
       price_cents=5000,
       quantity_total=20
   )

   print(f'Event created: {event.name} (ID: {event.id})')
   print(f'Ticket types created: {event.ticket_types.count()}')
   "
   ```

4. **Test ticket type listing**:
   ```bash
   curl -X GET "http://127.0.0.1:8000/api/ticketing/events/1/types/" | python -m json.tool
   ```

5. **Create test order**:
   ```bash
   # First, get auth token by logging in
   TOKEN=$(curl -X POST http://127.0.0.1:8000/api/accounts/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"email": "user@test.com", "password": "testpass123"}' | \
     python -c "import sys, json; print(json.load(sys.stdin)['access'])")

   # Create order
   curl -X POST "http://127.0.0.1:8000/api/ticketing/orders/" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "event_id": 1,
       "items": [
         {"ticket_type_id": 1, "qty": 2},
         {"ticket_type_id": 2, "qty": 1}
       ]
     }' | python -m json.tool
   ```

6. **Test Stripe checkout**:
   ```bash
   # Create checkout session (replace ORDER_ID with actual order ID)
   curl -X POST "http://127.0.0.1:8000/api/payments/stripe/checkout/" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"order_id": 1}' | python -m json.tool
   ```

7. **Simulate webhook payment success**:
   ```bash
   # In test mode, you can manually mark order as paid
   python manage.py shell -c "
   from tickets.models import TicketOrder
   order = TicketOrder.objects.get(id=1)
   order.mark_paid(session_id='test_session', payment_intent='test_intent')
   print(f'Order {order.id} marked as paid')
   print(f'Tickets created: {order.tickets.count()}')
   "
   ```

8. **Test my tickets**:
   ```bash
   curl -X GET "http://127.0.0.1:8000/api/ticketing/my-tickets/" \
     -H "Authorization: Bearer $TOKEN" | python -m json.tool
   ```

9. **Test frontend**:
   - Navigate to `/events/1/checkout` in the frontend
   - Select ticket types and quantities
   - Proceed to checkout
   - Complete Stripe test payment
   - View tickets in "My Tickets" page
   - Verify QR codes are generated and displayed

10. **Test organizer functions**:
    ```bash
    # List event orders (as organizer)
    ORGANIZER_TOKEN=$(curl -X POST http://127.0.0.1:8000/api/accounts/auth/login/ \
      -H "Content-Type: application/json" \
      -d '{"email": "organizer@tickets.com", "password": "testpass123"}' | \
      python -c "import sys, json; print(json.load(sys.stdin)['access'])")

    curl -X GET "http://127.0.0.1:8000/api/ticketing/events/1/orders/" \
      -H "Authorization: Bearer $ORGANIZER_TOKEN" | python -m json.tool
    ```

11. **Test real-time updates**:
    - Open browser console
    - Create/update orders or tickets via API or frontend
    - Check for WebSocket messages or polling updates
    - Verify UI updates automatically

12. **Run tests**:
    ```bash
    python manage.py test tickets.tests.test_ticketing
    python manage.py test payments.tests.test_payments
    ```

### Data Model
```sql
-- Ticket types table
CREATE TABLE tickets_tickettype (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events_event(id) ON DELETE CASCADE,
    fixture_id INTEGER REFERENCES fixtures_fixture(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price_cents INTEGER CHECK (price_cents >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    quantity_total INTEGER CHECK (quantity_total >= 0),
    quantity_sold INTEGER DEFAULT 0 CHECK (quantity_sold >= 0),
    on_sale BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket orders table
CREATE TABLE tickets_ticketorder (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES accounts_user(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events_event(id) ON DELETE CASCADE,
    fixture_id INTEGER REFERENCES fixtures_fixture(id) ON DELETE CASCADE,
    total_cents INTEGER CHECK (total_cents >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending',
    provider VARCHAR(20) DEFAULT 'stripe',
    provider_session_id VARCHAR(255),
    provider_payment_intent VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets table
CREATE TABLE tickets_ticket (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES tickets_ticketorder(id) ON DELETE CASCADE,
    ticket_type_id INTEGER REFERENCES tickets_tickettype(id) ON DELETE CASCADE,
    qr_payload TEXT NOT NULL,
    serial VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(10) DEFAULT 'valid',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE
);
```

### Tests
Run the ticketing tests:
```bash
cd timely-backend
python manage.py test tickets.tests.test_ticketing
python manage.py test payments.tests.test_payments
```

Expected test results:
- ✅ create_order_and_checkout_url_ok (201 then 200 returns URL)
- ✅ webhook_marks_order_paid_and_issues_tickets_ok (simulate webhook payload)
- ✅ inventory_sold_counts_ok (quantity_sold increments, no oversell)
- ✅ my_tickets_list_ok (only owner sees their tickets)
- ✅ organizer_list_orders_ok (RBAC)

## 🔔 Notifications & Messaging System

The platform includes a comprehensive notifications and internal messaging system with real-time updates, email/SMS stubs, and role-based access control.

### Notifications Features
1. **Event-Driven Notifications**: Automatic notifications for registration decisions, schedule changes, payment confirmations, and announcements
2. **Real-time Toasts**: In-app toast notifications with auto-dismiss and accessibility features
3. **Email/SMS Stubs**: Development stubs for email and SMS delivery with templating system
4. **Filtering & Management**: Filter by read status, topic, and kind with mark-as-read functionality
5. **RBAC Security**: Users see their own notifications, organizers can create announcements to scoped audiences
6. **WebSocket Integration**: Real-time delivery with 30-second polling fallback

### Internal Messaging Features
1. **Threaded Conversations**: Create threads scoped to events, teams, registrations, or direct messages
2. **Participant Management**: Organizers can add/remove participants for their event scope
3. **Real-time Chat**: Live message delivery with typing indicators and read receipts
4. **Rate Limiting**: Simple spam protection with 10 messages per 30 seconds per thread
5. **Message Management**: Edit and soft-delete own messages with proper permissions
6. **Modern UI**: Two-pane layout with thread list and active conversation view

### Key Features
- **Notification Types**: Info, success, warning, error, and announcement notifications
- **Topic Categories**: Registration, schedule, results, ticket, payment, system, and message topics
- **Message Threads**: Scoped to events, teams, registrations, or direct conversations
- **Real-time Updates**: WebSocket notifications with polling fallback
- **Email/SMS Stubs**: Development stubs that log attempts and create delivery records
- **Modern UI**: Responsive design with Tailwind CSS and accessibility features

### API Endpoints
```bash
# Notifications
GET    /api/notify/                           # List user's notifications
POST   /api/notify/{id}/mark_read/            # Mark notification as read
POST   /api/notify/mark_all_read/             # Mark all notifications as read
POST   /api/notify/announce/                  # Create announcement (organizer/admin)

# Messaging
POST   /api/messages/threads/                 # Create message thread
GET    /api/messages/threads/                 # List user's threads
GET    /api/messages/threads/{id}/            # Get thread details
POST   /api/messages/threads/{id}/participants/  # Add participant
DELETE /api/messages/threads/{id}/participants/{user_id}/  # Remove participant
GET    /api/messages/threads/{id}/messages/   # List thread messages
POST   /api/messages/threads/{id}/messages/   # Send message
PATCH  /api/messages/messages/{id}/           # Edit message
DELETE /api/messages/messages/{id}/           # Delete message
```

### Notifications & Messaging Run & Verify Steps

1. **Create and run migrations**:
   ```bash
   cd timely-backend
   python manage.py makemigrations notifications
   python manage.py migrate
   ```

2. **Test notification creation**:
   ```bash
   python manage.py shell -c "
   from notifications.models import Notification
   from accounts.models import User
   
   user = User.objects.first()
   notification = Notification.objects.create(
       user=user,
       kind='success',
       topic='registration',
       title='Registration Approved',
       body='Your registration for Test Event has been approved.',
       link_url='/events/1/'
   )
   print(f'Notification created: {notification.title}')
   "
   ```

3. **Test announcement creation**:
   ```bash
   # Create announcement (organizer/admin only)
   curl -X POST "http://127.0.0.1:8000/api/notify/announce/" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ORGANIZER_TOKEN" \
     -d '{
       \"scope\": \"event\",
       \"scope_id\": \"1\",
       \"title\": \"Important Event Update\",
       \"body\": \"The event schedule has been updated. Please check the new times.\",
       \"kind\": \"announcement\",
       \"topic\": \"schedule\"
     }' | python -m json.tool
   ```

4. **Test message thread creation**:
   ```bash
   # Create direct message thread
   curl -X POST "http://127.0.0.1:8000/api/messages/threads/" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       \"scope\": \"direct\",
       \"title\": \"Direct Message\",
       \"participant_ids\": [2]
     }' | python -m json.tool
   ```

5. **Test sending messages**:
   ```bash
   # Send message to thread (replace THREAD_ID)
   curl -X POST "http://127.0.0.1:8000/api/messages/threads/1/send_message/" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       \"body\": \"Hello! This is a test message.\"
     }' | python -m json.tool
   ```

6. **Test frontend**:
   - Navigate to `/notifications` to view notifications with filtering
   - Navigate to `/messages` to access the messaging interface
   - Test creating threads and sending messages
   - Verify real-time toast notifications appear
   - Test mark-as-read functionality

7. **Test email/SMS stubs**:
   ```bash
   python manage.py shell -c "
   from notifications.services.email_sms import send_email, send_sms
   from notifications.models import Notification
   
   notification = Notification.objects.first()
   
   # Test email stub
   send_email(
       to='test@example.com',
       subject='Test Email',
       text='This is a test email body',
       notification=notification
   )
   
   # Test SMS stub
   send_sms(
       to='+1234567890',
       text='Test SMS message',
       notification=notification
   )
   
   print('Email and SMS stubs executed - check logs and DeliveryAttempt records')
   "
   ```

8. **Test real-time updates**:
   - Open browser console
   - Create notifications or send messages via API
   - Check for WebSocket messages or polling updates
   - Verify UI updates automatically
   - Test toast notifications appear and auto-dismiss

9. **Test rate limiting**:
   ```bash
   # Send multiple messages quickly to test rate limiting
   for i in {1..12}; do
     curl -X POST "http://127.0.0.1:8000/api/messages/threads/1/send_message/" \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer YOUR_TOKEN" \
       -d "{\"body\": \"Message $i\"}"
   done
   # Should see 429 error after 10 messages
   ```

10. **Run tests**:
    ```bash
    python manage.py test notifications.tests.test_notify
    ```

11. **Test WebSocket connection**:
    - Open browser console
    - Navigate to notifications or messages pages
    - Check for WebSocket connection status
    - Verify real-time updates or 30s polling fallback

### Data Model
```sql
-- Notifications table
CREATE TABLE notifications_notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES auth_user(id) ON DELETE CASCADE,
    kind VARCHAR(20) DEFAULT 'info',
    topic VARCHAR(20) DEFAULT 'system',
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    link_url VARCHAR(200),
    delivered_email BOOLEAN DEFAULT FALSE,
    delivered_sms BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message threads table
CREATE TABLE notifications_messagethread (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope VARCHAR(20) NOT NULL,
    scope_id VARCHAR(100),
    title VARCHAR(200),
    created_by_id INTEGER REFERENCES auth_user(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE notifications_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES notifications_messagethread(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES auth_user(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (length(body) <= 2000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Tests
Run the notifications tests:
```bash
cd timely-backend
python manage.py test notifications.tests.test_notify
```

Expected test results:
- ✅ notify_on_registration_decision_ok
- ✅ announce_to_event_participants_ok
- ✅ messaging_thread_create_and_post_ok
- ✅ rate_limit_blocks_spam_ok
- ✅ websocket_signal_noop_ok

## 🎭 Spectator Portal

The platform includes a comprehensive public spectator portal that allows visitors to browse events, view schedules, track results, and start ticket purchases without requiring authentication.

### Spectator Portal Features
1. **Public Event Browsing**: Browse all published events with advanced filtering by sport, date, and search terms
2. **Event Details**: View comprehensive event information including schedules, results, and leaderboards
3. **Real-time Updates**: Live updates via WebSockets when events, fixtures, results, or news change
4. **Ticket Purchase Flow**: Start ticket purchases with authentication required only at checkout
5. **News & Announcements**: Read latest news and announcements from the sports community
6. **Modern UI**: Production-ready design with responsive layouts, accessibility features, and professional aesthetics

### Key Features
- **No Authentication Required**: All spectator features are publicly accessible
- **Advanced Filtering**: Filter events by sport, date range, and search terms
- **Real-time Updates**: WebSocket subscriptions with 30-second polling fallback
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Accessibility**: WCAG 2.1 AA compliant with proper focus states and color contrast
- **Performance**: Lightweight caching for home page and news feeds

### API Endpoints
```bash
# Public spectator endpoints
GET    /api/public/home/                    # Home page aggregated data
GET    /api/public/events/                  # List published events with filters
GET    /api/public/events/{id}/             # Event detail with divisions
GET    /api/public/events/{id}/fixtures/    # Published fixtures for event
GET    /api/public/events/{id}/results/     # Results and leaderboard for event
GET    /api/public/news/                    # Published news and announcements
```

### Spectator Portal Run & Verify Steps

1. **Start backend and frontend servers**:
   ```bash
   # Backend (in timely-backend/)
   source venv/bin/activate && python manage.py runserver 127.0.0.1:8000
   
   # Frontend (in timely-frontend/)
   npm run dev
   ```

2. **Visit the home page** (`http://localhost:5173/`):
   - ✅ See featured events in hero section
   - ✅ View latest news items
   - ✅ See event statistics (upcoming count, tickets sold)
   - ✅ Test "Browse Events" and "View Schedule" buttons

3. **Browse events** (`http://localhost:5173/events`):
   - ✅ Use filters: sport dropdown, date range, search box
   - ✅ Verify pagination works correctly
   - ✅ Test responsive grid layout (1/2/3 columns by breakpoint)
   - ✅ Check empty states when no events match filters

4. **View event details** (`http://localhost:5173/events/{id}`):
   - ✅ Switch between Overview, Schedule, and Results tabs
   - ✅ See event information, divisions, and registration details
   - ✅ View published fixtures in Schedule tab
   - ✅ See results and leaderboard in Results tab
   - ✅ Test "Get Tickets" button (routes to login if not authenticated)

5. **Test schedule view** (`http://localhost:5173/schedule`):
   - ✅ See combined schedule across all events
   - ✅ Filter by sport, event, and date range
   - ✅ View fixtures grouped by date
   - ✅ Test responsive layout and empty states

6. **Test results view** (`http://localhost:5173/results`):
   - ✅ See results grouped by event
   - ✅ View leaderboards with team standings
   - ✅ Filter by sport, event, and date range
   - ✅ Test responsive tables and empty states

7. **Test news page** (`http://localhost:5173/news`):
   - ✅ View published news and announcements
   - ✅ Test pagination
   - ✅ Verify article formatting and dates
   - ✅ Test responsive layout

8. **Test real-time updates**:
   - ✅ Open multiple browser tabs
   - ✅ Create/update events, fixtures, results, or news in admin
   - ✅ Verify live updates via WebSocket or 30s polling fallback
   - ✅ Check browser console for WebSocket connection status

9. **Test authentication flow**:
   - ✅ Click "Get Tickets" on an event while not logged in
   - ✅ Verify redirect to login page with `next` parameter
   - ✅ Login and verify redirect back to event
   - ✅ Test ticket purchase flow

10. **Test API endpoints**:
    ```bash
    # Test home endpoint
    curl -X GET "http://127.0.0.1:8000/api/public/home/" | python -m json.tool
    
    # Test events list with filters
    curl -X GET "http://127.0.0.1:8000/api/public/events/?sport=Basketball&page=1" | python -m json.tool
    
    # Test event detail
    curl -X GET "http://127.0.0.1:8000/api/public/events/1/" | python -m json.tool
    
    # Test fixtures
    curl -X GET "http://127.0.0.1:8000/api/public/events/1/fixtures/" | python -m json.tool
    
    # Test results
    curl -X GET "http://127.0.0.1:8000/api/public/events/1/results/" | python -m json.tool
    
    # Test news
    curl -X GET "http://127.0.0.1:8000/api/public/news/?page=1" | python -m json.tool
    ```

11. **Test caching**:
    ```bash
    # Make multiple requests to home endpoint
    for i in {1..3}; do
      curl -X GET "http://127.0.0.1:8000/api/public/home/" | python -c "import sys, json; print(f'Request {i}: {len(json.load(sys.stdin)[\"heroEvents\"])} events')"
    done
    # Should see cached responses (faster subsequent requests)
    ```

12. **Run tests**:
    ```bash
    cd timely-backend
    python manage.py test public.tests.test_public
    ```

Expected test results:
- ✅ test_public_events_list_published_only_ok
- ✅ test_public_events_list_filters_ok
- ✅ test_public_event_detail_ok
- ✅ test_public_fixtures_only_published_ok
- ✅ test_public_fixtures_ordering_ok
- ✅ test_public_results_and_leaderboard_ok
- ✅ test_public_news_ok
- ✅ test_public_home_ok

### Frontend Components
- **Hero.jsx**: Featured events and statistics display
- **EventCard.jsx**: Individual event card with details and actions
- **EventFilters.jsx**: Advanced filtering interface with active filter display
- **FixtureList.jsx**: Match schedule display with team information
- **ResultsTable.jsx**: Match results with scores and details
- **LeaderboardTable.jsx**: Team standings with wins, losses, and point differences
- **TicketStrip.jsx**: Call-to-action for ticket purchases with auth routing
- **Pagination.jsx**: Responsive pagination with page numbers and navigation

### Real-time Features
- **WebSocket Subscriptions**: 
  - `events:list` - Event list updates
  - `events:item:{event_id}` - Event detail updates
  - `fixtures:event:{event_id}` - Schedule changes
  - `results:event:{event_id}` - Results and leaderboard updates
  - `content:news` - News and announcements
- **Polling Fallback**: 30-second polling when WebSocket unavailable
- **Auto-refresh**: Automatic data refresh on real-time updates

### Performance Features
- **Lightweight Caching**: 30-60 second cache for home page and news feeds
- **Optimized Queries**: Select_related and prefetch_related for efficient database access
- **Pagination**: Efficient pagination for large datasets
- **Responsive Images**: Optimized image loading and display

## 🔄 Updates

- **v1.0.0**: Initial release with core user management and RBAC
- **v1.1.0**: Added comprehensive venue management and availability scheduling
- **v1.2.0**: Added fixtures and scheduling system with RR/KO generation and conflict detection
- **v1.3.0**: Added teams and athletes management with roster management, event entries, and eligibility checking
- **v1.4.0**: Added ticketing and payments system with Stripe integration, digital tickets with QR codes, and real-time order management
- **v1.5.0**: Added notifications and internal messaging system with real-time updates, email/SMS stubs, and role-based access control
- **v1.6.0**: Added public spectator portal with event browsing, schedules, results, and ticket purchase flow
- Future versions will include advanced analytics and reporting

---

**Built with ❤️ using Django 5 + React + Tailwind CSS**

