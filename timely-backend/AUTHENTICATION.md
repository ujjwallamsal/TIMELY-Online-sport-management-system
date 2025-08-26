# Timely Authentication System

## Overview

This document describes the comprehensive authentication and role management system implemented for the Timely sports events platform.

## Features

### 🔐 JWT Authentication with HttpOnly Cookies
- **Secure**: Tokens stored in HttpOnly cookies (XSS protection)
- **Automatic**: No manual token management required
- **Refresh**: Automatic token refresh on expiration
- **Stateless**: No server-side session storage

### 👥 Role-Based Access Control (RBAC)
- **Admin**: Full system access and user management
- **Organizer**: Create and manage sports events
- **Athlete**: Participate in events and competitions
- **Coach**: Train athletes and manage teams
- **Spectator**: Browse events and purchase tickets

### 📧 Email Verification
- Email verification tokens for account activation
- Password reset functionality
- Secure token generation and validation

### 🌐 Real-Time Updates
- WebSocket connections for live user updates
- Automatic profile synchronization across sessions
- Connection status indicators

## API Endpoints

### Authentication
```
POST /api/accounts/login/          # Login with email/password
POST /api/accounts/logout/         # Logout and clear cookies
POST /api/accounts/refresh/        # Refresh access token
POST /api/accounts/signup/         # User registration
```

### User Management
```
GET    /api/users/me/              # Get current user profile
PATCH  /api/users/me/              # Update current user profile
GET    /api/users/                 # List all users (admin only)
PATCH  /api/users/{id}/update_role/ # Update user role (admin only)
```

### Email & Password
```
POST /api/accounts/email/verify/request/    # Request email verification
POST /api/accounts/email/verify/            # Verify email with token
POST /api/accounts/password/reset/request/  # Request password reset
POST /api/accounts/password/reset/confirm/  # Reset password with token
```

## Frontend Integration

### React Components
- **Login**: Modern, responsive login form
- **Signup**: Role selection with validation
- **Profile**: Editable user profile with real-time updates
- **AdminUsers**: User management interface for administrators

### WebSocket Hook
```javascript
import { useWebSocket } from '../hooks/useWebSocket';

function Profile() {
  const { connected } = useWebSocket();
  // connected indicates WebSocket status
}
```

### Authentication Context
```javascript
import { useAuth } from '../context/AuthContext';

function Component() {
  const { user, login, logout, isAdmin, isOrganizer } = useAuth();
  // Full authentication state and methods
}
```

## Security Features

### JWT Configuration
```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_SECURE": False,  # True in production
    "AUTH_COOKIE_SAMESITE": "Lax",
}
```

### Permission Classes
- `IsAdmin`: Admin-only access
- `IsOrganizerOrAdmin`: Organizer and admin access
- `IsAuthenticated`: Any authenticated user
- `AllowAny`: Public access

### CORS Configuration
```python
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = ["http://localhost:5173"]
```

## Database Models

### User Model
```python
class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80)
    role = models.CharField(max_length=12, choices=Role.choices)
    email_verified = models.BooleanField(default=False)
    email_token = models.CharField(max_length=64, blank=True)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
```

## WebSocket Channels

### User Updates
- **Channel**: `ws://localhost:8000/ws/user/`
- **Events**: `user.updated`
- **Purpose**: Real-time profile synchronization

### Event Updates
- **Channel**: `ws://localhost:8000/ws/events/{event_id}/`
- **Events**: `event_update`, `match_update`
- **Purpose**: Live event and match updates

## Development Setup

### Backend Dependencies
```bash
pip install djangorestframework-simplejwt
pip install channels
pip install django-cors-headers
```

### Environment Variables
```bash
SECRET_KEY=your-secret-key
DEBUG=True
ACCESS_TOKEN_LIFETIME_MIN=60
REFRESH_TOKEN_LIFETIME_DAYS=7
```

### Database Migration
```bash
python manage.py makemigrations accounts
python manage.py migrate
```

### Create Superuser
```bash
python manage.py createsuperuser
```

## Testing

### Run Tests
```bash
python manage.py test accounts
```

### Test Coverage
- User creation and authentication
- JWT token generation and validation
- Role-based permissions
- WebSocket connections
- API endpoint security

## Production Considerations

### Security
- Set `AUTH_COOKIE_SECURE = True` for HTTPS
- Use strong `SECRET_KEY`
- Enable HTTPS redirects
- Configure proper CORS origins

### Performance
- Use Redis for channel layers
- Implement token blacklisting
- Add rate limiting
- Monitor WebSocket connections

### Monitoring
- Log authentication attempts
- Track WebSocket connections
- Monitor token refresh patterns
- Alert on security events

## Troubleshooting

### Common Issues
1. **CORS errors**: Check `CORS_ALLOWED_ORIGINS`
2. **Cookie not set**: Verify `credentials: 'include'` in frontend
3. **WebSocket connection failed**: Check channel layer configuration
4. **Permission denied**: Verify user role and permissions

### Debug Mode
```python
DEBUG = True
LOGGING = {
    'handlers': ['console'],
    'level': 'DEBUG',
}
```

## API Documentation

Full API documentation is available at:
- **Swagger UI**: `/api/docs/`
- **OpenAPI Schema**: `/api/schema/`

## Support

For authentication system support:
1. Check the test suite for examples
2. Review the permission classes
3. Verify WebSocket configuration
4. Check browser console for errors
