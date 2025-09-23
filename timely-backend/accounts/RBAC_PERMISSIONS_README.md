# RBAC Permissions Implementation

This document describes the comprehensive Role-Based Access Control (RBAC) permissions system implemented for the DRF API, including audit logging for admin-sensitive actions.

## Overview

The system implements the following role-based permissions:

- **Organizer**: CRUD only for their events/venues and related objects
- **Coach**: R/W own team/roster; R on fixtures/results for their team's events  
- **Athlete**: R/W own profile; R on own fixtures/results; R on own tickets
- **Spectator**: R on public; R/W on their purchases only

## Files Structure

```
accounts/
├── models.py                    # User, UserRole, AuditLog models
├── permissions.py              # Legacy permissions + imports
├── rbac_permissions.py         # New comprehensive RBAC permissions
├── audit_mixin.py              # Audit logging mixin for views
├── view_permissions_example.py # Example implementations
└── RBAC_PERMISSIONS_README.md  # This documentation
```

## Permission Classes

### Core RBAC Permissions

#### 1. OrganizerPermissions
```python
from accounts.rbac_permissions import OrganizerPermissions

# Usage in ViewSet
permission_classes = [OrganizerPermissions]
```

**Access Rights:**
- ✅ CRUD on events they created (`created_by == user`)
- ✅ CRUD on venues they created (`created_by == user`)
- ✅ CRUD on objects belonging to their events/venues
- ✅ Admin/staff bypass all restrictions

#### 2. CoachPermissions
```python
from accounts.rbac_permissions import CoachPermissions

# Usage in ViewSet
permission_classes = [CoachPermissions]
```

**Access Rights:**
- ✅ R/W on teams they coach (`coach == user`)
- ✅ R/W on team members of their teams
- ✅ R on fixtures for events where they coach teams
- ✅ R on results for events where they coach teams
- ❌ Cannot write fixtures/results
- ✅ Admin/staff bypass all restrictions

#### 3. AthletePermissions
```python
from accounts.rbac_permissions import AthletePermissions

# Usage in ViewSet
permission_classes = [AthletePermissions]
```

**Access Rights:**
- ✅ R/W on their own user profile (`user == user`)
- ✅ R on fixtures where they're team members
- ✅ R on results where they're team members
- ✅ R on their own tickets (`purchase.user == user`)
- ✅ R on their own purchases (`user == user`)
- ✅ R on their own team memberships
- ❌ Cannot write fixtures/results/tickets
- ✅ Admin/staff bypass all restrictions

#### 4. SpectatorPermissions
```python
from accounts.rbac_permissions import SpectatorPermissions

# Usage in ViewSet
permission_classes = [SpectatorPermissions]
```

**Access Rights:**
- ✅ R on public events (`visibility == 'PUBLIC'`)
- ✅ R/W on their own tickets
- ✅ R/W on their own purchases
- ✅ R/W on their own user profile
- ✅ R on public data (objects with `visibility` or `is_public` fields)
- ❌ Cannot write events or other public data
- ✅ Admin/staff bypass all restrictions

### Utility Permission Classes

#### 5. MultiRolePermissions
```python
from accounts.rbac_permissions import MultiRolePermissions

# Allow multiple roles with different access levels
permission_classes = [
    MultiRolePermissions(
        allowed_roles=[UserRole.RoleType.ORGANIZER, UserRole.RoleType.COACH],
        read_only_roles=[UserRole.RoleType.ATHLETE]
    )
]
```

#### 6. PublicReadOnlyPermission
```python
from accounts.rbac_permissions import PublicReadOnlyPermission

# Public read access, authenticated write access
permission_classes = [PublicReadOnlyPermission]
```

#### 7. AdminSensitiveActionPermission
```python
from accounts.rbac_permissions import AdminSensitiveActionPermission

# Only admin/staff access for sensitive operations
permission_classes = [AdminSensitiveActionPermission]
```

### Convenience Permission Classes

