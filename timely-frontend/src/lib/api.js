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
  api.get('public/events/', { params: { page, search, sport, venue, ...filters } });

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
  api.get('public/events/', { params: { page, ...filters } });

// ===== CMS PAGES =====
export const getPages = (params = {}) => api.get('content/pages/', { params });
export const getPage = (slug) => api.get(`content/pages/${slug}/`);
export const createPage = (pageData) => api.post('content/pages/', pageData);
export const updatePage = (slug, pageData) => api.patch(`content/pages/${slug}/`, pageData);
export const deletePage = (slug) => api.delete(`content/pages/${slug}/`);

// ===== CMS NEWS =====
export const getNews = (params = {}) => api.get('content/news/', { params });
export const getNewsArticle = (id) => api.get(`content/news/${id}/`);
export const createNews = (newsData) => api.post('content/news/', newsData);
export const updateNews = (id, newsData) => api.patch(`content/news/${id}/`, newsData);
export const deleteNews = (id) => api.delete(`content/news/${id}/`);

// ===== CMS BANNERS =====
export const getBanners = (params = {}) => api.get('content/banners/', { params });
export const getBanner = (id) => api.get(`content/banners/${id}/`);
export const createBanner = (bannerData) => api.post('content/banners/', bannerData);
export const updateBanner = (id, bannerData) => api.patch(`content/banners/${id}/`, bannerData);
export const deleteBanner = (id) => api.delete(`content/banners/${id}/`);

// ===== PUBLIC CMS =====
export const getPublicPage = (slug) => api.get(`content/public/pages/${slug}/`);
export const getPublicPages = (params = {}) => api.get('content/public/pages/', { params });
export const getPublicNews = (page = 1, filters = {}) => 
  api.get('content/public/news/', { params: { page, ...filters } });
export const getPublicBanners = () => api.get('content/public/banners/');

// ===== LEGACY ANNOUNCEMENTS (for backward compatibility) =====
export const getAnnouncements = (page = 1, filters = {}) => 
  api.get('content/announcements/', { params: { page, ...filters } });
export const getAnnouncement = (id) => api.get(`content/announcements/${id}/`);
export const createAnnouncement = (announcementData) => api.post('content/announcements/', announcementData);
export const updateAnnouncement = (id, announcementData) => api.patch(`content/announcements/${id}/`, announcementData);
export const deleteAnnouncement = (id) => api.delete(`content/announcements/${id}/`);



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

// ===== ADMIN DASHBOARD API =====
export const adminAPI = {
  // Get KPIs
  getKPIs: () => api.get('admin/kpis/'),

  // Drilldown endpoints
  drillUsers: (params = {}) => api.get('admin/drill/users/', { params }),
  drillEvents: (params = {}) => api.get('admin/drill/events/', { params }),
  drillRegistrations: (params = {}) => api.get('admin/drill/registrations/', { params }),
  drillOrders: (params = {}) => api.get('admin/drill/orders/', { params }),
  getAuditLogs: (params = {}) => api.get('admin/audit/', { params }),

  // CSV Export
  exportCSV: (kind, params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`admin/export/${kind}/?${queryParams}`, {
      responseType: 'blob',
      headers: {
        'Accept': 'text/csv'
      }
    });
  }
};

