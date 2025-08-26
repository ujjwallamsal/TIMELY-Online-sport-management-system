// API configuration
const HOST = '127.0.0.1';
const API_BASE = (import.meta.env.VITE_API_BASE || `http://${HOST}:8000`) + '/api';

import axios from 'axios';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Add an interceptor to include CSRF token for non-GET requests
api.interceptors.request.use(config => {
  // Get CSRF token from cookies if available
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];

  if (csrfToken && config.method !== 'get') {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Cookie-based authentication doesn't need manual token refresh
// The backend handles JWT refresh automatically via cookies

// Helper functions for cookie-based authentication (no longer directly used for CSRF in api instance)
function getHeaders(includeAuth = true) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Get CSRF token from cookies if available
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
  
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }
  
  return headers;
}

async function makeApiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: getHeaders(),
    credentials: 'include',
    ...options,
  };
  try {
    const method = (config.method || 'GET').toUpperCase();
    const axiosConfig = { url, method, withCredentials: true, headers: config.headers };
    if (config.body) {
      if (config.headers && config.headers['Content-Type'] === 'application/json') {
        axiosConfig.data = JSON.parse(config.body);
      } else {
        axiosConfig.data = config.body;
      }
    }
    const resp = await api.request(axiosConfig);
    return resp.data;
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        throw new Error('Authentication failed');
      }
      throw new Error(data?.detail || `HTTP ${status}`);
    }
    console.error('API call failed:', error);
    throw error;
  }
}

async function postApi(endpoint, data, isMultipart = false) {
  const options = {
    method: 'POST',
    credentials: 'include',
    body: isMultipart ? data : JSON.stringify(data),
  };
  
  if (!isMultipart) {
    options.headers = getHeaders();
  } else {
    // For multipart, don't set Content-Type header
    const headers = getHeaders();
    delete headers['Content-Type'];
    options.headers = headers;
  }
  
  return makeApiCall(endpoint, options);
}

async function patchApi(endpoint, data) {
  return makeApiCall(endpoint, {
    method: 'PATCH',
    credentials: 'include',
    body: JSON.stringify(data),
  });
}

// Account APIs
export async function changePassword({ current_password, new_password, new_password_confirm }) {
  return makeApiCall('/accounts/users/change_password/', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ current_password, new_password, new_password_confirm }),
  });
}

// Fallback data for offline development
function getFallbackData(endpoint) {
  const fallbackData = {
    '/public/events/': {
      count: 3,
      results: [
        {
          id: 1,
          name: "Summer Football Championship",
          sport_type: "Football",
          start_date: "2024-07-15",
          end_date: "2024-07-20",
          venue: "Central Stadium",
          status: "UPCOMING",
          fee_cents: 5000,
          capacity: 200,
          registration_open: "2024-06-01",
          registration_close: "2024-07-10"
        },
        {
          id: 2,
          name: "Basketball Tournament",
          sport_type: "Basketball",
          start_date: "2024-08-10",
          end_date: "2024-08-15",
          venue: "Sports Complex",
          status: "UPCOMING",
          fee_cents: 3000,
          capacity: 150,
          registration_open: "2024-07-01",
          registration_close: "2024-08-05"
        },
        {
          id: 3,
          name: "Swimming Meet",
          sport_type: "Swimming",
          start_date: "2024-09-05",
          end_date: "2024-09-07",
          venue: "Aquatic Center",
          status: "UPCOMING",
          fee_cents: 2500,
          capacity: 100,
          registration_open: "2024-08-01",
          registration_close: "2024-09-01"
        }
      ]
    },
    '/venues/': [
      { id: 1, name: "Central Stadium", address: "123 Main St", capacity: 200 },
      { id: 2, name: "Sports Complex", address: "456 Oak Ave", capacity: 150 },
      { id: 3, name: "Aquatic Center", address: "789 Pine Rd", capacity: 100 }
    ],
    '/divisions/': [
      { id: 1, name: "U18", description: "Under 18 years", min_age: 0, max_age: 18, gender: "ALL" },
      { id: 2, name: "U21", description: "Under 21 years", min_age: 0, max_age: 21, gender: "ALL" },
      { id: 3, name: "Open", description: "Open to all ages", min_age: 0, max_age: 999, gender: "ALL" },
      { id: 4, name: "Masters", description: "35+ years", min_age: 35, max_age: 999, gender: "ALL" }
    ]
  };
  
  return fallbackData[endpoint] || { count: 0, results: [] };
}

