# Timely Sports - Route Tree & Navigation System

## Overview
This document outlines the comprehensive route tree and navigation system for the Timely Sports platform, organized by user roles and access levels.

## Route Structure

### Public Routes (Unauthenticated)
```
/                           # Home page with hero section and featured events
/login                      # User authentication
/signup                     # User registration
/password-reset             # Password recovery
/events                     # Public events listing
/events/:id                 # Public event details
/schedule                   # Public event schedule
/results                    # Public results and leaderboards
/news                       # News and announcements
/gallery                    # Media gallery
```

### Protected Routes (Authenticated)
```
/dashboard                  # Role-based dashboard
/profile                    # User profile management
/settings                   # User settings
/my-tickets                 # User's purchased tickets
/my-registrations           # User's event registrations
/events/:eventId/register   # Event registration wizard
```

### Role-Based Routes

#### Admin Routes (`/admin/*`)
```
/admin                      # Admin dashboard
/admin/events               # Event management
/admin/events/new           # Create new event
/admin/events/:id/edit      # Edit event
/admin/events/:id           # Event details
/admin/registrations        # Registration management
/admin/fixtures             # Fixture management
/admin/results              # Results management
/admin/venues               # Venue management
/admin/venues/new           # Create venue
/admin/venues/:id/edit      # Edit venue
/admin/users                # User management
/admin/announcements        # Announcement management
/admin/reports              # Analytics and reports
/admin/settings             # System settings
```

#### Organizer Routes (`/organizer/*`)
```
/organizer/dashboard        # Organizer dashboard
/organizer/events           # Event management
/organizer/events/create    # Create event
/organizer/events/:id/edit  # Edit event
/organizer/events/:eventId/registrations  # Event registrations
/organizer/fixtures         # Fixture management
/organizer/matches          # Match management
/organizer/results          # Results management
/organizer/venues           # Venue management
```

#### Athlete Routes (`/athlete/*`)
```
/athlete/dashboard          # Athlete dashboard
/athlete/events             # My events
/athlete/results            # My results and performance
/athlete/profile            # Athlete profile
```

#### Coach Routes (`/coach/*`)
```
/coach/dashboard            # Coach dashboard
/coach/events               # Team events
/coach/results              # Team results
/coach/profile              # Coach profile
```

## Navigation System

### Public Navigation (Unauthenticated Users)
- **Home** - Landing page with hero section
- **Events** - Browse all events
- **Schedule** - Event schedule
- **Results** - Results and leaderboards
- **News** - News and announcements
- **Gallery** - Media gallery
- **Sign In** - Login button
- **Sign Up** - Registration button

### Authenticated Navigation (All Users)
- **Home** - Public home page
- **Events** - Public events listing
- **Schedule** - Public event schedule
- **Results** - Public results
- **News** - News and announcements
- **Gallery** - Media gallery
- **Dashboard** - Role-based dashboard
- **My Tickets** - Purchased tickets
- **My Registrations** - Event registrations
- **Profile** - User profile
- **Settings** - User settings
- **Sign Out** - Logout

### Role-Specific Navigation

#### Admin Navigation
- All public navigation items
- **Admin Dashboard** - Admin overview
- **Events** - Event management
- **Users** - User management
- **Registrations** - Registration management
- **Fixtures** - Fixture management
- **Results** - Results management
- **Venues** - Venue management
- **Announcements** - Announcement management
- **Reports** - Analytics and reports
- **Settings** - System settings

#### Organizer Navigation
- All public navigation items
- **Event Management** - Manage events
- **Create Event** - Add new event
- **Fixtures** - Manage fixtures
- **Matches** - Manage matches
- **Results** - Manage results
- **Venues** - Manage venues

#### Athlete Navigation
- All public navigation items
- **My Events** - Personal events
- **My Results** - Performance tracking
- **Athlete Profile** - Athlete-specific profile

#### Coach Navigation
- All public navigation items
- **Team Events** - Team event management
- **Team Results** - Team performance
- **Coach Profile** - Coach-specific profile

## UI Components

### Core UI Kit (`src/components/ui/`)
- **Button** - Various button styles and sizes
- **Input** - Form input components
- **Select** - Dropdown selection component
- **Dialog** - Modal dialog component
- **Toast** - Notification system
- **DataTable** - Advanced data table with pagination, sorting, filtering
- **Skeleton** - Loading state components
- **EmptyState** - Empty state components
- **Card** - Content card component

### DataTable Features
- Server-side pagination
- 300ms debounced search
- Sticky header
- 14px body text
- px-4/py-3 cell padding
- Sortable columns
- Filterable columns
- Responsive design

## Real-time Features

### Live Channel Hook (`useLiveChannel`)
- WebSocket connection with EventSource fallback
- Automatic reconnection
- Real-time data updates
- Channel-based subscriptions
- Error handling and recovery

### Live Updates
- Admin dashboard statistics
- Public event leaderboards
- Real-time scoring
- Live event status updates
- Notification system

## Design System

### Color Scheme
- **Primary**: Blue (#3B82F6)
- **Secondary**: Purple (#8B5CF6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)
- **Info**: Blue (#3B82F6)

### Typography
- **Headings**: Inter font family
- **Body**: System font stack
- **Sizes**: 12px, 14px, 16px, 18px, 20px, 24px, 32px, 48px

### Spacing
- **Base unit**: 4px
- **Common**: 8px, 12px, 16px, 24px, 32px, 48px, 64px

### Responsive Breakpoints
- **Mobile**: 640px
- **Tablet**: 768px
- **Desktop**: 1024px
- **Large**: 1280px

## Accessibility Features

### WCAG 2.1 AA Compliance
- Keyboard navigation
- Screen reader support
- High contrast ratios
- Focus indicators
- Skip links
- ARIA labels
- Semantic HTML

### Navigation Accessibility
- Skip to main content link
- Keyboard navigation support
- Focus management
- Screen reader announcements
- High contrast mode support

## Security Features

### Route Protection
- Authentication guards
- Role-based access control
- Route-level permissions
- Redirect handling
- Session management

### Data Protection
- Input validation
- XSS prevention
- CSRF protection
- Secure API calls
- Error handling

## Performance Optimizations

### Code Splitting
- Route-based code splitting
- Component lazy loading
- Dynamic imports
- Bundle optimization

### Caching
- API response caching
- Component memoization
- Image optimization
- CDN integration

### Real-time Optimization
- WebSocket connection pooling
- Event throttling
- Debounced updates
- Efficient re-renders

## Development Guidelines

### File Structure
```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── layout/             # Layout components
│   └── Navigation.jsx      # Main navigation component
├── pages/
│   ├── admin/              # Admin pages
│   ├── athlete/            # Athlete pages
│   ├── coach/              # Coach pages
│   └── public/             # Public pages
├── routes/
│   └── index.jsx           # Main routing configuration
├── hooks/
│   └── useLiveChannel.js   # Real-time data hook
└── context/
    └── AuthContext.jsx     # Authentication context
```

### Naming Conventions
- **Components**: PascalCase (e.g., `Navigation.jsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useLiveChannel`)
- **Routes**: kebab-case (e.g., `/my-tickets`)
- **Files**: PascalCase for components, camelCase for utilities

### Best Practices
- Use TypeScript for type safety
- Implement proper error boundaries
- Follow accessibility guidelines
- Optimize for performance
- Write comprehensive tests
- Document all components
- Use consistent styling
- Implement proper loading states
- Handle edge cases gracefully
