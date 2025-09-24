// src/config/endpoints.js
// Central map of backend endpoints with fallback options

export const ENDPOINTS = {
  // DRF root discovery (optional)
  root: '/',

  // Stats cards (Total Users, Active Events, Tickets Sold, Total Revenue)
  // Use whichever exists in backend; try in order:
  stats: [
    'reports/admin/stats/',
    'reports/summary/',
    'admin/stats/',
  ],

  // Revenue time series (for chart range=week|month|year)
  revenue: [
    'reports/revenue/',
    'payments/revenue/',
  ],

  // User distribution by role (for pie)
  userDistribution: [
    'reports/users/by-role/',
    'stats/roles/',
  ],

  // Recent events
  recentEvents: [
    'events/',
    'events/recent/',
  ],

  // Recent registrations
  recentRegistrations: [
    'registrations/recent/',
    'events/registrations/recent/',
  ],

  // Unread notifications count
  notifications: [
    'notifications/unread-count/',
    'notifications/unread/',
  ],

  // Health check
  health: [
    'health/',
    'healthz/',
    'healthz',
  ],
};

// Helper to try multiple URLs and return first successful response
export const firstOk = async (api, urls, options = {}) => {
  for (const url of urls) {
    try {
      const response = await api.get(url, options);
      return response;
    } catch (error) {
      console.warn(`Failed to fetch ${url}:`, error.message);
      continue;
    }
  }
  throw new Error('All endpoints failed');
};

// Convenience functions for each data type
export const getStats = async (api) => {
  return firstOk(api, ENDPOINTS.stats);
};

export const getRevenue = async (api, range = 'year') => {
  return firstOk(api, ENDPOINTS.revenue, { params: { range } });
};

export const getUserDistribution = async (api) => {
  return firstOk(api, ENDPOINTS.userDistribution);
};

export const getRecentEvents = async (api) => {
  return firstOk(api, ENDPOINTS.recentEvents, { params: { ordering: '-created_at', page_size: 5 } });
};

export const getRecentRegistrations = async (api) => {
  return firstOk(api, ENDPOINTS.recentRegistrations);
};

export const getUnreadNotifications = async (api) => {
  return firstOk(api, ENDPOINTS.notifications);
};

export const getHealth = async (api) => {
  return firstOk(api, ENDPOINTS.health);
};
