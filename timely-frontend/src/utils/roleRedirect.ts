/**
 * Role-based redirect utilities
 */

export type UserRole = 'SPECTATOR' | 'ATHLETE' | 'COACH' | 'ORGANIZER' | 'ADMIN';

/**
 * Get the default dashboard path for a user role
 */
export function getRoleDashboard(role: UserRole): string {
  const roleToPath: Record<UserRole, string> = {
    ADMIN: '/dashboard',
    ORGANIZER: '/dashboard', 
    COACH: '/dashboard',
    ATHLETE: '/dashboard',
    SPECTATOR: '/dashboard',
  };
  
  return roleToPath[role] || '/dashboard';
}

/**
 * Check if a user should be redirected to login
 */
export function shouldRedirectToLogin(currentPath: string): boolean {
  const publicPaths = ['/', '/login', '/register', '/events', '/news', '/gallery', '/tickets'];
  return !publicPaths.includes(currentPath);
}

/**
 * Get the appropriate redirect path after login
 */
export function getPostLoginRedirect(
  userRole: UserRole | undefined,
  returnTo: string | null,
  defaultPath: string = '/'
): string {
  // If there's a specific returnTo path and it's not the root, use it
  if (returnTo && returnTo !== '/' && returnTo !== '/login') {
    return returnTo;
  }
  
  // Otherwise, use role-based dashboard
  if (userRole) {
    return getRoleDashboard(userRole);
  }
  
  return defaultPath;
}
