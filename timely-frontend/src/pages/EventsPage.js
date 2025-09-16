/**
 * Events Page - List and manage events
 */
import { BasePage } from './BasePage.js';

export class EventsPage extends BasePage {
  constructor(app) {
    super(app);
    this.events = [];
    this.pagination = null;
    this.filters = {
      search: '',
      status: '',
      sport: ''
    };
  }

  /**
   * Render the events page
   */
  async render(route) {
    this.showLoading();
    
    try {
      await this.loadEvents();
      this.renderEvents();
    } catch (error) {
      console.error('Events render failed:', error);
      this.showError('Failed to load events');
    }
  }

  /**
   * Load events data
   */
  async loadEvents() {
    const response = await this.app.api.getEvents({
      search: this.filters.search,
      status: this.filters.status,
      sport: this.filters.sport,
      page_size: 20
    });
    
    this.events = response.data || [];
    this.pagination = response.pagination;
  }

  /**
   * Render the events list
   */
  renderEvents() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="events-page">
        <div class="page-header">
          <div class="page-title-section">
            <h1 class="page-title">Events</h1>
            <p class="page-subtitle">Manage and organize your sports events</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" onclick="window.eventsPage.showCreateEventModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create Event
            </button>
          </div>
        </div>

        <div class="page-filters">
          <div class="filters-row">
            ${this.createSearchInput('Search events...', 'window.eventsPage.handleSearch')}
            ${this.createFilterDropdown('Status', [
              { value: '', label: 'All Status' },
              { value: 'UPCOMING', label: 'Upcoming' },
              { value: 'ONGOING', label: 'Ongoing' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' }
            ], 'window.eventsPage.handleStatusFilter')}
            ${this.createFilterDropdown('Sport', [
              { value: '', label: 'All Sports' },
              { value: 'football', label: 'Football' },
              { value: 'basketball', label: 'Basketball' },
              { value: 'tennis', label: 'Tennis' },
              { value: 'soccer', label: 'Soccer' }
            ], 'window.eventsPage.handleSportFilter')}
          </div>
        </div>

        <div class="events-content">
          ${this.renderEventsList()}
        </div>
      </div>
    `;

    // Make this instance globally accessible for onclick handlers
    window.eventsPage = this;
    this.setupEventListeners();
  }

  /**
   * Render events list
   */
  renderEventsList() {
    if (!this.events.length) {
      return `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7 3v4"></path>
              <path d="M17 3v4"></path>
              <path d="M3 8h18"></path>
              <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"></path>
            </svg>
          </div>
          <h3 class="empty-title">No events found</h3>
          <p class="empty-message">Get started by creating your first event</p>
          <button class="btn btn-primary" onclick="window.eventsPage.showCreateEventModal()">
            Create Event
          </button>
        </div>
      `;
    }

    return `
      <div class="events-grid">
        ${this.events.map(event => this.renderEventCard(event)).join('')}
      </div>
      ${this.pagination ? this.createPagination(this.pagination, 'window.eventsPage.handlePageChange') : ''}
    `;
  }

  /**
   * Render individual event card
   */
  renderEventCard(event) {
    return `
      <div class="event-card">
        <div class="event-card-header">
          <div class="event-status">
            ${this.getStatusBadge(event.status)}
          </div>
          <div class="event-actions">
            <button class="btn btn-sm btn-outline" onclick="window.eventsPage.editEvent(${event.id})">
              Edit
            </button>
            <button class="btn btn-sm btn-outline" onclick="window.eventsPage.viewEvent(${event.id})">
              View
            </button>
          </div>
        </div>
        
        <div class="event-card-content">
          <h3 class="event-title">${event.name}</h3>
          <p class="event-description">${event.description || 'No description available'}</p>
          
          <div class="event-meta">
            <div class="event-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>${this.formatDate(event.start_date)}</span>
            </div>
            
            <div class="event-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${event.venue?.name || 'TBD'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Handle search
   */
  handleSearch(query) {
    this.filters.search = query;
    this.refreshEvents();
  }

  /**
   * Handle status filter
   */
  handleStatusFilter(status) {
    this.filters.status = status;
    this.refreshEvents();
  }

  /**
   * Handle sport filter
   */
  handleSportFilter(sport) {
    this.filters.sport = sport;
    this.refreshEvents();
  }

  /**
   * Handle page change
   */
  async handlePageChange(page) {
    // TODO: Implement pagination
    console.log('Page change to:', page);
  }

  /**
   * Refresh events list
   */
  async refreshEvents() {
    this.showLoading();
    try {
      await this.loadEvents();
      this.renderEvents();
    } catch (error) {
      console.error('Failed to refresh events:', error);
      this.showError('Failed to refresh events');
    }
  }

  /**
   * Show create event modal
   */
  showCreateEventModal() {
    this.app.notificationManager.info('Create event feature coming soon');
  }

  /**
   * Edit event
   */
  editEvent(eventId) {
    this.app.router.navigate(`/events/${eventId}/edit`);
  }

  /**
   * View event
   */
  viewEvent(eventId) {
    this.app.router.navigate(`/events/${eventId}`);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Event listeners are handled by onclick attributes for now
  }
}
