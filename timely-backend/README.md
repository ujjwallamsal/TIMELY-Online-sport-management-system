# Timely - Event Management System

A comprehensive event management system built with Django 5, DRF, PostgreSQL, and React.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 12+
- Node.js 18+ (for frontend)

### Environment Variables

#### Frontend (.env)
```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

#### Backend (.env)
```bash
DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=timely_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

### Database Setup

#### Option 1: Manual Database Reset (Recommended for Development)
```bash
# Drop and recreate the database
dropdb timely_db
createdb timely_db

# Apply migrations
python manage.py makemigrations accounts
python manage.py makemigrations
python manage.py migrate

# Create demo superuser
python manage.py make_demo_superuser --email admin@example.com --password Pass12345!
```

#### Option 2: Management Command (Development Only)
```bash
# Set environment variable to allow database dropping
export ALLOW_DB_DROP=1

# Run the database reset command
python manage.py db_reset_demo --force

# Apply migrations
python manage.py makemigrations accounts
python manage.py makemigrations
python manage.py migrate

# Create demo superuser
python manage.py make_demo_superuser --email admin@example.com --password Pass12345!
```

## 🔐 Authentication System

### JWT Authentication
The system uses JWT tokens stored in localStorage for frontend authentication:

- **Access Token**: Short-lived token for API requests
- **Refresh Token**: Long-lived token for refreshing access tokens
- **Authentication**: Bearer token in Authorization header

### API Endpoints

#### Authentication
```bash
# Login (accepts email or username)
POST /api/accounts/auth/login/
{
  "email": "admin@example.com",
  "password": "Pass12345!"
}

# Response
{
  "message": "Login successful",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": { ... }
}

# Logout
POST /api/accounts/auth/logout/

# Register
POST /api/accounts/auth/register/
```

#### User Management
```bash
# Get current user profile
GET /api/accounts/users/me/
Authorization: Bearer <access_token>

# Response
{
  "id": 1,
  "email": "admin@example.com",
  "username": "admin",
  "first_name": "Admin",
  "last_name": "User",
  "role": "ADMIN",
  ...
}
```

### Testing Authentication

#### Create Test User
```bash
python manage.py create_test_user --email test@example.com --password testpass123 --role SPECTATOR
```

#### Test with curl
```bash
# Login
curl -X POST http://127.0.0.1:8000/api/accounts/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Pass12345!"}'

# Get user profile (with token from login response)
curl -X GET http://127.0.0.1:8000/api/accounts/users/me/ \
  -H "Authorization: Bearer <access_token>"

# Test without auth (should return 401)
curl -X GET http://127.0.0.1:8000/api/accounts/users/me/
```

## 🔧 Migration System

### Why Admin Depends on Accounts

The `django.contrib.admin` app depends on `accounts.User` because:

1. **Custom User Model**: We use `AUTH_USER_MODEL = "accounts.User"` in settings
2. **Swappable Dependencies**: Admin creates `LogEntry` objects that reference the user model
3. **Migration Order**: Django must create the user table before admin can reference it

### App Order in INSTALLED_APPS

The correct order is critical:
```python
INSTALLED_APPS = [
    # Django core (order matters for custom user model)
    "django.contrib.contenttypes",
    "django.contrib.auth",
    
    # First-party (Timely) - accounts must come before admin
    "accounts",          # <- custom user lives here
    
    # Django admin (depends on accounts.User)
    "django.contrib.admin",
    # ... other apps
]
```

### Migration Troubleshooting

If you encounter migration issues:

1. **Clear Migration History**:
   ```bash
   python manage.py shell -c "from django.db import connection; cursor = connection.cursor(); cursor.execute('DELETE FROM django_migrations;'); print('Migration history cleared')"
   ```

2. **Reset Database** (Development Only):
   ```bash
   dropdb timely_db
   createdb timely_db
   ```

