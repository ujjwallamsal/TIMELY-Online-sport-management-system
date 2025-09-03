import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  withCredentials: true,  // Enable cookies for JWT authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to normalize URLs (cookies are handled automatically)
api.interceptors.request.use((config) => {
  // Normalize URL to prevent double /api/
  if (config.url) {
    config.url = config.url.replace(/^\/+/, '').replace(/^api\//, '');
  }

  // Log final URL for debugging
  const finalUrl = api.defaults.baseURL + '/' + config.url;
  console.log('API →', config.method?.toUpperCase(), finalUrl);

  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Don't try to refresh token for /accounts/users/me/ endpoint
      // as it's used for auth status checking
      if (error.config?.url?.includes('/accounts/users/me/')) {
        return Promise.reject(error);
      }
      
      // For now, don't automatically redirect to login to prevent refresh loops
      // Let individual components handle 401 errors as needed
      console.log('401 error on:', error.config?.url);
    }
    return Promise.reject(error);
  }
);

// ===== AUTHENTICATION =====
export const login = (credentials) => api.post('accounts/auth/login/', credentials);
export const register = (userData) => api.post('accounts/auth/register/', userData);
export const refreshToken = () => api.post('accounts/auth/refresh/');
export const logout = () => api.post('accounts/auth/logout/');
export const getCurrentUser = () => api.get('accounts/users/me/');
export const updateProfile = (userData) => api.patch('accounts/users/me/', userData);
export const changePassword = (passwordData) => api.post('accounts/auth/change-password/', passwordData);

// ===== EVENTS =====
export const listEvents = (params = {}) => 
  api.get('events/', { params: { page: 1, page_size: 12, ...params } });
export const getEvents = listEvents; // Alias for listEvents
export const getEvent = (id) => api.get(`events/${id}/`);
export const createEvent = (eventData) => api.post('events/', eventData);
export const updateEvent = (id, eventData) => api.patch(`events/${id}/`, eventData);
export const deleteEvent = (id) => api.delete(`events/${id}/`);
export const publishEvent = (id) => api.post(`events/${id}/publish/`);
export const unpublishEvent = (id) => api.post(`events/${id}/unpublish/`);
export const cancelEvent = (id, reason = '') => api.post(`events/${id}/cancel/`, { reason });

// ===== PUBLIC EVENTS =====
export const getPublicEvents = (page = 1, search = '', sport = '', venue = '', filters = {}) => 
  api.get('main-public/events/', { params: { page, search, sport_type: sport, venue, ...filters } });

// ===== VENUES =====
export const listVenues = (params = {}) => 
  api.get('venues/', { params: { page: 1, page_size: 12, ...params } });
export const getVenue = (id) => api.get(`venues/${id}/`);
export const createVenue = (venueData) => api.post('venues/', venueData);
export const updateVenue = (id, venueData) => api.patch(`venues/${id}/`, venueData);
export const deleteVenue = (id) => api.delete(`venues/${id}/`);

// ===== VENUE AVAILABILITY =====
export const getVenueAvailability = (id, params = {}) => 
  api.get(`venues/${id}/availability/`, { params });
export const createVenueAvailability = (id, payloadOrArray) => 
  api.post(`venues/${id}/availability/`, payloadOrArray);
export const updateVenueAvailability = (id, slotId, payload) => 
  api.patch(`venues/${id}/availability/${slotId}/`, payload);
export const deleteVenueAvailability = (id, slotId) => 
  api.delete(`venues/${id}/availability/${slotId}/`);
export const blockVenue = (id, payload) => 
  api.post(`venues/${id}/block/`, payload);
export const getVenueConflicts = (id, params) => 
  api.get(`venues/${id}/conflicts/`, { params });

