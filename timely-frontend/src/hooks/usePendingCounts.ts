/**
 * Custom hooks for fetching pending counts for badges
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/ENDPOINTS';

/**
 * Hook to fetch pending registrations count
 * Gracefully returns 0 if endpoint fails
 */
export const usePendingRegistrationsCount = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['registrations', 'pending', 'count'],
    queryFn: async () => {
      try {
        const response = await api.get(ENDPOINTS.registrations, {
          params: { status: 'PENDING', page_size: 1 }
        });
        return response.data?.count || 0;
      } catch (error) {
        console.warn('Failed to fetch pending registrations count:', error);
        return 0;
      }
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: enabled ? 15 * 1000 : false, // Only refetch if enabled
    refetchOnWindowFocus: enabled, // Only refetch on focus if enabled
    retry: false,
  });
};

/**
 * Hook to fetch pending approvals count (role upgrade requests)
 * Gracefully returns 0 if endpoint fails
 */
export const usePendingApprovalsCount = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['approvals', 'pending', 'count'],
    queryFn: async () => {
      try {
        const response = await api.get(ENDPOINTS.registrations, {
          params: { status: 'pending', page_size: 1 }
        });
        return response.data?.count || 0;
      } catch (error) {
        console.warn('Failed to fetch pending approvals count:', error);
        return 0;
      }
    },
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: enabled ? 15 * 1000 : false, // Only refetch if enabled
    refetchOnWindowFocus: enabled, // Only refetch on focus if enabled
    retry: false,
  });
};