// ===== KYC API =====
export const kycAPI = {
  // Get KYC profile
  getProfile: () => api.get('kyc/profile/'),
  
  // Create/update KYC profile
  createProfile: (data) => api.post('kyc/profile/', data),
  updateProfile: (data) => api.patch('kyc/profile/', data),
  
  // Submit KYC for review
  submitProfile: () => api.post('kyc/profile/submit/'),
  
  // Admin review KYC
  reviewProfile: (profileId, action, data) => api.patch(`kyc/profile/${profileId}/review/`, { action, ...data }),
  
  // Document management
  uploadDocument: (formData) => api.post('kyc/documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteDocument: (documentId) => api.delete(`kyc/documents/${documentId}/`),
  listDocuments: () => api.get('kyc/documents/'),
};

// ===== ROLE REQUEST API =====
export const roleRequestAPI = {
  // Create role request
  createRequest: (data) => api.post('accounts/role-requests/', data),
  
  // Get user's role requests
  getMyRequests: () => api.get('accounts/role-requests/mine/'),
  
  // Admin endpoints
  listRequests: (params = {}) => api.get('accounts/role-requests/', { params }),
  approveRequest: (requestId, data) => api.patch(`accounts/role-requests/${requestId}/approve/`, data),
  rejectRequest: (requestId, data) => api.patch(`accounts/role-requests/${requestId}/reject/`, data),
};

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

// ===== PUBLIC API (for spectator pages) =====
export const publicAPI = {
  // Get home page aggregated data
  getPublicHome: () => api.get('public/home/'),
  
  // List published events with filters
  listPublicEvents: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`public/events/?${queryParams}`);
  },
  
  // Get published event detail
  getPublicEvent: (eventId) => api.get(`public/events/${eventId}/`),
  
  // List published fixtures for an event
  listPublicFixtures: (eventId, params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`public/events/${eventId}/fixtures/?${queryParams}`);
  },
  
  // Get published results and leaderboard for an event
  listPublicResults: (eventId) => api.get(`public/events/${eventId}/results/`),
  
  // List published news/announcements
  listPublicNews: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`public/news/?${queryParams}`);
  },
};

// ===== MESSAGING API =====
export const messagesAPI = {
  // Create message thread
  createThread: (data) => api.post('messages/threads/', data),
  
  // List user's threads
  listThreads: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`messages/threads/?${queryParams}`);
  },
  
  // Get thread details
  getThread: (id) => api.get(`messages/threads/${id}/`),
  
  // Add participant to thread
  addThreadParticipant: (threadId, userId) => api.post(`messages/threads/${threadId}/add_participant/`, { user_id: userId }),
  
  // Remove participant from thread
  removeThreadParticipant: (threadId, userId) => api.delete(`messages/threads/${threadId}/participants/${userId}/`),
  
  // List thread messages
  listThreadMessages: (threadId, params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`messages/threads/${threadId}/messages/?${queryParams}`);
  },
  
  // Send message to thread
  sendMessage: (threadId, body) => api.post(`messages/threads/${threadId}/send_message/`, { body }),
  
  // Edit message
  editMessage: (messageId, body) => api.patch(`messages/messages/${messageId}/`, { body }),
  
  // Delete message (soft delete)
  deleteMessage: (messageId) => api.delete(`messages/messages/${messageId}/`),
  
  // Mark thread as read
  markThreadRead: (threadId) => api.get(`messages/threads/${threadId}/messages/`),
};

// ===== NOTIFICATIONS API =====
export const notifyAPI = {
  // List user's notifications
  listNotifications: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`notifications/?${queryParams}`);
  },
  
  // Mark notification as read
  markNotificationRead: (id) => api.patch(`notifications/${id}/read/`),
  
  // Mark all notifications as read
  markAllNotificationsRead: () => api.post('notifications/mark-all-read/'),
  
  // Create announcement (organizer/admin only)
  announce: (data) => api.post('notifications/announce/', data),
};