// ===== DIVISIONS =====
export const listDivisions = (eventId) => api.get(`events/${eventId}/divisions/`);
export const getDivision = (eventId, divisionId) => api.get(`events/${eventId}/divisions/${divisionId}/`);
export const createDivision = (eventId, divisionData) => api.post(`events/${eventId}/divisions/`, divisionData);
export const updateDivision = (eventId, divisionId, divisionData) => api.patch(`events/${eventId}/divisions/${divisionId}/`, divisionData);
export const deleteDivision = (eventId, divisionId) => api.delete(`events/${eventId}/divisions/${divisionId}/`);

// ===== REGISTRATIONS =====
export const createRegistration = (registrationData) => api.post('registrations/', registrationData);
export const getMyRegistrations = (params = {}) => api.get('registrations/mine/', { params });
export const getRegistration = (id) => api.get(`registrations/${id}/`);
export const withdrawRegistration = (id, reason = '') => api.patch(`registrations/${id}/withdraw/`, { reason });
export const uploadRegistrationDoc = (id, formData) => api.post(`registrations/${id}/documents/`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getRegistrationDocuments = (id) => api.get(`registrations/${id}/documents/`);
export const createRegPaymentIntent = (id) => api.post(`registrations/${id}/pay/intent/`);
export const confirmRegPayment = (id, payload) => api.post(`registrations/${id}/pay/confirm/`, payload);
export const getRegPaymentStatus = (id) => api.get(`registrations/${id}/payment_status/`);

// Document management functions
export const getDocuments = (registrationId) => api.get(`registrations/${registrationId}/documents/`);
export const approveDocument = (documentId) => api.patch(`documents/${documentId}/approve/`);
export const rejectDocument = (documentId, reason) => api.patch(`documents/${documentId}/reject/`, { reason });
export const downloadDocument = (documentId) => api.get(`documents/${documentId}/download/`, { responseType: 'blob' });

// Organizer/Admin registration management
export const listRegistrations = (params = {}) => api.get('registrations/', { params });
export const getEventRegistrations = (eventId, page = 1, filters = {}) => 
  api.get(`events/${eventId}/registrations/`, { params: { page, ...filters } });
export const approveRegistration = (id, reason = '') => api.patch(`registrations/${id}/approve/`, { reason });
export const rejectRegistration = (id, reason = '') => api.patch(`registrations/${id}/reject/`, { reason });
export const waitlistRegistration = (id, reason = '') => api.patch(`registrations/${id}/waitlist/`, { reason });
export const requestReupload = (id, reason = '') => api.patch(`registrations/${id}/request_reupload/`, { reason });

// ===== FIXTURES & MATCHES =====
// Match CRUD operations
export const getMatches = (page = 1, filters = {}) => 
  api.get('fixtures/', { params: { page, ...filters } });
export const getMatch = (id) => api.get(`fixtures/${id}/`);
export const createMatch = (matchData) => api.post('fixtures/', matchData);
export const updateMatch = (id, matchData) => api.patch(`fixtures/${id}/`, matchData);
export const deleteMatch = (id) => api.delete(`fixtures/${id}/`);

// Event fixtures operations
export const listEventFixtures = (eventId, params = {}) => 
  api.get(`fixtures/events/${eventId}/`, { params });
export const generateFixtures = (eventId, payload) => 
  api.post(`fixtures/events/${eventId}/generate/`, payload);
export const publishFixtures = (eventId) => 
  api.post(`fixtures/events/${eventId}/publish/`);
export const unpublishFixtures = (eventId) => 
  api.post(`fixtures/events/${eventId}/unpublish/`);
export const rescheduleMatch = (matchId, payload) => 
  api.post(`fixtures/${matchId}/reschedule/`, payload);
export const getEventFixtureConflicts = (eventId, params) => 
  api.get(`fixtures/events/${eventId}/conflicts/`, { params });

// Public fixtures
export const getPublicFixtures = (page = 1, filters = {}) => 
  api.get('fixtures/public/matches/', { params: { page, ...filters } });

// ===== RESULTS =====
export const getResults = (page = 1, filters = {}) => 
  api.get('results/', { params: { page, ...filters } });
export const getResult = (id) => api.get(`results/${id}/`);
export const createResult = (resultData) => api.post('results/', resultData);
export const updateResult = (id, resultData) => api.patch(`results/${id}/`, resultData);
export const deleteResult = (id) => api.delete(`results/${id}/`);

// ===== PUBLIC RESULTS =====
export const getPublicResults = (page = 1, filters = {}) => 
  api.get('main-public/results/', { params: { page, ...filters } });

// ===== NEWS & ANNOUNCEMENTS =====
export const getAnnouncements = (page = 1, filters = {}) => 
  api.get('content/announcements/', { params: { page, ...filters } });
export const getAnnouncement = (id) => api.get(`content/announcements/${id}/`);
export const createAnnouncement = (announcementData) => api.post('content/announcements/', announcementData);
export const updateAnnouncement = (id, announcementData) => api.patch(`content/announcements/${id}/`, announcementData);
export const deleteAnnouncement = (id) => api.delete(`content/announcements/${id}/`);

// ===== PUBLIC NEWS =====
export const getPublicNews = (page = 1, filters = {}) => 
  api.get('main-public/announcements/', { params: { page, ...filters } });



// ===== TICKETS =====
export const getTickets = (page = 1, filters = {}) => 
  api.get('tickets/', { params: { page, ...filters } });
export const getMyTickets = (page = 1, filters = {}) => 
  api.get('tickets/my-tickets/', { params: { page, ...filters } });
export const getTicket = (id) => api.get(`tickets/${id}/`);
export const createTicket = (ticketData) => api.post('tickets/', ticketData);
export const updateTicket = (id, ticketData) => api.patch(`tickets/${id}/`, ticketData);
export const deleteTicket = (id) => api.delete(`tickets/${id}/`);

// ===== TICKET TYPES =====
export const listTicketTypes = (eventId) => api.get(`events/${eventId}/ticket-types/`);
export const createTicketOrder = (orderData) => api.post('tickets/orders/', orderData);
export const createStripeCheckout = (orderId) => api.post(`tickets/orders/${orderId}/stripe-checkout/`);
export const createPayPalCheckout = (orderId) => api.post(`tickets/orders/${orderId}/paypal-checkout/`);
export const listMyTickets = (page = 1, filters = {}) => api.get('tickets/my-tickets/', { params: { page, ...filters } });

// ===== TEAMS =====
export const listTeams = (params = {}) => api.get('teams/', { params });
export const getTeams = listTeams; // Alias for listTeams
export const getTeam = (id) => api.get(`teams/${id}/`);
export const createTeam = (teamData) => api.post('teams/', teamData);
export const updateTeam = (id, teamData) => api.patch(`teams/${id}/`, teamData);
export const deleteTeam = (id) => api.delete(`teams/${id}/`);

// ===== TEAM MEMBERS =====
export const getTeamMembers = (teamId) => api.get(`teams/${teamId}/members/`);
export const addTeamMember = (teamId, memberData) => api.post(`teams/${teamId}/members/`, memberData);
export const updateTeamMember = (memberId, memberData) => api.patch(`teams/members/${memberId}/`, memberData);
export const deleteTeamMember = (memberId) => api.delete(`teams/members/${memberId}/`);

// ===== TEAM EVENT ENTRIES =====
export const getTeamEntries = (teamId) => api.get(`teams/${teamId}/entries/`);
export const createTeamEntry = (teamId, entryData) => api.post(`teams/${teamId}/entries/`, entryData);
export const withdrawTeamEntry = (entryId, note = '') => api.patch(`teams/entries/${entryId}/withdraw/`, { note });
export const approveTeamEntry = (entryId, note = '') => api.patch(`teams/entries/${entryId}/approve/`, { note });
export const rejectTeamEntry = (entryId, note = '') => api.patch(`teams/entries/${entryId}/reject/`, { note });

// ===== ELIGIBILITY =====
export const checkTeamEligibility = (teamId, eventId, divisionId = null) => 
  api.post('teams/eligibility/check/', { team_id: teamId, event_id: eventId, division_id: divisionId });

export const downloadTicket = (ticketId) => api.get(`tickets/${ticketId}/download/`, { responseType: 'blob' });

// ===== ADMIN & REPORTS =====
export const getUsers = (page = 1, filters = {}) => 
  api.get('admin/users/', { params: { page, ...filters } });
export const getUser = (id) => api.get(`admin/users/${id}/`);
export const createUser = (userData) => api.post('admin/users/', userData);
export const updateUser = (id, userData) => api.patch(`admin/users/${id}/`, userData);
export const deleteUser = (id) => api.delete(`admin/users/${id}/`);
export const getSystemStats = () => api.get('admin/stats/');
export const getEventReports = (filters = {}) => api.get('admin/reports/events/', { params: filters });
export const getUserReports = (filters = {}) => api.get('admin/reports/users/', { params: filters });

// ===== PAYMENTS =====
export const createPaymentIntent = (amount, currency = 'usd') => 
  api.post('payments/create-intent/', { amount, currency });
export const confirmPayment = (paymentIntentId) => 
  api.post('payments/confirm/', { payment_intent_id: paymentIntentId });
export const getPaymentHistory = (page = 1) => 
  api.get('payments/history/', { params: { page } });

// ===== NOTIFICATIONS =====
export const getNotifications = (page = 1) => 
  api.get('notifications/', { params: { page } });
export const markNotificationRead = (id) => api.patch(`notifications/${id}/read/`);
export const markAllNotificationsRead = () => api.post('notifications/mark-all-read/');

// ===== UPLOADS =====
export const uploadFile = (file, type = 'document') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  return api.post('uploads/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// ===== VENUES =====
export const getVenues = (params = {}) =>
  api.get('venues/', { params });

export const addVenueSlots = (venueId, slotsData) =>
  api.post(`venues/${venueId}/slots/`, { slots: slotsData });

export const checkVenueConflicts = (conflictData) =>
  api.post('venues/check-conflicts/', conflictData);

export const getVenueSlots = (params = {}) =>
  api.get('slots/', { params });

export const getVenueSlot = (slotId) =>
  api.get(`slots/${slotId}/`);

export const updateVenueSlot = (slotId, slotData) =>
  api.patch(`slots/${slotId}/`, slotData);

export const deleteVenueSlot = (slotId) =>
  api.delete(`slots/${slotId}/`);

// ===== FIXTURES =====
export const getFixtures = (params = {}) => 
  api.get('fixtures/', { params });
export const getFixture = (id) => api.get(`fixtures/${id}/`);
export const createFixture = (fixtureData) => api.post('fixtures/', fixtureData);
export const updateFixture = (id, fixtureData) => api.patch(`fixtures/${id}/`, fixtureData);
export const deleteFixture = (id) => api.delete(`fixtures/${id}/`);

// Fixture generation and management
export const acceptFixtures = (data) => api.post('fixtures/accept/', data);
export const publishFixture = (id) => api.post(`fixtures/${id}/publish/`);
export const rescheduleFixture = (id, data) => api.post(`fixtures/${id}/reschedule/`, data);
export const swapFixtureEntries = (id, data) => api.post(`fixtures/${id}/swap-entries/`, data);
export const getFixtureConflicts = (id) => api.get(`fixtures/${id}/conflicts/`);

// Event-specific fixtures
export const getEventFixtures = (eventId, params = {}) => 
  api.get(`events/${eventId}/fixtures/`, { params });
export const publishEventFixtures = (eventId) => 
  api.post(`events/${eventId}/fixtures/publish/`);

// Public fixtures (read-only)
export const getPublicEventFixtures = (eventId, params = {}) => 
  api.get(`public/events/${eventId}/fixtures/`, { params });

// ===== HEALTH & STATUS =====
export const getHealth = () => api.get('');

export default api;
