/**
 * Dashboard API Service - Handles all dashboard data fetching
 * Provides real-time data for different user roles
 */
import api from './api.js';

/**
 * Admin/Organizer Dashboard API
 */
export const adminDashboardAPI = {
  // Get dashboard statistics
  getStats: async () => {
    try {
      const [events, users, registrations, revenue] = await Promise.all([
        api.get('/events/'),
        api.get('/users/'),
        api.get('/registrations/'),
        api.get('/reports/revenue/')
      ]);
      
      return {
        totalEvents: events.count || 0,
        activeEvents: events.results?.filter(e => e.status === 'active').length || 0,
        totalUsers: users.count || 0,
        totalRevenue: revenue.total || 0,
        registrations: registrations.count || 0,
        completedEvents: events.results?.filter(e => e.status === 'completed').length || 0
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return {
        totalEvents: 0,
        activeEvents: 0,
        totalUsers: 0,
        totalRevenue: 0,
        registrations: 0,
        completedEvents: 0
      };
    }
  },

  // Get recent events
  getRecentEvents: async (limit = 5) => {
    try {
      const response = await api.get('/events/', { 
        ordering: '-created_at',
        page_size: limit 
      });
      return response.results || [];
    } catch (error) {
      console.error('Error fetching recent events:', error);
      return [];
    }
  },

  // Get recent registrations
  getRecentRegistrations: async (limit = 5) => {
    try {
      const response = await api.get('/registrations/', { 
        ordering: '-created_at',
        page_size: limit 
      });
      return response.results || [];
    } catch (error) {
      console.error('Error fetching recent registrations:', error);
      return [];
    }
  },

  // Get pending approvals
  getPendingApprovals: async () => {
    try {
      const response = await api.get('/registrations/', { 
        status: 'pending',
        ordering: '-created_at'
      });
      return response.results || [];
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }
  },

  // Get today's matches
  getTodaysMatches: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get('/fixtures/', { 
        date: today,
        ordering: 'start_time'
      });
      return response.results || [];
    } catch (error) {
      console.error('Error fetching today\'s matches:', error);
      return [];
    }
  },

  // Get reschedules
  getReschedules: async () => {
    try {
      const response = await api.get('/fixtures/', { 
        status: 'rescheduled',
        ordering: '-updated_at'
      });
      return response.results || [];
    } catch (error) {
      console.error('Error fetching reschedules:', error);
      return [];
    }
  }
};

/**
 * Coach Dashboard API
 */
export const coachDashboardAPI = {
  // Get coach's teams
  getMyTeams: async () => {
    try {
      const response = await api.get('/teams/', { 
        coach: 'me',
        ordering: '-created_at'
      });
      return response.results || [];
    } catch (error) {
      console.error('Error fetching coach teams:', error);
      return [];
    }
  },

  // Get upcoming fixtures for coach's teams
  getUpcomingFixtures: async () => {
    try {
      const response = await api.get('/fixtures/', { 
        coach: 'me',
        status: 'scheduled',
        ordering: 'start_time'
      });
      return response.results || [];
    } catch (error) {
      console.error('Error fetching upcoming fixtures:', error);
      return [];
    }
  },

  // Get roster count for all teams
  getRosterCount: async () => {
    try {
      const teams = await coachDashboardAPI.getMyTeams();
      return teams.reduce((total, team) => total + (team.member_count || 0), 0);
    } catch (error) {
      console.error('Error fetching roster count:', error);
      return 0;
    }
  },

  // Get announcements for coach
  getAnnouncements: async () => {
    try {
      const response = await api.get('/announcements/', { 
        target_roles: 'COACH',
        ordering: '-created_at',
        page_size: 5
      });
      return response.results || [];
    } catch (error) {
      console.error('Error fetching coach announcements:', error);
      return [];
    }
  }
};

/**
 * Athlete Dashboard API
 */
export const athleteDashboardAPI = {
  // Get next match for athlete
  getNextMatch: async () => {
    try {
      const response = await api.get('/fixtures/', { 
        athlete: 'me',
        status: 'scheduled',
        ordering: 'start_time',
        page_size: 1
      });
      return response.results?.[0] || null;
    } catch (error) {
      console.error('Error fetching next match:', error);
      return null;
    }
  },

  // Get athlete's results
  getMyResults: async () => {
    try {
      const response = await api.get('/results/', { 
        athlete: 'me',
        ordering: '-created_at',
        page_size: 10
      });
      return response.results || [];
    } catch (error) {
      console.error('Error fetching athlete results:', error);
      return [];
    }
  },

  // Get athlete's tickets
  getMyTickets: async () => {
    try {
      const response = await api.get('/tickets/', { 
        user: 'me',
        ordering: '-created_at'
      });
      return response.results || [];
    } catch (error) {
      console.error('Error fetching athlete tickets:', error);
      return [];
    }
  },

  // Get announcements for athlete
  getAnnouncements: async () => {
    try {
      const response = await api.get('/announcements/', { 
        target_roles: 'ATHLETE',
        ordering: '-created_at',
        page_size: 5
      });
      return response.results || [];
    } catch (error) {
      console.error('Error fetching athlete announcements:', error);
      return [];
    }
  }
};

/**
 * Spectator Dashboard API
 */
export const spectatorDashboardAPI = {
  // Get upcoming events
  getUpcomingEvents: async () => {
    try {
      const response = await api.get('/public/events/', { 
        status: 'published',
        ordering: 'start_date',
        page_size: 10
      });
      return response.results || [];
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }
  },

  // Get spectator's tickets
  getMyTickets: async () => {
    try {
      const response = await api.get('/tickets/', { 
        user: 'me',
        ordering: '-created_at'
      });
      return response.results || [];
    } catch (error) {
      console.error('Error fetching spectator tickets:', error);
      return [];
    }
  },

  // Get public announcements
  getAnnouncements: async () => {
    try {
      const response = await api.get('/announcements/', { 
        target_roles: 'SPECTATOR',
        ordering: '-created_at',
        page_size: 5
      });
      return response.results || [];
    } catch (error) {
      console.error('Error fetching spectator announcements:', error);
      return [];
    }
  }
};

/**
 * Common dashboard utilities
 */
export const dashboardUtils = {
  // Format date for display
  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Format time for display
  formatTime: (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  },

  // Format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },

  // Get status color class
  getStatusColor: (status) => {
    const statusColors = {
      'pending': 'yellow',
      'confirmed': 'green',
      'rejected': 'red',
      'cancelled': 'gray',
      'upcoming': 'blue',
      'ongoing': 'green',
      'completed': 'gray',
      'scheduled': 'blue',
      'rescheduled': 'yellow',
      'cancelled': 'red'
    };
    return statusColors[status] || 'gray';
  }
};

export default {
  adminDashboardAPI,
  coachDashboardAPI,
  athleteDashboardAPI,
  spectatorDashboardAPI,
  dashboardUtils
};
