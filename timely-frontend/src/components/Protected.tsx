import React from 'react';
import { useAuth } from '../auth/useAuth';
import { Forbidden } from '../pages/Forbidden';

interface ProtectedProps {
  children: React.ReactNode;
  roles?: string[];
  fallback?: React.ReactNode;
}

/**
 * Protected component that checks user roles before rendering children
 */
export const Protected: React.FC<ProtectedProps> = ({ 
  children, 
  roles = [], 
  fallback = <Forbidden />
}) => {
  const { isAuthenticated, hasAnyRole } = useAuth();

  // If no roles specified, just check authentication
  if (roles.length === 0) {
    return isAuthenticated ? <>{children}</> : <>{fallback}</>;
  }

  // Check if user has any of the required roles
  if (!isAuthenticated || !hasAnyRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default Protected;