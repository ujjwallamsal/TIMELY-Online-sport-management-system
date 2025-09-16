/**
 * Registrations Page - Manage event registrations (teams/athletes)
 */
import { BasePage } from './BasePage.js';

export class RegistrationsPage extends BasePage {
  constructor(app) {
    super(app);
    this.registrations = [];
    this.events = [];
    this.pagination = null;
    this.filters = {
      search: '',
      status: '',
      type: '',
      event: ''
    };
  }

  async render(route) {
    this.showLoading();
    try {
      await this.loadData();
      this.renderPage();
    } catch (error) {
      console.error('Registrations render failed:', error);
      this.showError('Failed to load registrations');
    }
  }

  async loadData() {
    const [regs, evts] = await Promise.all([
      this.app.api.getRegistrations({
        search: this.filters.search,
        status: this.filters.status,
        type: this.filters.type,
        event: this.filters.event,
        page_size: 20
      }),
      this.app.api.getEvents({ page_size: 200 })
    ]);
    this.registrations = regs.data || [];
    this.pagination = regs.pagination;
    this.events = evts.data || [];
  }

  renderPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="registrations-page">
        <div class="page-header">
          <div class="page-title-section">
            <h1 class="page-title">Registrations</h1>
            <p class="page-subtitle">Approve or manage team/athlete registrations</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline" onclick="window.registrationsPage.exportRegistrations()">
              Export CSV
            </button>
            <button class="btn btn-primary" onclick="window.registrationsPage.openCreateModal()">
              New Registration
            </button>
          </div>
        </div>