// Authentication APIs
export async function login(email, password) {
  const { data } = await api.post('/accounts/auth/login/', { email, password });
  return data;
}

export async function logout() {
  const { data } = await api.post('/accounts/auth/logout/');
  return data;
}

export async function signup({ email, password, password_confirm, first_name = '', last_name = '', role = 'SPECTATOR' }) {
  const { data } = await api.post('/accounts/auth/register/', { email, password, password_confirm, first_name, last_name, role });
  return data;
}

// User Management APIs
export async function getMe() {
  return makeApiCall('/accounts/users/me/');
}

export async function updateProfile(data) {
  return patchApi('/accounts/users/me/', data);
}

export async function listUsers({ page = 1, search = "", ordering = "-date_joined" } = {}) {
  const params = new URLSearchParams({ page, search, ordering });
  return makeApiCall(`/accounts/admin/users/?${params}`);
}

export async function updateUserRole(userId, role) {
  return patchApi(`/accounts/users/${userId}/update_role/`, { role });
}

export async function deleteUser(userId) {
  return makeApiCall(`/accounts/users/${userId}/delete_user/`, { method: 'DELETE' });
}

// Event APIs
export async function getEvents(page = 1, search = "", sport = "", venue = "", filters = {}) {
  const params = new URLSearchParams({ page, search, sport, venue });
  
  // Add filter parameters
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.min_fee) params.append('min_fee', filters.min_fee);
  if (filters.max_fee) params.append('max_fee', filters.max_fee);
  if (filters.registration_open !== undefined) params.append('registration_open', filters.registration_open);
  if (filters.status) params.append('status', filters.status);
  
  return makeApiCall(`/events/?${params}`);
}



// Legacy function for backward compatibility (used in Events.jsx)
export async function listPublicEvents() {
  return makeApiCall('/public/events/');
}

export async function getDivisions() {
  return makeApiCall('/divisions/');
}

export async function getVenues() {
  return makeApiCall('/venues/');
}

export async function createEvent(eventData) {
  return postApi('/events/', eventData);
}

export async function updateEvent(eventId, eventData) {
  return patchApi(`/events/${eventId}/`, eventData);
}

export async function publishEvent(eventId) {
  return postApi(`/events/${eventId}/publish/`, {});
}

export async function unpublishEvent(eventId) {
  return postApi(`/events/${eventId}/unpublish/`, {});
}

export async function cancelEvent(eventId) {
  return postApi(`/events/${eventId}/cancel/`, {});
}

export async function getMyEvents() {
  return makeApiCall('/events/my_events/');
}

// Registration APIs
export async function createRegistration(registrationData) {
  return postApi('/registrations/', registrationData);
}

export async function getRegistration(registrationId) {
  return makeApiCall(`/registrations/${registrationId}/`);
}

export async function updateRegistration(registrationId, data) {
  return patchApi(`/registrations/${registrationId}/`, data);
}

export async function withdrawRegistration(registrationId) {
  return postApi(`/registrations/${registrationId}/withdraw/`, {});
}

export async function getMyRegistrations() {
  return makeApiCall('/registrations/my_registrations/');
}

export async function getEventRegistrations(eventId) {
  return makeApiCall(`/registrations/?event=${eventId}`);
}

// Organizer: approve/reject registrations
export async function approveRegistration(registrationId) {
  return postApi(`/registrations/${registrationId}/approve/`, {});
}

export async function rejectRegistration(registrationId, reason = '') {
  return postApi(`/registrations/${registrationId}/reject/`, { reason });
}