3. **Regenerate Migrations**:
   ```bash
   python manage.py makemigrations accounts
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Verify Table Creation**:
   ```bash
   python manage.py shell -c "from django.db import connection; cursor = connection.cursor(); cursor.execute('SELECT table_name FROM information_schema.tables WHERE table_schema = \\'public\\' AND table_name = \\'accounts_user\\';'); print('Tables:', cursor.fetchall())"
   ```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test accounts

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

### Test Database Issues

If tests fail with "relation does not exist":

1. **Clear Test Database**:
   ```bash
   dropdb test_timely_db
   ```

2. **Ensure Migrations Work**:
   ```bash
   python manage.py migrate --run-syncdb
   ```

3. **Check Migration Status**:
   ```bash
   python manage.py showmigrations
   ```

## 🛠️ Development Commands

### Management Commands

#### `db_reset_demo`
Resets the database for development:
```bash
export ALLOW_DB_DROP=1
python manage.py db_reset_demo --force
```

#### `make_demo_superuser`
Creates a demo superuser without prompts:
```bash
python manage.py make_demo_superuser \
  --email admin@example.com \
  --password Pass12345! \
  --first-name Admin \
  --last-name User
```

#### `create_test_user`
Creates a test user for development:
```bash
python manage.py create_test_user \
  --email test@example.com \
  --password testpass123 \
  --role SPECTATOR
```

#### `update_usernames`
Updates existing users with generated usernames:
```bash
python manage.py update_usernames
```

## 📁 Project Structure

```
timely-backend/
├── accounts/                 # Custom user model & authentication
│   ├── management/          # Management commands
│   ├── migrations/          # Database migrations
│   ├── models.py           # User, UserRole, AuditLog models
│   ├── views.py            # Authentication & user management
│   ├── backends.py         # Custom authentication backend
│   └── permissions.py      # RBAC permissions
├── timely/                  # Project settings
│   ├── settings.py         # Django configuration
│   └── urls.py            # URL routing
└── manage.py               # Django management script
```

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full system access
- **Organizer**: Event management
- **Athlete**: Participant access
- **Coach/Manager**: Team management
- **Spectator**: Read-only access

### JWT Authentication
- Access tokens in localStorage
- Refresh token rotation
- Bearer token authentication
- Custom authentication backend for email/username

### Frontend Integration
- Axios instance with interceptors
- Automatic token handling
- 401 response handling with redirect
- Environment-based API configuration

## 🚨 Common Issues & Solutions

### Issue: "relation does not exist"
**Cause**: Migration history mismatch or table not created
**Solution**: Reset database and regenerate migrations

### Issue: "Admin depends on accounts"
**Cause**: Wrong app order in INSTALLED_APPS
**Solution**: Ensure accounts comes before admin

### Issue: "Migration conflicts"
**Cause**: Inconsistent migration state
**Solution**: Clear migration history and regenerate

### Issue: "Invalid credentials" on login
**Cause**: Authentication backend not configured
**Solution**: Ensure AUTHENTICATION_BACKENDS includes custom backend

## 📚 Additional Resources

- [Django Custom User Model](https://docs.djangoproject.com/en/5.2/topics/auth/customizing/#substituting-a-custom-user-model)
- [Django Migrations](https://docs.djangoproject.com/en/5.2/topics/migrations/)
- [Django Admin](https://docs.djangoproject.com/en/5.2/ref/contrib/admin/)
- [DRF JWT Authentication](https://django-rest-framework-simplejwt.readthedocs.io/)

## 🤝 Contributing

1. Follow the migration order: `accounts` → `admin` → other apps
2. Test migrations work in both development and test databases
3. Use the management commands for database operations
4. Verify `AUTH_USER_MODEL` is set correctly
5. Test authentication endpoints with both email and username

---

**Note**: This system uses a custom user model with JWT authentication. Always ensure the `accounts` app is migrated before `django.contrib.admin` to avoid dependency issues.