        <div class="page-filters">
          <div class="filters-row">
            ${this.createSearchInput('Search name/email/team...', 'window.registrationsPage.handleSearch')}
            ${this.createFilterDropdown('Status', [
              { value: '', label: 'All Status' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected' }
            ], 'window.registrationsPage.handleStatusFilter')}
            ${this.createFilterDropdown('Type', [
              { value: '', label: 'All Types' },
              { value: 'TEAM', label: 'Team' },
              { value: 'ATHLETE', label: 'Athlete' }
            ], 'window.registrationsPage.handleTypeFilter')}
            ${this.createFilterDropdown('Event', [
              { value: '', label: 'All Events' },
              ...this.events.map(e => ({ value: e.id, label: e.name }))
            ], 'window.registrationsPage.handleEventFilter')}
          </div>
        </div>

        ${this.renderTable()}
      </div>
    `;
    window.registrationsPage = this;
  }

  renderTable() {
    if (!this.registrations.length) {
      return `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h3 class="empty-title">No registrations found</h3>
          <p class="empty-message">Create a registration to get started</p>
          <button class="btn btn-primary" onclick="window.registrationsPage.openCreateModal()">New Registration</button>
        </div>
      `;
    }

    return `
      <div class="registrations-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Type</th>
              <th>Event</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.registrations.map(r => this.renderRow(r)).join('')}
          </tbody>
        </table>
        ${this.pagination ? this.createPagination(this.pagination, 'window.registrationsPage.gotoPage') : ''}
      </div>
    `;
  }

  renderRow(reg) {
    const event = this.events.find(e => e.id === reg.event);
    return `
      <tr>
        <td>
          <div class="applicant-info">
            <div class="applicant-name">${reg.applicant_name || 'Unknown'}</div>
            ${reg.applicant?.email ? `<div class="applicant-email">${reg.applicant.email}</div>` : ''}
          </div>
        </td>
        <td>
          <span class="type-badge type-${(reg.type || '').toLowerCase()}">${reg.type}</span>
        </td>
        <td>
          <div class="event-info">
            <div class="event-name">${event?.name || 'Unknown Event'}</div>
            ${event?.start_date ? `<div class="event-date">${this.formatDate(event.start_date)}</div>` : ''}
          </div>
        </td>
        <td>${this.getStatusBadge(reg.status)}</td>
        <td>${this.formatRelativeDate(reg.submitted_at)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline" onclick="window.registrationsPage.view(${reg.id})">View</button>
            ${reg.status === 'PENDING' ? `
              <button class="btn btn-sm btn-primary" onclick="window.registrationsPage.approve(${reg.id})">Approve</button>
              <button class="btn btn-sm btn-danger" onclick="window.registrationsPage.reject(${reg.id})">Reject</button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }

  // Filters/search/pagination
  handleSearch = (q) => { this.filters.search = q; this.refresh(); }
  handleStatusFilter = (v) => { this.filters.status = v; this.refresh(); }
  handleTypeFilter = (v) => { this.filters.type = v; this.refresh(); }
  handleEventFilter = (v) => { this.filters.event = v; this.refresh(); }
  gotoPage = async () => { /* optional: implement server-driven pagination */ }

  async refresh() {
    this.showLoading();
    await this.loadData();
    this.renderPage();
  }

  // Create
  openCreateModal() {
    const modalContent = `
      <form id="registration-create-form">
        <div class="form-group">
          <label class="form-label" for="reg-event">Event *</label>
          <select id="reg-event" name="event" class="form-input" required>
            <option value="">Select event</option>
            ${this.events.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-type">Type *</label>
          <select id="reg-type" name="type" class="form-input" required>
            <option value="">Select type</option>
            <option value="ATHLETE">Athlete</option>
            <option value="TEAM">Team</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-applicant">Applicant Email *</label>
          <input id="reg-applicant" name="applicant" type="email" class="form-input" placeholder="email@example.com" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-team">Team Name (if team)</label>
          <input id="reg-team" name="team_name" type="text" class="form-input" placeholder="Team name" />
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-notes">Notes</label>
          <textarea id="reg-notes" name="notes" rows="3" class="form-input" placeholder="Notes..."></textarea>
        </div>
      </form>
    `;
    this.createModal('New Registration', modalContent, [
      { label: 'Cancel', class: 'btn-outline', onclick: 'window.app.closeModal()' },
      { label: 'Create', class: 'btn-primary', onclick: 'window.registrationsPage.create()' }
    ]);
  }

  async create() {
    const form = document.getElementById('registration-create-form');
    const fd = new FormData(form);
    const payload = {
      event: fd.get('event'),
      type: fd.get('type'),
      applicant: fd.get('applicant'),
      team_name: fd.get('team_name') || undefined,
      notes: fd.get('notes') || undefined
    };
    if (!payload.event || !payload.type || !payload.applicant) {
      this.app.notificationManager.error('Please fill all required fields');
      return;
    }
    try {
      await this.app.api.createRegistration(payload);
      this.app.notificationManager.success('Registration created');
      this.app.closeModal();
      await this.refresh();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Failed to create registration');
    }
  }

  // View
  async view(id) {
    try {
      const reg = await this.app.api.getRegistration(id);
      const evt = this.events.find(e => e.id === reg.event);
      const modalContent = `
        <div class="detail-section">
          <h3>Registration</h3>
          <div class="detail-grid">
            <div class="detail-item"><label>Applicant</label><span>${reg.applicant_name || 'Unknown'}</span></div>
            <div class="detail-item"><label>Type</label><span>${reg.type}</span></div>
            <div class="detail-item"><label>Event</label><span>${evt?.name || 'Unknown'}</span></div>
            <div class="detail-item"><label>Status</label><span>${reg.status}</span></div>
            <div class="detail-item"><label>Submitted</label><span>${this.formatDate(reg.submitted_at)}</span></div>
          </div>
        </div>
        ${reg.notes ? `<div class=\"detail-section\"><h3>Notes</h3><p>${reg.notes}</p></div>` : ''}
      `;
      this.createModal('Registration Details', modalContent, [
        { label: 'Close', class: 'btn-outline', onclick: 'window.app.closeModal()' }
      ]);
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Failed to load registration');
    }
  }

  // Approve / Reject
  approve(id) {
    this.showConfirmation('Approve this registration?', `window.registrationsPage.doApprove(${id})`);
  }
  async doApprove(id) {
    try {
      await this.app.api.approveRegistration(id);
      this.app.notificationManager.success('Approved');
      await this.refresh();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Failed to approve');
    }
  }
  reject(id) {
    const content = `
      <div class="form-group">
        <label class="form-label" for="rej-reason">Reason *</label>
        <textarea id="rej-reason" class="form-input" rows="3" placeholder="Reason for rejection" required></textarea>
      </div>
    `;
    this.createModal('Reject Registration', content, [
      { label: 'Cancel', class: 'btn-outline', onclick: 'window.app.closeModal()' },
      { label: 'Reject', class: 'btn-danger', onclick: 'window.registrationsPage.doReject()' }
    ]);
    this._pendingRejectId = id;
  }
  async doReject() {
    const reason = document.getElementById('rej-reason').value.trim();
    if (!reason) { this.app.notificationManager.error('Reason is required'); return; }
    try {
      await this.app.api.rejectRegistration(this._pendingRejectId, reason);
      this.app.notificationManager.success('Rejected');
      this.app.closeModal();
      await this.refresh();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Failed to reject');
    } finally {
      this._pendingRejectId = undefined;
    }
  }

  // Export
  async exportRegistrations() {
    try {
      await this.app.api.exportRegistrationsCSV();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Export failed');
    }
  }
}
