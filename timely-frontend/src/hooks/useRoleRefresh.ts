import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

/**
 * Hook to handle automatic role-based routing when user roles change
 * This ensures users are redirected to the correct dashboard when an admin changes their role
 */
export const useRoleRefresh = () => {
  const { user, refreshUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const previousRoleRef = useRef<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Role-based dashboard mapping
  const getDashboardForRole = (role: string): string => {
    switch (role) {
      case 'ADMIN':
        return '/dashboard';
      case 'ORGANIZER':
        return '/dashboard';
      case 'COACH':
        return '/dashboard';
      case 'ATHLETE':
        return '/dashboard';
      case 'SPECTATOR':
      default:
        return '/dashboard';
    }
  };

  // Check if current route is appropriate for the user's role
  const isRouteAppropriate = (pathname: string, role: string): boolean => {
    // Admin routes
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return false;
    }
    
    // Organizer routes
    if (pathname.startsWith('/events/create') && !['ORGANIZER', 'ADMIN'].includes(role)) {
      return false;
    }
    
    if (pathname.startsWith('/fixtures') && !['ORGANIZER', 'ADMIN'].includes(role)) {
      return false;
    }
    
    // Coach routes
    if (pathname.startsWith('/results/enter') && !['COACH', 'ORGANIZER', 'ADMIN'].includes(role)) {
      return false;
    }
    
    // Athlete routes
    if (pathname.startsWith('/registrations') && !['ATHLETE', 'COACH', 'ORGANIZER', 'ADMIN'].includes(role)) {
      return false;
    }
    
    return true;
  };

  // Handle role change and redirect if necessary
  const handleRoleChange = (newRole: string, previousRole: string | null) => {
    if (!isAuthenticated || !user) return;
    
    const currentPath = location.pathname;
    const appropriateDashboard = getDashboardForRole(newRole);
    
    // If role changed and current route is not appropriate, redirect to appropriate dashboard
    if (previousRole && previousRole !== newRole) {
      console.log(`Role changed from ${previousRole} to ${newRole}, redirecting to ${appropriateDashboard}`);
      
      // Small delay to ensure UI updates are complete
      setTimeout(() => {
        navigate(appropriateDashboard, { replace: true });
      }, 100);
    }
    // If on an inappropriate route for current role, redirect
    else if (!isRouteAppropriate(currentPath, newRole)) {
      console.log(`Current route ${currentPath} not appropriate for role ${newRole}, redirecting to ${appropriateDashboard}`);
      navigate(appropriateDashboard, { replace: true });
    }
  };

  // Periodic refresh to check for role changes (every 2 minutes)
  const startPeriodicRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = setInterval(async () => {
      if (isAuthenticated && user) {
        try {
          await refreshUser();
        } catch (error) {
          console.warn('Failed to refresh user data:', error);
        }
      }
    }, 2 * 60 * 1000); // 2 minutes
  };

  // Stop periodic refresh
  const stopPeriodicRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  // Effect to handle role changes
  useEffect(() => {
    if (user && isAuthenticated) {
      const currentRole = user.role;
      const previousRole = previousRoleRef.current;
      
      handleRoleChange(currentRole, previousRole);
      previousRoleRef.current = currentRole;
    }
  }, [user?.role, isAuthenticated, location.pathname]);

  // Effect to manage periodic refresh
  useEffect(() => {
    if (isAuthenticated && user) {
      startPeriodicRefresh();
    } else {
      stopPeriodicRefresh();
    }
    
    return () => {
      stopPeriodicRefresh();
    };
  }, [isAuthenticated, user]);

  // Listen for storage updates (auth:logout events)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth:logout' && isAuthenticated) {
        // User was logged out in another tab, refresh user data
        refreshUser();
      }
    };

    const handleStorage = (e: CustomEvent) => {
      if (e.detail === 'auth:logout' && isAuthenticated) {
        refreshUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:logout', handleStorage as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:logout', handleStorage as EventListener);
    };
  }, [isAuthenticated, refreshUser]);

  // Refresh user data on window focus if last fetch was older than 60s
  useEffect(() => {
    let lastFetchTime = 0;

    const handleFocus = async () => {
      const now = Date.now();
      if (now - lastFetchTime > 60000 && isAuthenticated && user) { // 60 seconds
        try {
          await refreshUser();
          lastFetchTime = now;
        } catch (error) {
          console.warn('Failed to refresh user data on focus:', error);
        }
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, user, refreshUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPeriodicRefresh();
    };
  }, []);

  return {
    refreshUser,
    isRouteAppropriate,
    getDashboardForRole
  };
};
