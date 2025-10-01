/**
 * Centralized navigation configuration
 * Defines all navigation items with their roles and routes
 */

export type UserRole = 'SPECTATOR' | 'ATHLETE' | 'COACH' | 'ORGANIZER' | 'ADMIN';

export interface NavItem {
  label: string;
  to?: string; // Optional for parent items with children
  roles?: UserRole[]; // If undefined, accessible to all authenticated users
  public?: boolean; // If true, accessible without authentication
  external?: boolean; // If true, opens in new tab
  icon?: string;
  children?: NavItem[];
  badgeKey?: 'registrations' | 'approvals' | 'notifications'; // For badge counts
}

/**
 * Get navigation items for a specific role
 * Organized by role to provide clean, role-specific layouts
 */
export const getNavigationByRole = (role: UserRole | null, isAuthenticated: boolean): NavItem[] => {
  // Public (not authenticated)
  if (!isAuthenticated || !role) {
    return [
      { label: 'Home', to: '/', public: true },
      { label: 'Events', to: '/events', public: true },
      { label: 'News', to: '/news', public: true },
      { label: 'Gallery', to: '/gallery', public: true },
    ];
  }

  // Organizer navigation
  if (role === 'ORGANIZER' || role === 'ADMIN') {
    return [
      { label: 'Dashboard', to: '/dashboard' },
      {
        label: 'Events',
        children: [
          { label: 'Browse Events', to: '/events' },
          { label: 'My Events', to: '/events/mine' },
          { label: 'Create Event', to: '/events/create' },
        ],
      },
      {
        label: 'Management',
        children: [
          { label: 'Fixtures', to: '/fixtures' },
          { label: 'Results', to: '/results' },
          { label: 'Venues', to: '/venues' },
          { label: 'Announcements', to: '/announcements' },
        ],
      },
      {
        label: 'Registrations',
        children: [
          { label: 'Registrations Review', to: '/registrations', badgeKey: 'registrations' },
          { label: 'Approvals', to: '/approvals', badgeKey: 'approvals' },
        ],
      },
    ];
  }

  // Coach navigation
  if (role === 'COACH') {
    return [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Events', to: '/events' },
      { label: 'Teams', to: '/teams' },
      { label: 'Results', to: '/results' },
      { label: 'Approvals', to: '/approvals', badgeKey: 'approvals' },
    ];
  }

  // Athlete navigation
  if (role === 'ATHLETE') {
    return [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Events', to: '/events' },
      { label: 'Schedule', to: '/schedule' },
      { label: 'My Registrations', to: '/registrations' },
      { label: 'Results', to: '/results' },
    ];
  }

  // Spectator navigation
  return [
    { label: 'Home', to: '/' },
    { label: 'Events', to: '/events' },
    { label: 'News', to: '/news' },
    { label: 'Gallery', to: '/gallery' },
    { label: 'Upgrade Role', to: '/upgrade' },
  ];
};

// Legacy NAV array for backward compatibility
export const NAV: NavItem[] = [
  // Public navigation items
  {label:'Home', to:'/', public: true},
  {label:'Events', to:'/events', public: true},
  {label:'News', to:'/news', public: true},
  {label:'Gallery', to:'/gallery', public: true},

  // Common authenticated items
  {label:'My Tickets', to:'/tickets/me', roles:['SPECTATOR', 'ATHLETE', 'COACH', 'ORGANIZER', 'ADMIN']},
  {label:'Notifications', to:'/notifications', roles:['SPECTATOR', 'ATHLETE', 'COACH', 'ORGANIZER', 'ADMIN']},
  {label:'Profile', to:'/profile', roles:['SPECTATOR', 'ATHLETE', 'COACH', 'ORGANIZER', 'ADMIN']},
  
  // Spectator-specific
  {label:'Upgrade Role', to:'/upgrade', roles:['SPECTATOR']},
  
  // Athlete-specific
  {label:'Schedule', to:'/schedule', roles:['ATHLETE', 'COACH', 'SPECTATOR']},
  {label:'My Registrations', to:'/registrations', roles:['ATHLETE', 'COACH']},
  {label:'Results', to:'/results', roles:['ATHLETE', 'COACH', 'ORGANIZER', 'ADMIN', 'SPECTATOR']},
  
  // Coach-specific
  {label:'Teams', to:'/teams', roles:['COACH']},
  {label:'Approvals', to:'/approvals', roles:['COACH', 'ORGANIZER', 'ADMIN']},
  
  // Organizer/Admin-specific
  {label:'Event Management', to:'/events/create', roles:['ORGANIZER', 'ADMIN']},
  {label:'Registrations Review', to:'/registrations/review', roles:['ORGANIZER', 'ADMIN']},
  {label:'Announcements', to:'/announcements', roles:['ORGANIZER', 'ADMIN']},
  {label:'Venues', to:'/venues', roles:['ORGANIZER', 'ADMIN']},
  {label:'Fixtures', to:'/fixtures', roles:['ORGANIZER', 'ADMIN']},
];

/**
 * Filter navigation items based on user roles
 */
export function getNavigationItems(roles: string[] = [], isAuthenticated: boolean = false) {
  return NAV.filter(item => {
    // Public items are always shown
    if (item.public) {
      return true;
    }

    // For role-based items, check if user has any of the required roles
    if (isAuthenticated && roles.length > 0 && item.roles) {
      return item.roles.some(role => roles.includes(role));
    }

    return false;
  });
}

/**
 * Check if a route is accessible to a user
 */
export function canAccessRoute(route: string, roles: string[] = [], isAuthenticated: boolean = false): boolean {
  const item = NAV.find(navItem => navItem.to === route);
  
  if (!item) {
    return false; // Route not found in config
  }

  // Public routes (no roles specified) are always accessible
  if (!item.roles) {
    return true;
  }

  // For role-based routes, check if user is authenticated and has required role
  if (!isAuthenticated || roles.length === 0) {
    return false;
  }

  return item.roles.some(role => roles.includes(role));
}
