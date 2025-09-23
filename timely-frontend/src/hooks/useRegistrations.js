import { usePaginatedData, useCrud } from './useApiData';
import api from '../services/api';

/**
 * Hook for fetching registrations with pagination, search, and filters
 */
export const useRegistrations = (initialParams = {}, options = {}) => {
  return usePaginatedData(
    (params) => api.getRegistrations(params),
    initialParams,
    options
  );
};

/**
 * Hook for fetching a single registration
 */
export const useRegistration = (registrationId, options = {}) => {
  const { data, loading, error, refetch } = usePaginatedData(
    () => api.getRegistration(registrationId),
    [],
    { immediate: !!registrationId, ...options }
  );
  
  return {
    registration: data?.[0] || data,
    loading,
    error,
    refetch
  };
};

/**
 * Hook for registration CRUD operations
 */
export const useRegistrationCrud = (options = {}) => {
  return useCrud({
    create: api.createRegistration,
    get: api.getRegistration,
    update: api.updateRegistration,
    delete: api.deleteRegistration
  }, options);
};

/**
 * Hook for registration approval/rejection
 */
export const useRegistrationManagement = (options = {}) => {
  const approveRegistration = async (registrationId) => {
    try {
      await api.approveRegistration(registrationId);
      console.log('Registration approved successfully');
    } catch (err) {
      console.error('Failed to approve registration:', err.message);
      throw err;
    }
  };

  const rejectRegistration = async (registrationId, reason = '') => {
    try {
      await api.rejectRegistration(registrationId, reason);
      console.log('Registration rejected successfully');
    } catch (err) {
      console.error('Failed to reject registration:', err.message);
      throw err;
    }
  };

  return {
    approveRegistration,
    rejectRegistration
  };
};

export default useRegistrations;
