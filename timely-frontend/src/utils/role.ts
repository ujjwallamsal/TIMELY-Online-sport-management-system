// Role-based access control utilities
export const ROLES = {
  ADMIN: 'ADMIN',
  ORGANIZER: 'ORGANIZER',
  COACH: 'COACH',
  ATHLETE: 'ATHLETE',
  SPECTATOR: 'SPECTATOR',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Feature access control maps
export const CAN_VIEW = {
  // Events
  EVENTS_LIST: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.COACH, ROLES.ATHLETE, ROLES.SPECTATOR],
  EVENTS_CREATE: [ROLES.ADMIN, ROLES.ORGANIZER],
  EVENTS_EDIT: [ROLES.ADMIN, ROLES.ORGANIZER],
  EVENTS_DELETE: [ROLES.ADMIN, ROLES.ORGANIZER],
  EVENTS_REGISTER: [ROLES.ATHLETE, ROLES.SPECTATOR],
  
  // Venues
  VENUES_LIST: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.COACH, ROLES.ATHLETE, ROLES.SPECTATOR],
  VENUES_CREATE: [ROLES.ADMIN, ROLES.ORGANIZER],
  VENUES_EDIT: [ROLES.ADMIN, ROLES.ORGANIZER],
  VENUES_DELETE: [ROLES.ADMIN, ROLES.ORGANIZER],
  
  // Fixtures
  FIXTURES_LIST: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.COACH, ROLES.ATHLETE, ROLES.SPECTATOR],
  FIXTURES_GENERATE: [ROLES.ADMIN, ROLES.ORGANIZER],
  FIXTURES_EDIT: [ROLES.ADMIN, ROLES.ORGANIZER],
  
  // Results
  RESULTS_LIST: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.COACH, ROLES.ATHLETE, ROLES.SPECTATOR],
  RESULTS_ENTER: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.COACH],
  RESULTS_EDIT: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.COACH],
  
  // Registrations
  REGISTRATIONS_LIST: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.COACH],
  REGISTRATIONS_APPROVE: [ROLES.ADMIN, ROLES.ORGANIZER],
  REGISTRATIONS_REJECT: [ROLES.ADMIN, ROLES.ORGANIZER],
  
  // News
  NEWS_LIST: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.COACH, ROLES.ATHLETE, ROLES.SPECTATOR],
  NEWS_CREATE: [ROLES.ADMIN, ROLES.ORGANIZER],
  NEWS_EDIT: [ROLES.ADMIN, ROLES.ORGANIZER],
  NEWS_DELETE: [ROLES.ADMIN, ROLES.ORGANIZER],
  
  // Gallery
  GALLERY_LIST: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.COACH, ROLES.ATHLETE, ROLES.SPECTATOR],
  GALLERY_UPLOAD: [ROLES.ADMIN, ROLES.ORGANIZER],
  GALLERY_DELETE: [ROLES.ADMIN, ROLES.ORGANIZER],
  
  // Tickets
  TICKETS_LIST: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.ATHLETE, ROLES.SPECTATOR],
  TICKETS_PURCHASE: [ROLES.ATHLETE, ROLES.SPECTATOR],
  TICKETS_MANAGE: [ROLES.ADMIN, ROLES.ORGANIZER],
  
  // Reports
  REPORTS_VIEW: [ROLES.ADMIN, ROLES.ORGANIZER],
  REPORTS_GENERATE: [ROLES.ADMIN, ROLES.ORGANIZER],
  
  // User Management
  USERS_LIST: [ROLES.ADMIN],
  USERS_EDIT: [ROLES.ADMIN],
  USERS_DELETE: [ROLES.ADMIN],
  ROLES_MANAGE: [ROLES.ADMIN],
} as const;

export const CAN_EDIT = {
  // Events
  EVENTS: [ROLES.ADMIN, ROLES.ORGANIZER],
  
  // Venues
  VENUES: [ROLES.ADMIN, ROLES.ORGANIZER],
  
  // Fixtures
  FIXTURES: [ROLES.ADMIN, ROLES.ORGANIZER],
  
  // Results
  RESULTS: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.COACH],
  
  // News
  NEWS: [ROLES.ADMIN, ROLES.ORGANIZER],
  
  // Gallery
  GALLERY: [ROLES.ADMIN, ROLES.ORGANIZER],
  
  // Users
  USERS: [ROLES.ADMIN],
} as const;

// Helper functions
export const canView = (feature: keyof typeof CAN_VIEW, userRoles: string[]): boolean => {
  const allowedRoles = CAN_VIEW[feature];
  return allowedRoles.some(role => userRoles.includes(role));
};

export const canEdit = (feature: keyof typeof CAN_EDIT, userRoles: string[]): boolean => {
  const allowedRoles = CAN_EDIT[feature];
  return allowedRoles.some(role => userRoles.includes(role));
};

// Dashboard routing based on role
export const getDashboardRoute = (roles: string[]): string => {
  if (roles.includes(ROLES.ADMIN)) {
    return '/dashboard/admin';
  }
  if (roles.includes(ROLES.ORGANIZER)) {
    return '/dashboard/organizer';
  }
  return '/dashboard';
};

// Role hierarchy (higher roles inherit permissions from lower roles)
export const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: [ROLES.ORGANIZER, ROLES.COACH, ROLES.ATHLETE, ROLES.SPECTATOR],
  [ROLES.ORGANIZER]: [ROLES.COACH, ROLES.ATHLETE, ROLES.SPECTATOR],
  [ROLES.COACH]: [ROLES.ATHLETE, ROLES.SPECTATOR],
  [ROLES.ATHLETE]: [ROLES.SPECTATOR],
  [ROLES.SPECTATOR]: [],
} as const;

// Role display names
export const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.ORGANIZER]: 'Organizer',
    [ROLES.COACH]: 'Coach',
    [ROLES.ATHLETE]: 'Athlete',
    [ROLES.SPECTATOR]: 'Spectator',
  };
  return roleMap[role] || role;
};