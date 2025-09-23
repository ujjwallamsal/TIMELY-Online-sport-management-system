import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './ui/LoadingSpinner';

/**
 * RequireRole component for role-based route protection
 * Supports multiple roles and custom redirect paths
 */
const RequireRole = ({ 
  children, 
  roles = [], 
  redirectTo = '/login',
  fallback = null 
}) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return fallback || <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check if user has required role(s)
  const hasRequiredRole = roles.length === 0 || roles.includes(user.role);

  if (!hasRequiredRole) {
    // Redirect to appropriate dashboard based on user's role
    const roleBasedRedirect = getRoleBasedRedirect(user.role);
    return <Navigate to={roleBasedRedirect} replace />;
  }

  return <>{children}</>;
};

/**
 * Get role-based redirect path
 */
const getRoleBasedRedirect = (role) => {
  switch (role) {
    case 'ADMIN':
    case 'ORGANIZER':
      return '/admin';
    case 'COACH':
      return '/coach';
    case 'ATHLETE':
      return '/athlete';
    case 'SPECTATOR':
    default:
      return '/';
  }
};

/**
 * Higher-order component for role protection
 */
export const withRole = (WrappedComponent, roles = [], options = {}) => {
  return function RoleProtectedComponent(props) {
    return (
      <RequireRole roles={roles} {...options}>
        <WrappedComponent {...props} />
      </RequireRole>
    );
  };
};

export default RequireRole;
