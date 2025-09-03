// api.js - API client for Timely frontend
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true, // For JWT cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    // JWT is handled via HttpOnly cookies, so no need to add token here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Ticketing API functions
export const ticketingAPI = {
  // List ticket types for an event
  listTicketTypes: (eventId, params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`/tickets/events/${eventId}/types/?${queryParams}`);
  },

  // Create ticket order
  createOrder: (payload) => {
    return api.post('/tickets/orders/', payload);
  },

  // Get order details
  getOrder: (orderId) => {
    return api.get(`/tickets/orders/${orderId}/`);
  },

  // Cancel order
  cancelOrder: (orderId) => {
    return api.post(`/tickets/orders/${orderId}/cancel/`);
  },

  // Get order summary
  getOrderSummary: (orderId) => {
    return api.get(`/tickets/orders/${orderId}/summary/`);
  },

  // List user's tickets
  listMyTickets: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`/tickets/my-tickets/?${queryParams}`);
  },

  // Get ticket details
  getTicket: (ticketId) => {
    return api.get(`/tickets/tickets/${ticketId}/`);
  },

  // Validate ticket (for scanning)
  validateTicket: (ticketId) => {
    return api.get(`/tickets/tickets/${ticketId}/validate/`);
  },

  // Use ticket (for check-in)
  useTicket: (ticketId) => {
    return api.post(`/tickets/tickets/${ticketId}/use/`);
  },

  // Organizer functions
  listEventOrders: (eventId, params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`/tickets/events/${eventId}/orders/?${queryParams}`);
  },

  // Create ticket type (organizer/admin)
  createTicketType: (eventId, payload) => {
    return api.post(`/tickets/events/${eventId}/types/create/`, payload);
  },

  // Update ticket type (organizer/admin)
  updateTicketType: (ticketTypeId, payload) => {
    return api.patch(`/tickets/types/${ticketTypeId}/`, payload);
  },

  // Delete ticket type (organizer/admin)
  deleteTicketType: (ticketTypeId) => {
    return api.delete(`/tickets/types/${ticketTypeId}/delete/`);
  },
};

// Payments API functions
export const paymentsAPI = {
  // Create Stripe checkout session
  stripeCheckout: (orderId) => {
    return api.post('/payments/stripe/checkout/', { order_id: orderId });
  },

  // Create refund (admin/organizer)
  createRefund: (orderId) => {
    return api.post(`/payments/refund/${orderId}/`);
  },
};

// Events API functions
export const eventsAPI = {
  // List events
  listEvents: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`/events/?${queryParams}`);
  },

  // Get event details
  getEvent: (eventId) => {
    return api.get(`/events/${eventId}/`);
  },

  // List fixtures for an event
  listFixtures: (eventId, params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`/fixtures/?event=${eventId}&${queryParams}`);
  },
};

// Auth API functions
export const authAPI = {
  // Login
  login: (credentials) => {
    return api.post('/accounts/login/', credentials);
  },

  // Logout
  logout: () => {
    return api.post('/accounts/logout/');
  },

  // Register
  register: (userData) => {
    return api.post('/accounts/register/', userData);
  },

  // Get current user
  getCurrentUser: () => {
    return api.get('/accounts/me/');
  },

  // Refresh token
  refreshToken: () => {
    return api.post('/accounts/refresh/');
  },
};

// Notifications API functions
export const notifyAPI = {
  // List user's notifications
  listNotifications: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`/notify/?${queryParams}`);
  },

  // Mark notification as read
  markNotificationRead: (id) => {
    return api.post(`/notify/${id}/mark_read/`);
  },

  // Mark all notifications as read
  markAllNotificationsRead: () => {
    return api.post('/notify/mark_all_read/');
  },

  // Create announcement (organizer/admin only)
  announce: (data) => {
    return api.post('/notify/announce/', data);
  },
};

// Messaging API functions
export const messagesAPI = {
  // Create message thread
  createThread: (data) => {
    return api.post('/messages/threads/', data);
  },

  // List user's threads
  listThreads: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`/messages/threads/?${queryParams}`);
  },

  // Get thread details
  getThread: (id) => {
    return api.get(`/messages/threads/${id}/`);
  },

  // Add participant to thread
  addThreadParticipant: (threadId, userId) => {
    return api.post(`/messages/threads/${threadId}/add_participant/`, {
      user_id: userId
    });
  },

  // Remove participant from thread
  removeThreadParticipant: (threadId, userId) => {
    return api.delete(`/messages/threads/${threadId}/participants/${userId}/`);
  },

  // List thread messages
  listThreadMessages: (threadId, params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`/messages/threads/${threadId}/messages/?${queryParams}`);
  },

  // Send message to thread
  sendMessage: (threadId, body) => {
    return api.post(`/messages/threads/${threadId}/send_message/`, { body });
  },

  // Edit message
  editMessage: (messageId, body) => {
    return api.patch(`/messages/messages/${messageId}/`, { body });
  },

  // Delete message (soft delete)
  deleteMessage: (messageId) => {
    return api.delete(`/messages/messages/${messageId}/`);
  },

  // Mark thread as read
  markThreadRead: (threadId) => {
    return api.get(`/messages/threads/${threadId}/messages/`);
  },
};

// Utility functions
export const utils = {
  // Format price in cents to display string
  formatPrice: (cents, currency = 'USD') => {
    const dollars = cents / 100;
    if (currency === 'USD') return `$${dollars.toFixed(2)}`;
    if (currency === 'EUR') return `€${dollars.toFixed(2)}`;
    if (currency === 'GBP') return `£${dollars.toFixed(2)}`;
    return `${dollars.toFixed(2)} ${currency}`;
  },

  // Format date for display
  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString();
  },

  // Format datetime for display
  formatDateTime: (dateString) => {
    return new Date(dateString).toLocaleString();
  },

  // Get status color for UI
  getStatusColor: (status) => {
    const colors = {
      pending: 'yellow',
      paid: 'green',
      failed: 'red',
      refunded: 'blue',
      cancelled: 'gray',
      valid: 'green',
      used: 'blue',
      void: 'red',
    };
    return colors[status] || 'gray';
  },
};

// ===== PUBLIC SPECTATOR PORTAL API =====
export const publicAPI = {
  // Get home page aggregated data
  getPublicHome: () => {
    return api.get('/public/home/');
  },

  // List published events with filters
  listPublicEvents: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`/public/events/?${queryParams}`);
  },

  // Get published event detail
  getPublicEvent: (eventId) => {
    return api.get(`/public/events/${eventId}/`);
  },

  // List published fixtures for an event
  listPublicFixtures: (eventId, params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`/public/events/${eventId}/fixtures/?${queryParams}`);
  },

  // Get published results and leaderboard for an event
  listPublicResults: (eventId) => {
    return api.get(`/public/events/${eventId}/results/`);
  },

  // List published news/announcements
  listPublicNews: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`/public/news/?${queryParams}`);
  },
};

export default api;