```python
# Pre-configured multi-role permissions
from accounts.rbac_permissions import (
    OrganizerOrAdminPermission,
    CoachOrAdminPermission, 
    AthleteOrAdminPermission,
    SpectatorOrAdminPermission,
    MultiRoleWithOrganizerPermission,
    MultiRoleWithCoachPermission
)
```

## Audit Logging

### AuditLogMixin

The `AuditLogMixin` provides methods to log admin-sensitive actions:

```python
from accounts.audit_mixin import AuditLogMixin

class MyViewSet(AuditLogMixin, viewsets.ModelViewSet):
    def perform_create(self, serializer):
        instance = serializer.save()
        
        # Log the action
        self.log_event_action(
            request=self.request,
            action='EVENT_CREATE',
            event_id=instance.id,
            details={'created_by': self.request.user.id}
        )
        
        return instance
```

### AuditLogViewMixin

Automatic audit logging for ViewSets:

```python
from accounts.audit_mixin import AuditLogViewMixin

class MyViewSet(AuditLogViewMixin, viewsets.ModelViewSet):
    def perform_create(self, serializer):
        # Automatically logs the action
        return self.perform_create_with_audit(serializer)
    
    def perform_update(self, serializer):
        # Automatically logs the action
        return self.perform_update_with_audit(serializer)
    
    def perform_destroy(self, instance):
        # Automatically logs the action
        return self.perform_destroy_with_audit(instance)
```

### Audit Action Types

Available audit action types in `AuditLog.ActionType`:

```python
# User Management
USER_CREATE, USER_UPDATE, USER_DELETE, LOGIN, LOGOUT, PASSWORD_CHANGE, EMAIL_VERIFICATION

# Role Management  
ROLE_ASSIGNMENT, ROLE_REMOVAL, ROLE_REQUEST_APPROVED, ROLE_REQUEST_REJECTED

# Event Management
EVENT_CREATE, EVENT_UPDATE, EVENT_DELETE, EVENT_PUBLISH, EVENT_CANCEL

# Venue Management
VENUE_CREATE, VENUE_UPDATE, VENUE_DELETE

# Team Management
TEAM_CREATE, TEAM_UPDATE, TEAM_DELETE, TEAM_MEMBER_ADD, TEAM_MEMBER_REMOVE

# Fixture Management
FIXTURE_CREATE, FIXTURE_UPDATE, FIXTURE_DELETE, FIXTURE_PUBLISH

# Result Management
RESULT_CREATE, RESULT_UPDATE, RESULT_FINALIZE

# Payment Management
PAYMENT_PROCESSING, PAYMENT_REFUND

# KYC Management
KYC_APPROVED, KYC_REJECTED

# Admin Actions
ADMIN_ACTION, BULK_ACTION
```

## Implementation Examples

### Example 1: Event ViewSet
```python
class EventViewSet(AuditLogViewMixin, viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [PublicReadOnlyPermission]
        elif self.action == 'create':
            permission_classes = [OrganizerPermissions]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [OrganizerPermissions]
        elif self.action in ['publish', 'cancel']:
            permission_classes = [AdminSensitiveActionPermission]
        else:
            permission_classes = [OrganizerPermissions]
        
        return [permission() for permission in permission_classes]
```

### Example 2: Team ViewSet
```python
class TeamViewSet(AuditLogViewMixin, viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [PublicReadOnlyPermission]
        elif self.action == 'create':
            permission_classes = [MultiRoleWithOrganizerPermission()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [CoachPermissions]
        else:
            permission_classes = [CoachPermissions]
        
        return [permission() for permission in permission_classes]
```

### Example 3: Fixture ViewSet
```python
class FixtureViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [
                MultiRoleWithCoachPermission(
                    read_only_roles=['ATHLETE']  # Athletes get read-only access
                )
            ]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [OrganizerPermissions]
        else:
            permission_classes = [PublicReadOnlyPermission]
        
        return [permission() for permission in permission_classes]
```

