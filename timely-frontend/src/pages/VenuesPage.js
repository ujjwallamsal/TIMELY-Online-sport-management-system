/**
 * Venues Page - Manage venues with availability indicator
 */
import { BasePage } from './BasePage.js';

export class VenuesPage extends BasePage {
  constructor(app) {
    super(app);
    this.venues = [];
    this.pagination = null;
    this.filters = { search: '' };
  }

  async render(route) {
    this.showLoading();
    try {
      await this.loadVenues();
      this.renderPage();
    } catch (e) {
      console.error('Venues render failed:', e);
      this.showError('Failed to load venues');
    }
  }

  async loadVenues() {
    const res = await this.app.api.getVenues({ search: this.filters.search, page_size: 20 });
    this.venues = res.data || [];
    this.pagination = res.pagination;
  }

  renderPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="venues-page">
        <div class="page-header">
          <div class="page-title-section">
            <h1 class="page-title">Venues</h1>
            <p class="page-subtitle">Locations with capacity and availability indicators</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" onclick="window.venuesPage.openCreateModal()">Add Venue</button>
          </div>
        </div>

        <div class="page-filters">
          <div class="filters-row">
            ${this.createSearchInput('Search venues...', 'window.venuesPage.handleSearch')}
          </div>
        </div>

        ${this.renderTable()}
      </div>
    `;
    window.venuesPage = this;
  }

  renderTable() {
    if (!this.venues.length) {
      return `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <h3 class="empty-title">No venues</h3>
          <p class="empty-message">Add a venue to get started</p>
          <button class="btn btn-primary" onclick="window.venuesPage.openCreateModal()">Add Venue</button>
        </div>
      `;
    }

    return `
      <div class="registrations-table-container">
        <table class="data-table">
          <thead>
            <tr><th>Name</th><th>City</th><th>Capacity</th><th>Availability</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${this.venues.map(v => this.renderRow(v)).join('')}
          </tbody>
        </table>
        ${this.pagination ? this.createPagination(this.pagination, 'window.venuesPage.gotoPage') : ''}
      </div>
    `;
  }

  renderRow(v) {
    const availability = this.getAvailabilityBadge(v);
    return `
      <tr>
        <td>${v.name}</td>
        <td>${(v.address || '').split('\n')[0] || '-'}</td>
        <td>${v.capacity ?? '-'}</td>
        <td>${availability}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline" onclick="window.venuesPage.openEditModal(${v.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="window.venuesPage.confirmDelete(${v.id})">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  getAvailabilityBadge(v) {
    // Simple indicator: if capacity > 0 it's available; can be extended using slots
    if (v.capacity > 0) return `<span class="status-badge status-approved">Available</span>`;
    return `<span class="status-badge status-rejected">Unavailable</span>`;
  }

  handleSearch = async (q) => { this.filters.search = q; await this.refresh(); }
  gotoPage = async () => {}

  async refresh() {
    this.showLoading();
    await this.loadVenues();
    this.renderPage();
  }

  // Modals
  openCreateModal() {
    const content = this.venueForm();
    this.createModal('Add Venue', content, [
      { label: 'Cancel', class: 'btn-outline', onclick: 'window.app.closeModal()' },
      { label: 'Create', class: 'btn-primary', onclick: 'window.venuesPage.create()' }
    ]);
  }

  openEditModal(id) {
    const v = this.venues.find(x => x.id === id) || null;
    const content = this.venueForm(v);
    this.createModal('Edit Venue', content, [
      { label: 'Cancel', class: 'btn-outline', onclick: 'window.app.closeModal()' },
      { label: 'Save', class: 'btn-primary', onclick: `window.venuesPage.save(${id})` }
    ]);
  }

  venueForm(venue = null) {
    return `
      <form id="venue-form">
        <div class="form-group">
          <label class="form-label" for="v-name">Name *</label>
          <input id="v-name" name="name" class="form-input" value="${venue?.name || ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="v-address">Address</label>
          <textarea id="v-address" name="address" class="form-input" rows="3">${venue?.address || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="v-capacity">Capacity</label>
          <input id="v-capacity" name="capacity" type="number" class="form-input" value="${venue?.capacity ?? ''}" />
        </div>
      </form>
    `;
  }

  async create() {
    const fd = new FormData(document.getElementById('venue-form'));
    const payload = Object.fromEntries(fd.entries());
    if (payload.capacity) payload.capacity = Number(payload.capacity);
    try {
      await this.app.api.createVenue(payload);
      this.app.notificationManager.success('Venue created');
      this.app.closeModal();
      await this.refresh();
    } catch {
      this.app.notificationManager.error('Failed to create venue');
    }
  }

  async save(id) {
    const fd = new FormData(document.getElementById('venue-form'));
    const payload = Object.fromEntries(fd.entries());
    if (payload.capacity) payload.capacity = Number(payload.capacity);
    try {
      await this.app.api.updateVenue(id, payload);
      this.app.notificationManager.success('Venue updated');
      this.app.closeModal();
      await this.refresh();
    } catch {
      this.app.notificationManager.error('Failed to update venue');
    }
  }

  confirmDelete(id) {
    this.showConfirmation('Delete this venue?', `window.venuesPage.doDelete(${id})`);
  }

  async doDelete(id) {
    try {
      await this.app.api.deleteVenue(id);
      this.app.notificationManager.success('Deleted');
      await this.refresh();
    } catch {
      this.app.notificationManager.error('Failed to delete venue');
    }
  }
}
