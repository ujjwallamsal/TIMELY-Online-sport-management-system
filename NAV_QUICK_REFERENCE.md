# Navigation Quick Reference Guide

## Organizer Navigation Layout

### Desktop View (≥1280px)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [T] Timely  Dashboard  [Events ▼]  [Management ▼]  [Registrations ▼]   │
│                                                                           │
│                                         [🔍] [🔔3] [🎫] [👤 John ▼]     │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Left Section:
- **Logo**: Timely (blue T icon + text) → `/`
- **Dashboard** → `/dashboard`
- **Events** (dropdown):
  - Browse Events → `/events`
  - My Events → `/events/mine`
  - Create Event → `/events/create` ⭐
- **Management** (dropdown):
  - Fixtures → `/fixtures`
  - Results → `/results`
  - Venues → `/venues`
  - Announcements → `/announcements`
- **Registrations** (dropdown):
  - Registrations Review → `/registrations` `[5]` badge
  - Approvals → `/approvals` `[3]` badge

#### Right Section:
- **Search** 🔍 (icon button, coming soon)
- **Notifications** 🔔 (with unread badge)
- **My Tickets** 🎫 → `/tickets/me`
- **User Menu** 👤 (dropdown):
  - Profile → `/profile`
  - Account Settings → `/settings`
  - Sign Out

---

### Mobile View (<1024px)

```
┌─────────────────────────────────┐
│ [T] Timely      🔍 🔔3 👤 [☰]  │
└─────────────────────────────────┘

[When hamburger clicked ☰]
┌─────────────────────────────────┐
│ Dashboard                        │
│                                  │
│ Events                          │
│   Browse Events                 │
│   My Events                     │
│   Create Event                  │
│                                  │
│ Management                      │
│   Fixtures                      │
│   Results                       │
│   Venues                        │
│   Announcements                 │
│                                  │
│ Registrations                   │
│   Registrations Review    [5]   │
│   Approvals              [3]   │
│                                  │
│ My Tickets                      │
│                                  │
│ ─────────────────────────        │
│ Profile                         │
│ Settings                        │
└─────────────────────────────────┘
```

---

## Badge Counts

### Real-time Updates (Every 15 seconds)

| Badge | Location | Shows | For Roles |
|-------|----------|-------|-----------|
| 🔔 Notifications | Top-right bell | Unread count | All authenticated |
| Registrations Review | Registrations dropdown | Pending registrations | Organizer, Admin |
| Approvals | Registrations dropdown | Pending approvals | Coach, Organizer, Admin |

**Error Handling**: If endpoint fails, badge shows `0` (never breaks nav)

---

## Dropdown Interactions

### Desktop:
- **Click** parent item to toggle dropdown
- **Hover** shows pointer cursor
- **Click outside** to close
- **Escape key** to close
- **Active route** highlighted in blue

### Keyboard Navigation:
1. **Tab** to navigate between items
2. **Enter** or **Space** to open dropdown
3. **Escape** to close dropdown
4. **Tab** through dropdown items
5. **Enter** to select item

---

## Role-Specific Navigation

### Organizer/Admin:
```
Dashboard | Events ▼ | Management ▼ | Registrations ▼
```

### Coach:
```
Dashboard | Events | Teams | Schedule | Approvals [n]
```

### Athlete:
```
Dashboard | Events | Schedule | My Registrations | Results
```

### Spectator:
```
Home | Events | News | Gallery | Upgrade Role
```

### Not Authenticated:
```
Home | Events | News | Gallery | [Sign In] [Sign Up]
```

---

## Visual States

### Active Route:
```css
background: blue-50
color: blue-600
font-weight: medium
```

### Hover State:
```css
background: gray-50
color: blue-600
```

### Badge:
```css
background: red-500
color: white
font-size: xs
border-radius: full
padding: 0.5rem
```

### Dropdown Shadow:
```css
shadow: lg
border: gray-200
border-radius: md
```

---

## Sticky Header Behavior

