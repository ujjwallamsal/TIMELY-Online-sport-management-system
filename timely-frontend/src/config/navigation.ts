/**
 * Centralized navigation configuration
 * Defines all navigation items with their roles and routes
 */

export type UserRole = 'SPECTATOR' | 'ATHLETE' | 'COACH' | 'ORGANIZER' | 'ADMIN';

export interface NavItem {
  label: string;
  to: string;
  roles?: UserRole[]; // If undefined, accessible to all authenticated users
  public?: boolean; // If true, accessible without authentication
  external?: boolean; // If true, opens in new tab
  icon?: string;
  children?: NavItem[];
}

export const NAV: NavItem[] = [
  // Public navigation items
  {label:'Home', to:'/', public: true},
  {label:'Events', to:'/events', public: true},
  {label:'News', to:'/news', public: true},
  {label:'Gallery', to:'/gallery', public: true},
  {label:'Tickets', to:'/tickets', public: true},

  // Back-office uses Django Admin only
  {label:'Django Admin', to:'http://127.0.0.1:8000/admin', public: true, external: true},
  
  // Spectator actions after login
  {label:'Upgrade Role', to:'/upgrade', roles:['SPECTATOR']},
  {label:'My Tickets', to:'/tickets/me', roles:['SPECTATOR']},
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
