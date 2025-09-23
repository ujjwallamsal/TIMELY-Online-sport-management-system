import { usePaginatedData, useCrud } from './useApiData';
import api from '../services/api';

/**
 * Hook for fetching events with pagination, search, and filters
 */
export const useEvents = (initialParams = {}, options = {}) => {
  return usePaginatedData(
    (params) => api.getEvents(params),
    initialParams,
    options
  );
};

/**
 * Hook for fetching a single event
 */
export const useEvent = (eventId, options = {}) => {
  const { data, loading, error, refetch } = usePaginatedData(
    () => api.getEvent(eventId),
    [],
    { immediate: !!eventId, ...options }
  );
  
  return {
    event: data?.[0] || data,
    loading,
    error,
    refetch
  };
};

/**
 * Hook for event CRUD operations
 */
export const useEventCrud = (options = {}) => {
  return useCrud({
    create: api.createEvent,
    get: api.getEvent,
    update: api.updateEvent,
    delete: api.deleteEvent
  }, options);
};

/**
 * Hook for event registrations
 */
export const useEventRegistrations = (eventId, initialParams = {}, options = {}) => {
  return usePaginatedData(
    (params) => api.get(`/events/${eventId}/registrations/`, params),
    initialParams,
    options
  );
};

/**
 * Hook for event fixtures
 */
export const useEventFixtures = (eventId, initialParams = {}, options = {}) => {
  return usePaginatedData(
    (params) => api.get(`/events/${eventId}/fixtures/`, params),
    initialParams,
    options
  );
};

/**
 * Hook for event results
 */
export const useEventResults = (eventId, initialParams = {}, options = {}) => {
  return usePaginatedData(
    (params) => api.get(`/events/${eventId}/results/`, params),
    initialParams,
    options
  );
};

/**
 * Hook for event leaderboard
 */
export const useEventLeaderboard = (eventId, options = {}) => {
  const { data, loading, error, refetch } = usePaginatedData(
    () => api.get(`/events/${eventId}/leaderboard/`),
    [],
    { immediate: !!eventId, ...options }
  );
  
  return {
    leaderboard: data,
    loading,
    error,
    refetch
  };
};

export default useEvents;
