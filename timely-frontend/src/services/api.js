/**
 * API Service - Handles all backend communication
 * Provides a clean interface for making HTTP requests with authentication
 */
export class API {
  constructor() {
    this.baseURL = this.getBaseURL();
    this.token = this.getStoredToken();
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Get the base URL for API requests
   * Checks environment variables and falls back to default
   */
  getBaseURL() {
    // Single API surface enforced: always use "/api" so Vite proxy handles host
    return '/api';
  }

  /**
   * Get stored authentication token
   */
  getStoredToken() {
    return localStorage.getItem('auth_token');
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Get request headers with authentication
   */
  getHeaders(customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  /**
   * Make HTTP request with error handling
   */
  async request(url, options = {}) {
    // Ensure proper URL joining
    let fullUrl;
    let path;
    if (url.startsWith('http')) {
      fullUrl = url;
      try {
        const u = new URL(url);
        path = u.pathname;
      } catch {
        path = '/';
      }
    } else {
      // Remove trailing slash from baseURL and add leading slash to url if missing
      const baseUrl = this.baseURL.replace(/\/$/, '');
      path = url.startsWith('/') ? url : `/${url}`;
      fullUrl = `${baseUrl}${path}`;
    }
    
    const config = {
      headers: this.getHeaders(options.headers),
      ...options
    };

    // Do not send auth header to public or auth endpoints to avoid 401 on open routes
    const isPublic = path.startsWith('/public/');
    const isAuth = path.startsWith('/auth/');
    if (isPublic || isAuth) {
      if (config.headers && 'Authorization' in config.headers) {
        delete config.headers['Authorization'];
      }
    }

    try {
      const response = await fetch(fullUrl, config);
      
      // Handle different response types
      if (!response.ok) {
        const errorData = await this.parseResponse(response);
        throw new APIError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      return await this.parseResponse(response);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      // Network or other errors
      throw new APIError(
        error.message || 'Network error',
        0,
        { originalError: error }
      );
    }
  }

  /**
   * Parse response based on content type
   */
  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    if (contentType && contentType.includes('text/csv')) {
      return await response.text();
    }
    
    return await response.text();
  }

  /**
   * GET request
   */
  async get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    
    return this.request(fullUrl, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(url, data = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   */
  async put(url, data = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * PATCH request
   */
  async patch(url, data = {}) {
    return this.request(url, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   */
  async delete(url) {
    return this.request(url, { method: 'DELETE' });
  }

  /**
   * Upload file
   */
  async upload(url, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    return this.request(url, {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }

  /**
   * Download file
   */
  async download(url, filename) {
    const response = await fetch(`${this.baseURL}${url}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new APIError(`Download failed: ${response.statusText}`, response.status);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Paginated request helper
   */
  async paginate(url, params = {}, page = 1, pageSize = 20) {
    const paginationParams = {
      page,
      page_size: pageSize,
      ...params
    };
    
    const response = await this.get(url, paginationParams);
    
    return {
      data: response.results || response.data || [],
      pagination: {
        page: response.page || page,
        pageSize: response.page_size || pageSize,
        total: response.count || response.total || 0,
        totalPages: Math.ceil((response.count || response.total || 0) / (response.page_size || pageSize)),
        hasNext: response.next ? true : false,
        hasPrevious: response.previous ? true : false,
        next: response.next,
        previous: response.previous
      }
    };
  }

  /**
   * Poll for updates (SSE fallback)
   */
  async poll(url, interval = 5000, onUpdate = () => {}) {
    let isPolling = true;
    
    const poll = async () => {
      if (!isPolling) return;
      
      try {
        const data = await this.get(url);
        onUpdate(data);
      } catch (error) {
        console.error('Polling error:', error);
      }
      
      if (isPolling) {
        setTimeout(poll, interval);
      }
    };
    
    // Start polling
    poll();
    
    // Return stop function
    return () => {
      isPolling = false;
    };
  }

  // Authentication endpoints
  async login(email, password) {
    const response = await this.post('/auth/login', { email, password });
    if (response.access) {
      this.setToken(response.access);
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser() {
    return this.get('/me');
  }

  async refresh() {
    return this.post('/auth/refresh');
  }

  async updateMe(data) {
    return this.patch('/me', data);
  }

  // Events endpoints
  async getEvents(params = {}) {
    return this.paginate('/events/', params);
  }

  async getEvent(id) {
    return this.get(`/events/${id}/`);
  }

  async createEvent(data) {
    return this.post('/events/', data);
  }

  async updateEvent(id, data) {
    return this.patch(`/events/${id}/`, data);
  }

  async cancelEvent(id) {
    return this.post(`/events/${id}/cancel/`);
  }

  async deleteEvent(id) {
    return this.delete(`/events/${id}/`);
  }

  async publishEvent(id) {
    return this.post(`/events/${id}/publish/`);
  }

  async unpublishEvent(id) {
    return this.post(`/events/${id}/unpublish/`);
  }

  // Venues endpoints
  async getVenues(params = {}) {
    return this.paginate('/venues/', params);
  }

  async getVenue(id) {
    return this.get(`/venues/${id}/`);
  }

  async createVenue(data) {
    return this.post('/venues/', data);
  }

  async updateVenue(id, data) {
    return this.patch(`/venues/${id}/`, data);
  }

  async deleteVenue(id) {
    return this.delete(`/venues/${id}/`);
  }

  // Registrations endpoints
  async getRegistrations(params = {}) {
    return this.paginate('/registrations/', params);
  }

  async getRegistration(id) {
    return this.get(`/registrations/${id}/`);
  }

  async createRegistration(data) {
    return this.post('/registrations/', data);
  }

  async updateRegistration(id, data) {
    return this.patch(`/registrations/${id}/`, data);
  }

  async approveRegistration(id) {
    return this.patch(`/registrations/${id}/approve/`);
  }

  async rejectRegistration(id, reason = '') {
    return this.patch(`/registrations/${id}/reject/`, { reason });
  }

  // Fixtures endpoints
  async getFixtures(params = {}) {
    return this.paginate('/fixtures/', params);
  }

  async getFixture(id) {
    return this.get(`/fixtures/${id}/`);
  }

  async createFixture(data) {
    return this.post('/fixtures/', data);
  }

  async updateFixture(id, data) {
    return this.patch(`/fixtures/${id}/`, data);
  }

  async deleteFixture(id) {
    return this.delete(`/fixtures/${id}/`);
  }

  async generateFixtures(eventId) {
    return this.post(`/fixtures/generate/${eventId}/`);
  }

  // Results endpoints
  async getResults(params = {}) {
    return this.paginate('/results/', params);
  }

  async getResult(id) {
    return this.get(`/results/${id}/`);
  }

  async createResult(data) {
    return this.post('/results/', data);
  }

  async updateResult(id, data) {
    return this.patch(`/results/${id}/`, data);
  }

  async deleteResult(id) {
    return this.delete(`/results/${id}/`);
  }

  async getLeaderboard(eventId) {
    return this.get(`/events/${eventId}/leaderboard/`);
  }

  // Tickets endpoints
  async getTickets(params = {}) {
    return this.paginate('/tickets/', params);
  }

  async getTicket(id) {
    return this.get(`/tickets/${id}/`);
  }

  async createTicket(data) {
    return this.post('/tickets/', data);
  }

  async updateTicket(id, data) {
    return this.patch(`/tickets/${id}/`, data);
  }

  async deleteTicket(id) {
    return this.delete(`/tickets/${id}/`);
  }

  // Reports endpoints
  async getReports() {
    return this.get('/reports/');
  }

  async exportEventsCSV() {
    return this.download('/reports/events/', 'events.csv');
  }

  async exportRegistrationsCSV() {
    return this.download('/reports/registrations/', 'registrations.csv');
  }

  async exportFixturesCSV() {
    return this.download('/reports/fixtures/', 'fixtures.csv');
  }

  async exportResultsCSV() {
    return this.download('/reports/results/', 'results.csv');
  }

  // Notifications endpoints
  async getNotifications(params = {}) {
    return this.paginate('/notifications/', params);
  }

  async markNotificationRead(id) {
    return this.patch(`/notifications/${id}/read/`);
  }

  async markAllNotificationsRead() {
    return this.post('/notifications/mark-all-read/');
  }
}

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(message, status = 0, data = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

// Create and export a default API instance
const api = new API();
export default api;

// Export individual functions for backward compatibility
export const getEvent = (id) => api.get(`/events/${id}/`);
export const getEventRegistrations = (id) => api.get(`/events/${id}/registrations/`);
export const getEventFixtures = (id) => api.get(`/events/${id}/fixtures/`);
export const getEventResults = (id) => api.get(`/events/${id}/results/`);

// Public API functions
export const getPublicEvent = (id) => api.get(`/public/events/${id}/`);
// Correct param passing for public events list
export const getPublicEvents = (params = {}) => api.get('/public/events/', params);
export const getPublicEventFixtures = (id) => api.get(`/public/events/${id}/fixtures/`);
export const getPublicEventResults = (id) => api.get(`/public/events/${id}/results/`);
export const getPublicEventLeaderboard = (id) => api.get(`/public/events/${id}/leaderboard/`);
export const getPublicResults = (params = {}) => api.get('/results/public/results/', { params });

// Other commonly used functions
export const listEvents = (params = {}) => api.get('/events/', { params });
export const getEvents = (params = {}) => api.get('/events/', { params }); // Alias for listEvents
export const createEvent = (data) => api.post('/events/', data);
export const updateEvent = (id, data) => api.patch(`/events/${id}/`, data);
export const deleteEvent = (id) => api.delete(`/events/${id}/`);
export const publishEvent = (id) => api.post(`/events/${id}/publish/`);
export const unpublishEvent = (id) => api.post(`/events/${id}/unpublish/`);
export const cancelEvent = (id) => api.post(`/events/${id}/cancel/`);

// Admin user functions
export const getAdminUsers = (params = {}) => api.get('/admin/users/', { params });
export const createAdminUser = (data) => api.post('/admin/users/', data);
export const updateAdminUser = (id, data) => api.put(`/admin/users/${id}/`, data);
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}/`);
export const activateUser = (id) => api.post(`/admin/users/${id}/activate/`);
export const deactivateUser = (id) => api.post(`/admin/users/${id}/deactivate/`);
export const changeUserRole = (id, role) => api.post(`/admin/users/${id}/change-role/`, { role });

// Venue functions
export const getVenues = (params = {}) => api.get('/venues/', { params });
export const createVenue = (data) => api.post('/venues/', data);
export const updateVenue = (id, data) => api.put(`/venues/${id}/`, data);
export const deleteVenue = (id) => api.delete(`/venues/${id}/`);

// Public pages
export const getPublicPage = (slug) => api.get(`/public/pages/${slug}/`);
export const getPublicBanners = () => api.get('/public/banners/');

// API modules for organized imports
export const publicAPI = {
  getEvent: getPublicEvent,
  // Provide paginated interface for tables
  getEvents: (params = {}) => api.paginate('/public/events/', params),
  getEventFixtures: getPublicEventFixtures,
  getEventResults: getPublicEventResults,
  getEventLeaderboard: getPublicEventLeaderboard,
  getResults: getPublicResults,
  getMedia: (params = {}) => api.get('/public/media/', params),
  getNews: (params = {}) => api.get('/content/public/news/', params),
  getPage: getPublicPage,
  getBanners: getPublicBanners,
  getStats: () => api.get('/public/stats/')
};

export const eventsAPI = {
  list: listEvents,
  get: getEvent,
  create: createEvent,
  update: updateEvent,
  delete: deleteEvent,
  getRegistrations: getEventRegistrations,
  getFixtures: getEventFixtures,
  getResults: getEventResults
};

export const fixturesAPI = {
  list: (params) => api.get('/fixtures/', { params }),
  get: (id) => api.get(`/fixtures/${id}/`),
  create: (data) => api.post('/fixtures/', data),
  update: (id, data) => api.put(`/fixtures/${id}/`, data),
  delete: (id) => api.delete(`/fixtures/${id}/`),
  getConflicts: (id) => api.get(`/fixtures/${id}/conflicts/`)
};

export const mediaAPI = {
  list: (params) => api.get('/media/', { params }),
  get: (id) => api.get(`/media/${id}/`),
  create: (data) => api.post('/media/', data),
  update: (id, data) => api.put(`/media/${id}/`, data),
  delete: (id) => api.delete(`/media/${id}/`),
  upload: (data) => api.post('/media/upload/', data)
};

export const reportsAPI = {
  registrationsCSV: () => api.download('/reports/registrations.csv', 'registrations.csv'),
  fixturesCSV: () => api.download('/reports/fixtures.csv', 'fixtures.csv'),
  resultsCSV: () => api.download('/reports/results.csv', 'results.csv'),
  ticketSalesCSV: () => api.download('/reports/ticket_sales.csv', 'ticket_sales.csv')
};

export const kycAPI = {
  get: () => api.get('/kyc/'),
  submit: (data) => api.post('/kyc/', data),
  update: (data) => api.put('/kyc/', data)
};

export const roleRequestAPI = {
  get: () => api.get('/role-requests/'),
  create: (data) => api.post('/role-requests/', data),
  update: (id, data) => api.put(`/role-requests/${id}/`, data)
};

// Ticket functions
export const checkinTicket = (qrPayload, gate) => api.post('/tickets/checkin/', { qr_payload: qrPayload, gate });
export const validateTicket = (ticketId) => api.get(`/tickets/${ticketId}/validate/`);

// Team member functions
export const addTeamMember = (teamId, data) => api.post(`/teams/${teamId}/members/`, data);
export const updateTeamMember = (teamId, memberId, data) => api.put(`/teams/${teamId}/members/${memberId}/`, data);

// Additional missing functions
export const getFixtureConflicts = (id) => api.get(`/fixtures/${id}/conflicts/`);

// News and banner functions
export const getNews = (params = {}) => api.get('/news/', { params });
export const createNews = (data) => api.post('/news/', data);
export const updateNews = (id, data) => api.put(`/news/${id}/`, data);
export const deleteNews = (id) => api.delete(`/news/${id}/`);
export const getBanners = (params = {}) => api.get('/banners/', { params });
export const createBanner = (data) => api.post('/banners/', data);
export const updateBanner = (id, data) => api.put(`/banners/${id}/`, data);
export const deleteBanner = (id) => api.delete(`/banners/${id}/`);

// Profile functions
export const updateProfile = (data) => api.put('/profile/', data);
export const changePassword = (data) => api.post('/change-password/', data);

// Ticket checkout functions
export const ticketsAPI = {
  checkout: (payload) => api.post('/tickets/checkout/', payload),
  webhook: (payload) => api.post('/tickets/webhook/', payload),
  myTickets: () => api.get('/me/tickets/'),
  ticketQr: (ticketId) => api.get(`/tickets/${ticketId}/qr/`),
  verify: (code) => api.get('/tickets/verify', { code })
};

// Event-scoped fixtures/results helpers per Phase 4
export const eventFixturesAPI = {
  list: (eventId, params = {}) => api.get(`/events/${eventId}/fixtures/`, params),
  generate: (eventId, mode = 'rr') => api.post(`/events/${eventId}/fixtures/generate/`, { mode }),
  patchFixture: (fixtureId, data) => api.patch(`/fixtures/${fixtureId}/`, data),
  submitResult: (fixtureId, data) => api.post(`/fixtures/${fixtureId}/result/`, data),
  leaderboard: (eventId) => api.get(`/events/${eventId}/leaderboard/`)
};

// Announcements per Phase 4
export const announcementsAPI = {
  list: () => api.get('/announcements/'),
  announceEvent: (eventId, data) => api.post(`/events/${eventId}/announce/`, data)
};

// Additional missing exports for comprehensive coverage
export const getRegistrations = (params = {}) => api.get('/registrations/', { params });
export const createRegistration = (data) => api.post('/registrations/', data);
export const updateRegistration = (id, data) => api.put(`/registrations/${id}/`, data);
export const deleteRegistration = (id) => api.delete(`/registrations/${id}/`);

export const getFixtures = (params = {}) => api.get('/fixtures/', { params });
export const createFixture = (data) => api.post('/fixtures/', data);
export const updateFixture = (id, data) => api.put(`/fixtures/${id}/`, data);
export const deleteFixture = (id) => api.delete(`/fixtures/${id}/`);

export const getResults = (params = {}) => api.get('/results/', { params });
export const createResult = (data) => api.post('/results/', data);
export const updateResult = (id, data) => api.put(`/results/${id}/`, data);
export const deleteResult = (id) => api.delete(`/results/${id}/`);

export const getTeams = (params = {}) => api.get('/teams/', { params });
export const createTeam = (data) => api.post('/teams/', data);
export const updateTeam = (id, data) => api.put(`/teams/${id}/`, data);
export const deleteTeam = (id) => api.delete(`/teams/${id}/`);

export const getUsers = (params = {}) => api.get('/users/', { params });
export const createUser = (data) => api.post('/users/', data);
export const updateUser = (id, data) => api.put(`/users/${id}/`, data);
export const deleteUser = (id) => api.delete(`/users/${id}/`);

// Utility functions
export const utils = {
  formatDate: (date) => new Date(date).toLocaleDateString(),
  formatCurrency: (amount) => `$${amount.toFixed(2)}`,
  formatFileSize: (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
};