// Document APIs
export async function uploadDocument(registrationId, file, documentType, title, description = '') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentType);
  formData.append('title', title);
  formData.append('description', description);
  
  return postApi(`/registrations/${registrationId}/upload_document/`, formData, true);
}

export async function getDocuments(registrationId) {
  return makeApiCall(`/documents/?registration=${registrationId}`);
}

export async function downloadDocument(documentId) {
  const response = await fetch(`${API_BASE}/documents/${documentId}/download/`, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to download document');
  }
  
  return response.blob();
}

export async function approveDocument(documentId, notes = '') {
  return postApi(`/documents/${documentId}/approve_document/`, { notes });
}

export async function rejectDocument(documentId, notes = '') {
  return postApi(`/documents/${documentId}/reject_document/`, { notes });
}

// Get single event by ID
export async function getEvent(id) {
  try {
    return await makeApiCall(`/public/events/${id}/`);
  } catch (error) {
    // Return fallback event data
    const fallbackEvents = getFallbackData('/public/events/').results;
    const event = fallbackEvents.find(e => e.id === parseInt(id));
    if (event) {
      return {
        ...event,
        venue_detail: { name: event.venue, address: "Address TBD" },
        eligibility_notes: "Open to all participants. Basic equipment required."
      };
    }
    throw new Error("Event not found");
  }
}

// Expose a tiny auth API for UI
export const auth = {
  // getAccessToken, // Removed as per new cookie-based auth
  // setAccessToken, // Removed as per new cookie-based auth
  // setRefreshToken, // Removed as per new cookie-based auth
};

// Public data APIs
export async function getMatches(page = 1) {
  return makeApiCall(`/public/matches/?page=${page}&page_size=12`);
}

export async function getResults(page = 1) {
  return makeApiCall(`/public/results/?page=${page}&page_size=12`);
}

export async function getNews(page = 1) {
  return makeApiCall(`/public/news/?page=${page}&page_size=12`);
}

// Ticketing APIs
export async function listTicketTypes(eventId = null) {
  const params = eventId ? `?event=${eventId}` : '';
  return makeApiCall(`/ticket-types/${params}`);
}

export async function createTicketOrder(orderData) {
  return postApi('/ticket-orders/', orderData);
}

export async function createStripeCheckout(orderId, successUrl, cancelUrl) {
  return postApi(`/ticket-orders/${orderId}/stripe_checkout/`, {
    order_id: orderId,
    success_url: successUrl,
    cancel_url: cancelUrl
  });
}

export async function createPayPalCheckout(orderId, returnUrl, cancelUrl) {
  return postApi(`/ticket-orders/${orderId}/paypal_checkout/`, {
    order_id: orderId,
    return_url: returnUrl,
    cancel_url: cancelUrl
  });
}

export async function listMyTickets() {
  return makeApiCall('/tickets/');
}

export async function downloadTicket(ticketId) {
  return makeApiCall(`/tickets/${ticketId}/download/`);
}

// Fixture APIs
export async function createFixture(fixtureData) {
  return postApi('/fixtures/', fixtureData);
}

export async function generateFixtures(fixtureId, generationData) {
  return postApi(`/fixtures/${fixtureId}/generate/`, generationData);
}

export async function publishFixtures(fixtureId, publishData) {
  return postApi(`/fixtures/${fixtureId}/publish/`, publishData);
}

export async function regenerateFixtures(fixtureId) {
  return postApi(`/fixtures/${fixtureId}/regenerate/`);
}

export async function checkFixtureConflicts(fixtureId) {
  return makeApiCall(`/fixtures/${fixtureId}/conflicts/`);
}

export async function deleteFixture(fixtureId) {
  return makeApiCall(`/fixtures/${fixtureId}/`, { method: 'DELETE' });
}

export async function getFixtureSchedule(fixtureId) {
  return makeApiCall(`/fixtures/${fixtureId}/schedule/`);
}

