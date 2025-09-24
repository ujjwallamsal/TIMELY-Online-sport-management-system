import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { can } from '../../utils/capabilities.js';

/**
 * Component that renders children only if user has the required capability
 * @param {string} capability - Required capability (e.g., 'view_public_events')
 * @param {React.ReactNode} children - Children to render if capability is met
 * @param {React.ReactNode} fallback - Fallback content to render if capability is not met
 * @param {boolean} requireAuth - Whether authentication is required (default: true)
 */
export default function RequireCapability({ 
  capability, 
  children, 
  fallback = null, 
  requireAuth = true 
}) {
  const { user } = useAuth();

  // If auth is required but user is not logged in, don't render
  if (requireAuth && !user) {
    return fallback;
  }

  // If no capability specified, render children
  if (!capability) {
    return children;
  }

  // Check if user has the required capability
  const hasCapability = user ? can(user.role, capability) : false;

  return hasCapability ? children : fallback;
}

/**
 * Higher-order component version for easier usage
 * @param {string} capability - Required capability
 * @param {React.ReactNode} fallback - Fallback content
 * @returns {function} - HOC function
 */
export function withCapability(capability, fallback = null) {
  return function WrappedComponent(Component) {
    return function CapabilityWrappedComponent(props) {
      return (
        <RequireCapability capability={capability} fallback={fallback}>
          <Component {...props} />
        </RequireCapability>
      );
    };
  };
}
