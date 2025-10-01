import React from 'react';
import { useRoleRefresh } from '../hooks/useRoleRefresh';

/**
 * Component that handles automatic role-based routing and periodic user data refresh
 * This ensures users are redirected when their roles change and keeps user data fresh
 */
const RoleRefresh: React.FC = () => {
  useRoleRefresh();
  return null; // This component doesn't render anything
};

export default RoleRefresh;
