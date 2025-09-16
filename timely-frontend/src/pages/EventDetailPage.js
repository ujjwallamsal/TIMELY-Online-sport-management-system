/**
 * Event Detail Page - View and manage individual events
 */
import { BasePage } from './BasePage.js';

export class EventDetailPage extends BasePage {
  constructor(app) {
    super(app);
    this.event = null;
    this.activeTab = 'overview';
  }

  async render(route) {
    const eventId = route?.params?.id;
    const tab = route?.params?.tab || 'overview';
    
    if (!eventId) {
      this.showError('Event ID is required');
      return;
    }

    this.activeTab = tab;
    this.showLoading();

    try {
      await this.loadEvent(eventId);
      this.renderEventDetail();
    } catch (error) {
      console.error('Event detail render failed:', error);
      this.showError('Failed to load event details');
    }
  }

  async loadEvent(eventId) {
    this.event = await this.app.api.getEvent(eventId);
  }

  renderEventDetail() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="event-detail-page">
        <div class="event-header">
          <div class="event-header-content">
            <h1 class="event-title">${this.event?.name || 'Event Details'}</h1>
            <div class="event-meta">
              <span class="event-status">${this.getStatusBadge(this.event?.status)}</span>
              <span class="event-date">${this.formatDate(this.event?.start_date)}</span>
            </div>
          </div>
          <div class="event-actions">
            <button class="btn btn-outline">Edit Event</button>
            <button class="btn btn-primary">Manage</button>
          </div>
        </div>

        <div class="event-tabs">
          <button class="tab-button ${this.activeTab === 'overview' ? 'active' : ''}" onclick="window.eventDetailPage.switchTab('overview')">
            Overview
          </button>
          <button class="tab-button ${this.activeTab === 'participants' ? 'active' : ''}" onclick="window.eventDetailPage.switchTab('participants')">
            Participants
          </button>
          <button class="tab-button ${this.activeTab === 'fixtures' ? 'active' : ''}" onclick="window.eventDetailPage.switchTab('fixtures')">
            Fixtures
          </button>
          <button class="tab-button ${this.activeTab === 'results' ? 'active' : ''}" onclick="window.eventDetailPage.switchTab('results')">
            Results
          </button>
          <button class="tab-button ${this.activeTab === 'media' ? 'active' : ''}" onclick="window.eventDetailPage.switchTab('media')">
            Media
          </button>
          <button class="tab-button ${this.activeTab === 'tickets' ? 'active' : ''}" onclick="window.eventDetailPage.switchTab('tickets')">
            Tickets
          </button>
          <button class="tab-button ${this.activeTab === 'settings' ? 'active' : ''}" onclick="window.eventDetailPage.switchTab('settings')">
            Settings
          </button>
        </div>

        <div class="event-content">
          ${this.renderTabContent()}
        </div>
      </div>
    `;

    window.eventDetailPage = this;
  }

  renderTabContent() {
    switch (this.activeTab) {
      case 'overview':
        return this.renderOverviewTab();
      case 'participants':
        return this.renderParticipantsTab();
      case 'fixtures':
        return this.renderFixturesTab();
      case 'results':
        return this.renderResultsTab();
      case 'media':
        return this.renderMediaTab();
      case 'tickets':
        return this.renderTicketsTab();
      case 'settings':
        return this.renderSettingsTab();
      default:
        return this.renderOverviewTab();
    }
  }

  renderOverviewTab() {
    return `
      <div class="tab-content">
        <h2>Event Overview</h2>
        <p>Event details and statistics will be displayed here.</p>
      </div>
    `;
  }

  renderParticipantsTab() {
    return `
      <div class="tab-content">
        <h2>Participants</h2>
        <p>Event participants and registrations will be displayed here.</p>
      </div>
    `;
  }

  renderFixturesTab() {
    return `
      <div class="tab-content">
        <h2>Fixtures</h2>
        <p>Event fixtures and schedule will be displayed here.</p>
      </div>
    `;
  }

  renderResultsTab() {
    return `
      <div class="tab-content">
        <h2>Results</h2>
        <p>Event results and leaderboard will be displayed here.</p>
      </div>
    `;
  }

  renderMediaTab() {
    return `
      <div class="tab-content">
        <h2>Media</h2>
        <p>Event photos and videos will be displayed here.</p>
      </div>
    `;
  }

  renderTicketsTab() {
    return `
      <div class="tab-content">
        <h2>Tickets</h2>
        <p>Event tickets and sales information will be displayed here.</p>
      </div>
    `;
  }

  renderSettingsTab() {
    return `
      <div class="tab-content">
        <h2>Settings</h2>
        <p>Event settings and configuration will be displayed here.</p>
      </div>
    `;
  }

  switchTab(tab) {
    this.activeTab = tab;
    this.app.router.navigate(`/events/${this.event?.id}/${tab}`);
  }
}
