/**
 * Dashboard Page - Main overview with KPIs and recent activity
 */
import { BasePage } from './BasePage.js';

export class DashboardPage extends BasePage {
  constructor(app) {
    super(app);
    this.data = {
      stats: null,
      recentEvents: [],
      recentRegistrations: [],
      recentNotifications: []
    };
  }

  /**
   * Render the dashboard page
   */
  async render(route) {
    this.showLoading();
    
    try {
      // Load dashboard data
      await this.loadDashboardData();
      
      // Render the page
      this.renderDashboard();
      
    } catch (error) {
      console.error('Dashboard render failed:', error);
      this.showError('Failed to load dashboard data');
    }
  }

  /**
   * Load dashboard data
   */
  async loadDashboardData() {
    try {
      // Load data in parallel
      const [events, registrations, notifications] = await Promise.all([
        this.app.api.getEvents({ page_size: 5, ordering: '-start_date' }),
        this.app.api.getRegistrations({ page_size: 5, ordering: '-submitted_at' }),
        this.app.api.getNotifications({ page_size: 5, ordering: '-created_at' })
      ]);

      this.data.recentEvents = events.data || [];
      this.data.recentRegistrations = registrations.data || [];
      this.data.recentNotifications = notifications.data || [];

      // Calculate stats
      this.data.stats = await this.calculateStats();

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      throw error;
    }
  }

  /**
   * Calculate dashboard statistics
   */
  async calculateStats() {
    try {
      const [events, registrations, venues, tickets] = await Promise.all([
        this.app.api.getEvents({ page_size: 1 }),
        this.app.api.getRegistrations({ page_size: 1 }),
        this.app.api.getVenues({ page_size: 1 }),
        this.app.api.getTickets({ page_size: 1 })
      ]);

      return {
        totalEvents: events.pagination.total,
        totalRegistrations: registrations.pagination.total,
        totalVenues: venues.pagination.total,
        totalTickets: tickets.pagination.total,
        upcomingEvents: this.data.recentEvents.filter(event => 
          new Date(event.start_date) > new Date()
        ).length,
        pendingRegistrations: this.data.recentRegistrations.filter(reg => 
          reg.status === 'PENDING'
        ).length
      };
    } catch (error) {
      console.error('Failed to calculate stats:', error);
      return {
        totalEvents: 0,
        totalRegistrations: 0,
        totalVenues: 0,
        totalTickets: 0,
        upcomingEvents: 0,
        pendingRegistrations: 0
      };
    }
  }

  /**
   * Render the dashboard
   */
  renderDashboard() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="dashboard">
        <div class="dashboard-header">
          <h1 class="dashboard-title">Dashboard</h1>
          <p class="dashboard-subtitle">Welcome back, ${this.app.currentUser?.display_name || 'User'}!</p>
        </div>

        <div class="dashboard-content">
          <!-- KPI Cards -->
          <div class="kpi-grid">
            ${this.renderKPICards()}
          </div>

          <!-- Main Content Grid -->
          <div class="dashboard-grid">
            <!-- Recent Events -->
            <div class="dashboard-card">
              <div class="card-header">
                <h2 class="card-title">Recent Events</h2>
                <a href="#/events" class="card-action">View All</a>
              </div>
              <div class="card-content">
                ${this.renderRecentEvents()}
              </div>
            </div>

            <!-- Recent Registrations -->
            <div class="dashboard-card">
              <div class="card-header">
                <h2 class="card-title">Recent Registrations</h2>
                <a href="#/registrations" class="card-action">View All</a>
              </div>
              <div class="card-content">
                ${this.renderRecentRegistrations()}
              </div>
            </div>

            <!-- Recent Notifications -->
            <div class="dashboard-card">
              <div class="card-header">
                <h2 class="card-title">Recent Notifications</h2>
                <a href="#" class="card-action">View All</a>
              </div>
              <div class="card-content">
                ${this.renderRecentNotifications()}
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="dashboard-card">
              <div class="card-header">
                <h2 class="card-title">Quick Actions</h2>
              </div>
              <div class="card-content">
                ${this.renderQuickActions()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    this.setupEventListeners();
  }

  /**
   * Render KPI cards
   */
  renderKPICards() {
    const stats = this.data.stats || {};
    
    return `
      <div class="kpi-card">
        <div class="kpi-icon kpi-icon-events">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 3v4"></path>
            <path d="M17 3v4"></path>
            <path d="M3 8h18"></path>
            <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"></path>
          </svg>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">${stats.totalEvents || 0}</div>
          <div class="kpi-label">Total Events</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon kpi-icon-registrations">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">${stats.totalRegistrations || 0}</div>
          <div class="kpi-label">Total Registrations</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon kpi-icon-venues">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">${stats.totalVenues || 0}</div>
          <div class="kpi-label">Total Venues</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon kpi-icon-tickets">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">${stats.totalTickets || 0}</div>
          <div class="kpi-label">Total Tickets</div>
        </div>
      </div>
    `;
  }

