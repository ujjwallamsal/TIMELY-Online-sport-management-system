import { usePaginatedData, useCrud } from './useApiData';
import api from '../services/api';

/**
 * Hook for fetching users with pagination, search, and filters
 */
export const useUsers = (initialParams = {}, options = {}) => {
  return usePaginatedData(
    (params) => api.getUsers(params),
    initialParams,
    options
  );
};

/**
 * Hook for fetching admin users
 */
export const useAdminUsers = (initialParams = {}, options = {}) => {
  return usePaginatedData(
    (params) => api.getAdminUsers(params),
    initialParams,
    options
  );
};

/**
 * Hook for user CRUD operations
 */
export const useUserCrud = (options = {}) => {
  return useCrud({
    create: api.createUser,
    get: api.getCurrentUser,
    update: api.updateUser,
    delete: api.deleteUser
  }, options);
};

/**
 * Hook for admin user CRUD operations
 */
export const useAdminUserCrud = (options = {}) => {
  return useCrud({
    create: api.createAdminUser,
    get: (id) => api.get(`/admin/users/${id}/`),
    update: api.updateAdminUser,
    delete: api.deleteAdminUser
  }, options);
};

/**
 * Hook for user role management
 */
export const useUserRoleManagement = (options = {}) => {
  const activateUser = async (userId) => {
    try {
      await api.activateUser(userId);
      console.log('User activated successfully');
    } catch (err) {
      console.error('Failed to activate user:', err.message);
      throw err;
    }
  };

  const deactivateUser = async (userId) => {
    try {
      await api.deactivateUser(userId);
      console.log('User deactivated successfully');
    } catch (err) {
      console.error('Failed to deactivate user:', err.message);
      throw err;
    }
  };

  const changeUserRole = async (userId, role) => {
    try {
      await api.changeUserRole(userId, role);
      console.log('User role updated successfully');
    } catch (err) {
      console.error('Failed to update user role:', err.message);
      throw err;
    }
  };

  return {
    activateUser,
    deactivateUser,
    changeUserRole
  };
};

export default useUsers;
