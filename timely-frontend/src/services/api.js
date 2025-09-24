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
    return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
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
   * Ensure URL path ends with a trailing slash for DRF endpoints.
   * Leaves CSV downloads (ending with .csv) untouched.
   */
  ensureTrailingSlash(urlPath) {
    const [pathOnly, query = ''] = urlPath.split('?');
    if (pathOnly.endsWith('.csv')) return urlPath;
    const normalizedPath = pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`;
    return query ? `${normalizedPath}?${query}` : normalizedPath;
  }

  /**
   * Make HTTP request with error handling
   */
  async request(url, options = {}) {
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
      const baseUrl = this.baseURL.replace(/\/$/, '');
      const rawPath = url.startsWith('/') ? url : `/${url}`;
      path = this.ensureTrailingSlash(rawPath);
      fullUrl = `${baseUrl}${path}`;
    }
    
    const config = {
      headers: this.getHeaders(options.headers),
      ...options
    };

    // Do not send auth header to public or auth endpoints
    const isPublic = path.startsWith('/public/');
    const isAuth = path.startsWith('/auth/');
    if (isPublic || isAuth) {
      if (config.headers && 'Authorization' in config.headers) {
        delete config.headers['Authorization'];
      }
    }

    try {
      const response = await fetch(fullUrl, config);
      
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
    const normalizedParams = (params && typeof params === 'object' && 'params' in params)
      ? params.params
      : params;
    const queryString = new URLSearchParams(normalizedParams || {}).toString();
    const baseUrl = this.ensureTrailingSlash(url);
    const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    
    return this.request(fullUrl, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(url, data = {}) {
    return this.request(this.ensureTrailingSlash(url), {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   */
  async put(url, data = {}) {
    return this.request(this.ensureTrailingSlash(url), {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * PATCH request
   */
  async patch(url, data = {}) {
    return this.request(this.ensureTrailingSlash(url), {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   */
  async delete(url) {
    return this.request(this.ensureTrailingSlash(url), { method: 'DELETE' });
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
    
    poll();
    
    return () => {
      isPolling = false;
    };
  }

  // Authentication endpoints
  async login(email, password) {
    const response = await this.post('/auth/login/', { email, password });
    if (response.access) {
      this.setToken(response.access);
    }
    return response;
  }

  async register(email, password, password_confirm, first_name = '', last_name = '', role = 'SPECTATOR') {
    return this.post('/auth/register/', { 
      email, 
      password, 
      password_confirm, 
      first_name, 
      last_name, 
      role 
    });
  }

  async logout() {
    try {
      await this.post('/auth/logout/');
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser() {
    return this.get('/me/');
  }

  async refresh() {
    return this.post('/auth/refresh/');
  }

  // Events endpoints
  async getEvents(params = {}) {
    return this.get('/events/', params);
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

  async cancelEvent(id) {
    return this.post(`/events/${id}/cancel/`);
  }

  // Public events endpoints
  async getPublicEvents(params = {}) {
    return this.get('/public/events/', params);
  }

  async getPublicEvent(id) {
    return this.get(`/public/events/${id}/`);
  }

  async getPublicEventLeaderboard(id) {
    return this.get(`/public/events/${id}/leaderboard/`);
  }

  // Fixtures endpoints
  async getFixtures(params = {}) {
    return this.get('/fixtures/', params);
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

  // Results endpoints
  async getResults(params = {}) {
    return this.get('/results/', params);
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

  // Registrations endpoints
  async getRegistrations(params = {}) {
    return this.get('/registrations/', params);
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

  // Stub purchase endpoint for tickets
  async purchaseTicket(eventId) {
    return this.post(`/events/${eventId}/purchase/`);
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