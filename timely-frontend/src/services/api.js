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
    // Check for environment variable first
    if (window.ENV && window.ENV.VITE_API_BASE_URL) {
      return window.ENV.VITE_API_BASE_URL;
    }
    
    // Fallback to default development URL
    return 'http://127.0.0.1:8000/api';
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
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    const config = {
      headers: this.getHeaders(options.headers),
      ...options
    };

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
    const response = await this.post('/accounts/auth/login/', { email, password });
    if (response.access) {
      this.setToken(response.access);
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/accounts/auth/logout/');
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser() {
    return this.get('/accounts/users/me/');
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
