/**
 * Media Page - Gallery with upload and filtering
 */
import { BasePage } from './BasePage.js';

export class MediaPage extends BasePage {
  constructor(app) {
    super(app);
    this.media = [];
    this.events = [];
    this.filters = { event: '', search: '' };
    this.pagination = null;
  }

  async render(route) {
    this.showLoading();
    try {
      const eventsRes = await this.app.api.getEvents({ page_size: 200 });
      this.events = eventsRes.data || [];
      await this.loadMedia();
      this.renderPage();
    } catch (e) {
      console.error('Media render failed:', e);
      this.showError('Failed to load media');
    }
  }

  async loadMedia() {
    const params = { page_size: 24 };
    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.event) params.event = this.filters.event;
    const res = await this.app.api.get('/media/', params);
    this.media = res.results || res.data || [];
    this.pagination = {
      total: res.count || 0,
      page: 1,
      pageSize: params.page_size,
      totalPages: Math.ceil((res.count || 0) / params.page_size)
    };
  }

  renderPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="media-page">
        <div class="page-header">
          <div class="page-title-section">
            <h1 class="page-title">Media</h1>
            <p class="page-subtitle">Upload and manage media assets</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline" onclick="window.mediaPage.openUrlModal()">Attach by URL</button>
            <button class="btn btn-primary" onclick="window.mediaPage.openUploadModal()">Upload File</button>
          </div>
        </div>

        <div class="page-filters">
          <div class="filters-row">
            ${this.createSearchInput('Search media...', 'window.mediaPage.handleSearch')}
            ${this.createFilterDropdown('Event', [ { value:'', label:'All Events' }, ...this.events.map(e => ({ value:e.id, label:e.name })) ], 'window.mediaPage.handleEventFilter')}
          </div>
        </div>

        ${this.renderGrid()}
      </div>
    `;
    window.mediaPage = this;
  }

  renderGrid() {
    if (!this.media.length) {
      return `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21,15 16,10 5,21"></polyline></svg>
          </div>
          <h3 class="empty-title">No media</h3>
          <p class="empty-message">Upload or attach media to display here</p>
        </div>
      `;
    }

    return `
      <div class="media-grid">
        ${this.media.map(m => this.renderCard(m)).join('')}
      </div>
    `;
  }

  renderCard(m) {
    const thumb = m.thumbnail_url || m.url || m.file || '';
    const caption = m.caption || m.title || '';
    return `
      <div class="media-card">
        <div class="media-thumb" style="background-image:url('${thumb}')" role="img" aria-label="${caption}"></div>
        <div class="media-meta">
          <div class="media-caption">${caption || 'Untitled'}</div>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline" onclick="window.open('${m.url || m.file}', '_blank')">Open</button>
            <button class="btn btn-sm btn-danger" onclick="window.mediaPage.confirmDelete(${m.id})">Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  // Filters
  handleSearch = async (q) => { this.filters.search = q; await this.refresh(); }
  handleEventFilter = async (v) => { this.filters.event = v; await this.refresh(); }

  async refresh() {
    this.showLoading();
    await this.loadMedia();
    this.renderPage();
  }

  // Uploads
  openUploadModal() {
    const content = `
      <form id="media-upload-form">
        <div class="form-group">
          <label class="form-label" for="mu-event">Event (optional)</label>
          <select id="mu-event" name="event" class="form-input">
            <option value="">Select event</option>
            ${this.events.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="mu-file">File *</label>
          <input id="mu-file" name="file" type="file" class="form-input" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="mu-caption">Caption</label>
          <input id="mu-caption" name="caption" class="form-input" placeholder="Optional caption" />
        </div>
      </form>
    `;
    this.createModal('Upload Media', content, [
      { label: 'Cancel', class: 'btn-outline', onclick: 'window.app.closeModal()' },
      { label: 'Upload', class: 'btn-primary', onclick: 'window.mediaPage.uploadFile()' }
    ]);
  }

  async uploadFile() {
    const form = document.getElementById('media-upload-form');
    const file = form.querySelector('input[name="file"]').files[0];
    if (!file) { this.app.notificationManager.error('Please select a file'); return; }
    const eventId = form.querySelector('select[name="event"]').value;
    const caption = form.querySelector('input[name="caption"]').value;
    try {
      await this.app.api.upload('/media/', file, { event: eventId || undefined, caption: caption || undefined });
      this.app.notificationManager.success('Uploaded');
      this.app.closeModal();
      await this.refresh();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Upload failed');
    }
  }

  openUrlModal() {
    const content = `
      <div class="form-group">
        <label class="form-label" for="mu2-event">Event (optional)</label>
        <select id="mu2-event" class="form-input">
          <option value="">Select event</option>
          ${this.events.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="mu2-url">Media URL *</label>
        <input id="mu2-url" class="form-input" placeholder="https://..." />
      </div>
      <div class="form-group">
        <label class="form-label" for="mu2-caption">Caption</label>
        <input id="mu2-caption" class="form-input" />
      </div>
    `;
    this.createModal('Attach by URL', content, [
      { label: 'Cancel', class: 'btn-outline', onclick: 'window.app.closeModal()' },
      { label: 'Attach', class: 'btn-primary', onclick: 'window.mediaPage.attachUrl()' }
    ]);
  }

  async attachUrl() {
    const eventId = document.getElementById('mu2-event').value;
    const url = document.getElementById('mu2-url').value.trim();
    const caption = document.getElementById('mu2-caption').value.trim();
    if (!url) { this.app.notificationManager.error('URL is required'); return; }
    try {
      await this.app.api.post('/media/', { url, caption: caption || undefined, event: eventId || undefined });
      this.app.notificationManager.success('Attached');
      this.app.closeModal();
      await this.refresh();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Attach failed');
    }
  }

  confirmDelete(id) {
    this.showConfirmation('Delete this media item?', `window.mediaPage.doDelete(${id})`);
  }

  async doDelete(id) {
    try {
      await this.app.api.delete(`/media/${id}/`);
      this.app.notificationManager.success('Deleted');
      await this.refresh();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Delete failed');
    }
  }
}