// ===== TICKETING API =====
export const ticketingAPI = {
  // List ticket types for an event
  listTicketTypes: (eventId, params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`tickets/events/${eventId}/types/?${queryParams}`);
  },
  
  // Create ticket order
  createOrder: (payload) => api.post('tickets/orders/', payload),
  
  // Get order details
  getOrder: (orderId) => api.get(`tickets/orders/${orderId}/`),
  
  // Cancel order
  cancelOrder: (orderId) => api.post(`tickets/orders/${orderId}/cancel/`),
  
  // Get order summary
  getOrderSummary: (orderId) => api.get(`tickets/orders/${orderId}/summary/`),
  
  // List user's tickets
  listMyTickets: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`tickets/my-tickets/?${queryParams}`);
  },
  
  // Get ticket details
  getTicket: (ticketId) => api.get(`tickets/tickets/${ticketId}/`),
  
  // Validate ticket (for scanning)
  validateTicket: (ticketId) => api.get(`tickets/tickets/${ticketId}/validate/`),
  
  // Use ticket (for check-in)
  useTicket: (ticketId) => api.post(`tickets/tickets/${ticketId}/use/`),
  
  // Organizer functions
  listEventOrders: (eventId, params = {}) => {
    const queryParams = new URLSearchParams(params);
    return api.get(`tickets/events/${eventId}/orders/?${queryParams}`);
  },
  
  // Create ticket type (organizer/admin)
  createTicketType: (eventId, payload) => api.post(`tickets/events/${eventId}/types/create/`, payload),
  
  // Update ticket type (organizer/admin)
  updateTicketType: (ticketTypeId, payload) => api.patch(`tickets/types/${ticketTypeId}/`, payload),
  
  // Delete ticket type (organizer/admin)
  deleteTicketType: (ticketTypeId) => api.delete(`tickets/types/${ticketTypeId}/delete/`),
};

// ===== PAYMENTS API =====
export const paymentsAPI = {
  // Create Stripe checkout session
  stripeCheckout: (orderId) => api.post('payments/stripe/checkout/', { order_id: orderId }),
  
  // Create refund (admin/organizer)
  createRefund: (orderId) => api.post(`payments/refund/${orderId}/`),
};

// ===== MEDIA API =====
export const mediaAPI = {
  // List media items (authenticated users see their own + approved; moderators see all)
  listMedia: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });
    return api.get(`media/?${queryParams}`);
  },
  
  // Get specific media item
  getMedia: (mediaId) => api.get(`media/${mediaId}/`),
  
  // Upload new media (multipart form data)
  createMedia: (formData) => api.post('media/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Update media item (title, description, etc.)
  updateMedia: (mediaId, data) => api.patch(`media/${mediaId}/`, data),
  
  // Delete media item
  deleteMedia: (mediaId) => api.delete(`media/${mediaId}/`),
  
  // Moderation actions (organizer/admin only)
  approveMedia: (mediaId) => api.post(`media/${mediaId}/approve/`),
  rejectMedia: (mediaId, reason = '') => api.post(`media/${mediaId}/reject/`, { reason }),
  hideMedia: (mediaId) => api.post(`media/${mediaId}/hide/`),
  featureMedia: (mediaId) => api.post(`media/${mediaId}/feature/`),
  
  // Public gallery (approved media only)
  listPublicMedia: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });
    return api.get(`media/public/?${queryParams}`);
  },
  
  // Get share information
  getShareInfo: (mediaId) => api.get(`media/share/${mediaId}/`),
};

// ===== UTILITY FUNCTIONS =====
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
  formatDate: (dateString) => new Date(dateString).toLocaleDateString(),
  
  // Format datetime for display
  formatDateTime: (dateString) => new Date(dateString).toLocaleString(),
  
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

// ===== REPORTS API =====
export const reportsAPI = {
  // Get report data
  getReport: (reportType, filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params.append(key, value);
      }
    });
    
    const queryString = params.toString();
    const url = `reports/${reportType}/${queryString ? `?${queryString}` : ''}`;
    
    return api.get(url);
  },

  // Export report to CSV
  exportReport: (reportType, filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params.append(key, value);
      }
    });
    
    const queryString = params.toString();
    const url = `reports/export/${reportType}/${queryString ? `?${queryString}` : ''}`;
    
    return api.get(url, { responseType: 'blob' });
  },

  // Get available events for filters
  getEvents: () => api.get('events/'),

  // Get available sports for filters
  getSports: () => api.get('events/sports/'),

  // Get available divisions for filters
  getDivisions: () => api.get('events/divisions/'),
};

export default api;