### On Page Load:
```
┌─────────────────────────┐
│ Navbar (no shadow)      │
└─────────────────────────┘
Page content...
```

### After Scroll:
```
┌─────────────────────────┐ ← shadow-md applied
│ Navbar (with shadow)    │
└─────────────────────────┘
Page content...
```

**CSS**: `sticky top-0 z-40` with conditional `shadow-md` class

---

## Testing Checklist

### Quick Visual Tests:

1. **Desktop (1280px+)**:
   - [ ] All items fit on one line
   - [ ] Dropdowns open/close smoothly
   - [ ] Badges display correctly
   - [ ] Active route highlighted
   - [ ] Sticky header with scroll shadow

2. **Mobile (<1024px)**:
   - [ ] Hamburger menu appears
   - [ ] Menu slides in from right
   - [ ] All items present and grouped
   - [ ] Badges visible
   - [ ] Menu closes after navigation

3. **Badges**:
   - [ ] Update within 15 seconds
   - [ ] Show 0 if endpoint fails
   - [ ] Never break navigation
   - [ ] Format: `99+` for counts > 99

4. **Keyboard**:
   - [ ] Tab through all items
   - [ ] Enter/Space opens dropdowns
   - [ ] Escape closes dropdowns
   - [ ] Focus visible

5. **Permissions**:
   - [ ] Organizer sees full nav
   - [ ] Other roles see appropriate items
   - [ ] Direct URL access protected
   - [ ] Login redirect if not authenticated

---

## Component Tree

```
Navbar
├── Logo (Link to /)
├── Desktop Nav (hidden on mobile)
│   ├── NavItem (Dashboard)
│   ├── NavDropdown (Events)
│   │   ├── Browse Events
│   │   ├── My Events
│   │   └── Create Event
│   ├── NavDropdown (Management)
│   │   ├── Fixtures
│   │   ├── Results
│   │   ├── Venues
│   │   └── Announcements
│   └── NavDropdown (Registrations)
│       ├── Registrations Review [badge]
│       └── Approvals [badge]
├── Right Utilities
│   ├── Search Button
│   ├── Notifications Dropdown
│   ├── My Tickets Link
│   └── User Menu Dropdown
└── Mobile Menu (hamburger)
    └── Slide-in Panel
        ├── Navigation Items (grouped)
        ├── My Tickets
        └── Profile & Settings
```

---

## File Locations

| Component | Path |
|-----------|------|
| Main Navbar | `src/components/Navbar.tsx` |
| Dropdown | `src/components/NavDropdown.tsx` |
| Navigation Config | `src/config/navigation.ts` |
| Badge Hooks | `src/hooks/usePendingCounts.ts` |
| Routes | `src/app/routes.tsx` |

---

## API Endpoints Used

| Endpoint | Purpose | Hook |
|----------|---------|------|
| `/notifications/` | Unread notifications count | `useGetUnreadNotificationsCount()` |
| `/registrations/?status=PENDING` | Pending registrations count | `usePendingRegistrationsCount()` |
| `/registrations/?status=pending` | Pending approvals count | `usePendingApprovalsCount()` |

**Update Frequency**: 15 seconds (polling via React Query)

---

## Customization

### To add a new nav item:
```typescript
// src/config/navigation.ts
{
  label: 'New Item',
  to: '/new-path',
  badgeKey: 'optional-badge-key', // optional
}
```

### To add a new dropdown:
```typescript
{
  label: 'New Dropdown',
  children: [
    { label: 'Child 1', to: '/child-1' },
    { label: 'Child 2', to: '/child-2' },
  ],
}
```

### To add a new badge source:
```typescript
// src/hooks/usePendingCounts.ts
export const useNewBadgeCount = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['new-badge', 'count'],
    queryFn: async () => {
      // Fetch count...
    },
    enabled,
    refetchInterval: 15000,
  });
};
```

---

**Quick Start**: Login as Organizer → Navigate using dropdowns → Check badge counts → Test on mobile


