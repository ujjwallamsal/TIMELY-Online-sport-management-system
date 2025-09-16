// src/config/endpoints.js
// Central map of backend endpoints with fallback options

export const ENDPOINTS = {
  // DRF root discovery (optional)
  root: '/api/',

  // Stats cards (Total Users, Active Events, Tickets Sold, Total Revenue)
  // Use whichever exists in backend; try in order:
  stats: [
    '/api/reports/admin/stats/',
    '/api/reports/summary/',
    '/api/admin/stats/',
  ],

  // Revenue time series (for chart range=week|month|year)
  revenue: [
    '/api/reports/revenue/',
    '/api/payments/revenue/',
  ],

  // User distribution by role (for pie)
  userDistribution: [
    '/api/reports/users/by-role/',
    '/api/accounts/stats/roles/',
  ],

  // Recent events
  recentEvents: [
    '/api/events/?ordering=-created_at&page_size=5',
    '/api/events/recent/',
  ],

  // Recent registrations
  recentRegistrations: [
    '/api/registrations/recent/',
    '/api/events/registrations/recent/',
  ],

  // Unread notifications count
  notifications: [
    '/api/notifications/unread-count/',
    '/api/accounts/notifications/unread/',
  ],

  // Health check
  health: [
    '/health/',
    '/api/health/',
    '/healthz',
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
  const urls = ENDPOINTS.revenue.map(url => `${url}?range=${range}`);
  return firstOk(api, urls);
};

export const getUserDistribution = async (api) => {
  return firstOk(api, ENDPOINTS.userDistribution);
};

export const getRecentEvents = async (api) => {
  return firstOk(api, ENDPOINTS.recentEvents);
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
