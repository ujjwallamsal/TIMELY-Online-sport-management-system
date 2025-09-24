// Role capabilities matrix - single source of truth for what each role can do
export const CAPABILITIES = {
  SPECTATOR: [
    'view_public_events',
    'view_news', 
    'view_media',
    'buy_tickets'
  ],
  ATHLETE: [
    'view_public_events',
    'view_news',
    'view_media', 
    'buy_tickets',
    'view_my_registrations',
    'view_my_schedule',
    'view_my_results',
    'upload_my_docs'
  ],
  COACH: [
    'view_public_events',
    'view_news',
    'view_media',
    'buy_tickets',
    'view_my_registrations',
    'view_my_schedule', 
    'view_my_results',
    'upload_my_docs',
    'manage_team_roster',
    'view_team_schedule',
    'confirm_lineups'
  ],
  ORGANIZER: [
    'view_public_events',
    'view_news',
    'view_media',
    'buy_tickets',
    'create_edit_events',
    'manage_registrations',
    'manage_fixtures', 
    'enter_results',
    'view_reports',
    'manage_venues',
    'manage_announcements'
  ],
  ADMIN: [
    'view_public_events',
    'view_news',
    'view_media',
    'buy_tickets',
    'create_edit_events',
    'manage_registrations',
    'manage_fixtures',
    'enter_results', 
    'view_reports',
    'manage_venues',
    'manage_announcements',
    'manage_users_roles',
    'system_settings',
    'audit_reports'
  ]
};

/**
 * Check if a user with the given role can perform a specific action
 * @param {string} role - User role (SPECTATOR, ATHLETE, COACH, ORGANIZER, ADMIN)
 * @param {string} action - Action to check (e.g., 'view_public_events')
 * @returns {boolean} - Whether the user can perform the action
 */
export function can(role, action) {
  if (!role || !action) return false;
  return CAPABILITIES[role]?.includes(action) || false;
}

/**
 * Get all capabilities for a given role
 * @param {string} role - User role
 * @returns {string[]} - Array of capabilities
 */
export function getCapabilities(role) {
  return CAPABILITIES[role] || [];
}

/**
 * Check if a user can access a specific route
 * @param {string} role - User role
 * @param {string} route - Route path (e.g., '/admin', '/organizer')
 * @returns {boolean} - Whether the user can access the route
 */
export function canAccessRoute(role, route) {
  const routePermissions = {
    '/admin': ['ADMIN'],
    '/organizer': ['ORGANIZER'],
    '/coach': ['COACH', 'ADMIN'],
    '/athlete': ['ATHLETE', 'ADMIN'],
    '/spectator': ['SPECTATOR', 'ATHLETE', 'COACH', 'ORGANIZER', 'ADMIN']
  };
  
  const allowedRoles = routePermissions[route];
  return allowedRoles ? allowedRoles.includes(role) : true; // Public routes default to true
}

/**
 * Get role display name
 * @param {string} role - User role
 * @returns {string} - Human-readable role name
 */
export function getRoleDisplayName(role) {
  const roleNames = {
    SPECTATOR: 'Spectator',
    ATHLETE: 'Athlete', 
    COACH: 'Coach',
    ORGANIZER: 'Organizer',
    ADMIN: 'Administrator'
  };
  return roleNames[role] || role;
}

/**
 * Get role hierarchy level (higher number = more privileges)
 * @param {string} role - User role
 * @returns {number} - Hierarchy level
 */
export function getRoleLevel(role) {
  const levels = {
    SPECTATOR: 1,
    ATHLETE: 2,
    COACH: 3,
    ORGANIZER: 4,
    ADMIN: 5
  };
  return levels[role] || 0;
}

/**
 * Check if one role has higher privileges than another
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {boolean} - Whether role1 has higher privileges than role2
 */
export function hasHigherPrivileges(role1, role2) {
  return getRoleLevel(role1) > getRoleLevel(role2);
}