### Example 4: Ticket ViewSet
```python
class TicketViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AthletePermissions, SpectatorPermissions]
        elif self.action == 'create':
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [AthletePermissions, SpectatorPermissions]
        else:
            permission_classes = [AthletePermissions, SpectatorPermissions]
        
        return [permission() for permission in permission_classes]
```

## Migration Guide

### From Legacy Permissions

1. **Replace legacy permission classes:**
   ```python
   # Old
   from accounts.permissions import IsOrganizerOfEvent
   permission_classes = [IsOrganizerOfEvent]
   
   # New
   from accounts.rbac_permissions import OrganizerPermissions
   permission_classes = [OrganizerPermissions]
   ```

2. **Add audit logging to sensitive operations:**
   ```python
   # Add AuditLogViewMixin to ViewSets that need audit logging
   class MyViewSet(AuditLogViewMixin, viewsets.ModelViewSet):
       # Use perform_*_with_audit methods
   ```

3. **Update permission logic in views:**
   ```python
   # Old manual role checking
   if request.user.role == 'ORGANIZER':
       # logic
   
   # New - handled by permission classes
   # Permission classes automatically handle role checking
   ```

### Database Migration

The `AuditLog` model is already defined in `accounts/models.py`. Run migrations to create the table:

```bash
python manage.py makemigrations accounts
python manage.py migrate
```

## Testing Permissions

### Test Cases to Implement

1. **Organizer Permissions:**
   - ✅ Can CRUD their own events
   - ❌ Cannot CRUD other organizers' events
   - ✅ Can CRUD their own venues
   - ✅ Admin can access all events

2. **Coach Permissions:**
   - ✅ Can R/W their own teams
   - ✅ Can R/W team members of their teams
   - ✅ Can R fixtures/results for their team's events
   - ❌ Cannot W fixtures/results
   - ❌ Cannot access other coaches' teams

3. **Athlete Permissions:**
   - ✅ Can R/W their own profile
   - ✅ Can R fixtures/results where they're team members
   - ✅ Can R their own tickets
   - ❌ Cannot W fixtures/results/tickets
   - ❌ Cannot access other athletes' data

4. **Spectator Permissions:**
   - ✅ Can R public events
   - ✅ Can R/W their own tickets/purchases
   - ✅ Can R/W their own profile
   - ❌ Cannot W events or other public data
   - ❌ Cannot access other spectators' data

5. **Audit Logging:**
   - ✅ Admin actions are logged with correct actor/action/target
   - ✅ Audit logs include IP address and user agent
   - ✅ Audit logs include relevant details

## Security Considerations

1. **Always use HTTPS in production** to protect audit logs and user data
2. **Regular audit log review** - implement monitoring for suspicious admin actions
3. **Role validation** - ensure roles are properly validated during assignment
4. **Permission testing** - comprehensive test coverage for all permission scenarios
5. **Audit log retention** - implement proper retention policies for audit data

## Troubleshooting

### Common Issues

1. **Permission denied errors:**
   - Check if user has correct role (legacy `role` field or RBAC `UserRole`)
   - Verify permission class is applied correctly
   - Check object-level permission logic

2. **Audit logging not working:**
   - Ensure `AuditLogMixin` or `AuditLogViewMixin` is included
   - Check if action is in `AUDIT_ACTIONS` mapping
   - Verify `should_audit_action()` returns `True`

3. **Role not recognized:**
   - Check both legacy `role` field and RBAC `UserRole` entries
   - Ensure `UserRole.is_active = True`
   - Verify role assignment logic

### Debug Permissions

Add debug logging to permission classes:

```python
import logging
logger = logging.getLogger(__name__)

class OrganizerPermissions(BaseRBACPermission):
    def has_object_permission(self, request, view, obj):
        logger.debug(f"Checking organizer permission for {request.user} on {obj}")
        # ... permission logic
```

## Support

For questions or issues with the RBAC permissions system:

1. Check this documentation first
2. Review the example implementations in `view_permissions_example.py`
3. Test with the provided test cases
4. Check Django/DRF documentation for additional context