  /**
   * Render recent events
   */
  renderRecentEvents() {
    if (!this.data.recentEvents.length) {
      return '<div class="empty-state">No recent events</div>';
    }

    return this.data.recentEvents.map(event => `
      <div class="recent-item">
        <div class="recent-item-content">
          <div class="recent-item-title">${event.name}</div>
          <div class="recent-item-meta">
            <span class="recent-item-date">${this.formatDate(event.start_date)}</span>
            <span class="recent-item-status status-${event.status.toLowerCase()}">${event.status}</span>
          </div>
        </div>
        <div class="recent-item-action">
          <a href="#/events/${event.id}" class="btn btn-sm btn-outline">View</a>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render recent registrations
   */
  renderRecentRegistrations() {
    if (!this.data.recentRegistrations.length) {
      return '<div class="empty-state">No recent registrations</div>';
    }

    return this.data.recentRegistrations.map(registration => `
      <div class="recent-item">
        <div class="recent-item-content">
          <div class="recent-item-title">${registration.applicant_name || 'Unknown'}</div>
          <div class="recent-item-meta">
            <span class="recent-item-type">${registration.type}</span>
            <span class="recent-item-status status-${registration.status.toLowerCase()}">${registration.status}</span>
          </div>
        </div>
        <div class="recent-item-action">
          <a href="#/registrations" class="btn btn-sm btn-outline">View</a>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render recent notifications
   */
  renderRecentNotifications() {
    if (!this.data.recentNotifications.length) {
      return '<div class="empty-state">No recent notifications</div>';
    }

    return this.data.recentNotifications.map(notification => `
      <div class="recent-item">
        <div class="recent-item-content">
          <div class="recent-item-title">${notification.title || 'Notification'}</div>
          <div class="recent-item-meta">
            <span class="recent-item-date">${this.formatDate(notification.created_at)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render quick actions
   */
  renderQuickActions() {
    const userRole = this.app.currentUser?.role || 'SPECTATOR';
    
    const actions = {
      ADMIN: [
        { label: 'Create Event', href: '#/events', icon: 'plus' },
        { label: 'Manage Users', href: '#/users', icon: 'users' },
        { label: 'View Reports', href: '#/reports', icon: 'bar-chart' }
      ],
      ORGANIZER: [
        { label: 'Create Event', href: '#/events', icon: 'plus' },
        { label: 'Manage Registrations', href: '#/registrations', icon: 'users' },
        { label: 'Generate Fixtures', href: '#/fixtures', icon: 'calendar' },
        { label: 'Enter Results', href: '#/results', icon: 'trophy' }
      ],
      COACH: [
        { label: 'View My Teams', href: '#/registrations', icon: 'users' },
        { label: 'View Schedule', href: '#/fixtures', icon: 'calendar' },
        { label: 'View Results', href: '#/results', icon: 'trophy' }
      ],
      ATHLETE: [
        { label: 'My Registrations', href: '#/registrations', icon: 'user' },
        { label: 'My Schedule', href: '#/fixtures', icon: 'calendar' },
        { label: 'My Results', href: '#/results', icon: 'trophy' }
      ],
      SPECTATOR: [
        { label: 'View Events', href: '#/events', icon: 'calendar' },
        { label: 'View Schedule', href: '#/fixtures', icon: 'clock' },
        { label: 'View Results', href: '#/results', icon: 'trophy' }
      ]
    };

    const userActions = actions[userRole] || actions.SPECTATOR;

    return userActions.map(action => `
      <a href="${action.href}" class="quick-action">
        <div class="quick-action-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${this.getIcon(action.icon)}
          </svg>
        </div>
        <span class="quick-action-label">${action.label}</span>
      </a>
    `).join('');
  }

  /**
   * Get icon SVG path
   */
  getIcon(iconName) {
    const icons = {
      plus: '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
      'bar-chart': '<line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line>',
      calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
      trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21l-1.5.6c-.5.2-1.03.2-1.53 0l-1.5-.6C4.47 17.98 4 17.55 4 17v-2.34"></path><path d="M20 14.66V17c0 .55.47.98.97 1.21l1.5.6c.5.2 1.03.2 1.53 0l1.5-.6C25.53 17.98 26 17.55 26 17v-2.34"></path><path d="M12 14.66V17c0 .55.47.98.97 1.21l1.5.6c.5.2 1.03.2 1.53 0l1.5-.6c.5-.23.97-.66.97-1.21v-2.34"></path>',
      user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
      clock: '<circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline>'
    };
    
    return icons[iconName] || icons.plus;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Quick action clicks
    const quickActions = document.querySelectorAll('.quick-action');
    quickActions.forEach(action => {
      action.addEventListener('click', (e) => {
        e.preventDefault();
        const href = action.getAttribute('href');
        this.app.router.navigate(href);
      });
    });

    // Recent item clicks
    const recentItems = document.querySelectorAll('.recent-item-action a');
    recentItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const href = item.getAttribute('href');
        this.app.router.navigate(href);
      });
    });
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}
