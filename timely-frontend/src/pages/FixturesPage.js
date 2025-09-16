/**
 * Fixtures Page - Manage event fixtures
 */
import { BasePage } from './BasePage.js';

export class FixturesPage extends BasePage {
  constructor(app) {
    super(app);
    this.fixtures = [];
    this.events = [];
    this.pagination = null;
    this.filters = {
      search: '',
      event: '',
      status: '',
      round_no: ''
    };
    this.viewMode = 'table'; // 'table' | 'calendar'
    this.calendarCursor = new Date();
  }

  async render(route) {
    this.showLoading();
    try {
      await this.loadData();
      this.renderPage();
    } catch (e) {
      console.error('Fixtures render failed:', e);
      this.showError('Failed to load fixtures');
    }
  }

  async loadData() {
    const [fixturesRes, eventsRes] = await Promise.all([
      this.app.api.getFixtures({
        event: this.filters.event,
        status: this.filters.status,
        round_no: this.filters.round_no,
        search: this.filters.search,
        page_size: 20
      }),
      this.app.api.getEvents({ page_size: 200 })
    ]);

    this.fixtures = fixturesRes.data || [];
    this.pagination = fixturesRes.pagination;
    this.events = eventsRes.data || [];
  }

  renderPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="fixtures-page">
        <div class="page-header">
          <div class="page-title-section">
            <h1 class="page-title">Fixtures</h1>
            <p class="page-subtitle">Create, edit and schedule event fixtures</p>
          </div>
          <div class="page-actions">
            <div class="btn-group" role="group" aria-label="View switch">
              <button class="btn ${this.viewMode==='table' ? 'btn-primary' : 'btn-outline'}" onclick="window.fixturesPage.switchView('table')">Table</button>
              <button class="btn ${this.viewMode==='calendar' ? 'btn-primary' : 'btn-outline'}" onclick="window.fixturesPage.switchView('calendar')">Calendar</button>
            </div>
            <button class="btn btn-outline" onclick="window.fixturesPage.openGenerateModal()">Generate</button>
            <button class="btn btn-primary" onclick="window.fixturesPage.openCreateModal()">New Fixture</button>
          </div>
        </div>

        <div class="page-filters">
          <div class="filters-row">
            ${this.createSearchInput('Search fixtures...', 'window.fixturesPage.handleSearch')}
            ${this.createFilterDropdown('Event', [
              { value: '', label: 'All Events' },
              ...this.events.map(e => ({ value: e.id, label: e.name }))
            ], 'window.fixturesPage.handleEventFilter')}
            ${this.createFilterDropdown('Status', [
              { value: '', label: 'All Status' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ], 'window.fixturesPage.handleStatusFilter')}
            <input class="form-input" style="max-width:140px" placeholder="Round #" onkeyup="if(event.key==='Enter') window.fixturesPage.handleRoundFilter(this.value)" />
          </div>
        </div>

        ${this.viewMode === 'table' ? this.renderTable() : this.renderCalendar()}
      </div>
    `;

    window.fixturesPage = this;
  }

  renderTable() {
    if (!this.fixtures.length) {
      return `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <h3 class="empty-title">No fixtures</h3>
          <p class="empty-message">Create or generate fixtures for an event</p>
          <button class="btn btn-primary" onclick="window.fixturesPage.openCreateModal()">New Fixture</button>
        </div>
      `;
    }

    return `
      <div class="fixtures-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Round</th>
              <th>Home</th>
              <th>Away</th>
              <th>Venue</th>
              <th>Start</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.fixtures.map(f => this.renderRow(f)).join('')}
          </tbody>
        </table>
        ${this.pagination ? this.createPagination(this.pagination, 'window.fixturesPage.gotoPage') : ''}
      </div>
    `;
  }

  renderRow(f) {
    const evt = this.events.find(e => e.id === f.event);
    return `
      <tr>
        <td>${evt?.name || 'Event'}</td>
        <td>${f.round_no ?? '-'}</td>
        <td>${f.home_team?.name || f.home_team || '-'}</td>
        <td>${f.away_team?.name || f.away_team || '-'}</td>
        <td>${f.venue?.name || '-'}</td>
        <td>${this.formatDate(f.starts_at)}</td>
        <td>${this.getStatusBadge((f.status || 'scheduled'), 'default')}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline" onclick="window.fixturesPage.openEditModal(${f.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="window.fixturesPage.confirmDelete(${f.id})">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  // Filters
  handleSearch = (q) => { this.filters.search = q; this.refresh(); }
  handleEventFilter = (v) => { this.filters.event = v; this.refresh(); }
  handleStatusFilter = (v) => { this.filters.status = v; this.refresh(); }
  handleRoundFilter = (v) => { this.filters.round_no = v; this.refresh(); }
  gotoPage = async () => {}

  async refresh() {
    this.showLoading();
    await this.loadData();
    this.renderPage();
  }

  // View switch
  switchView(mode) {
    this.viewMode = mode;
    this.renderPage();
  }

  // Calendar
  renderCalendar() {
    const year = this.calendarCursor.getFullYear();
    const month = this.calendarCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = new Date(firstDay);
    startDay.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7)); // start Monday
    const weeks = 6;

    const monthFixtures = this.fixtures.filter(f => {
      const d = new Date(f.starts_at);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const dayCells = [];
    let cursor = new Date(startDay);
    for (let w = 0; w < weeks; w++) {
      const row = [];
      for (let d = 0; d < 7; d++) {
        const inMonth = cursor.getMonth() === month;
        const iso = cursor.toISOString().slice(0,10);
        const items = monthFixtures.filter(f => (new Date(f.starts_at)).toISOString().slice(0,10) === iso);
        row.push(`
          <div class="cal-cell ${inMonth ? '' : 'muted'}">
            <div class="cal-date">${cursor.getDate()}</div>
            <div class="cal-items">
              ${items.map(f => `
                <a href="#/fixtures" class="cal-item" title="${this.eventName(f.event)} ${this.timeOf(f.starts_at)}">
                  <span class="cal-dot status-${(f.status||'scheduled')}"></span>
                  <span class="cal-text">${this.eventShort(f)}</span>
                </a>
              `).join('')}
            </div>
          </div>
        `);
        cursor.setDate(cursor.getDate() + 1);
      }
      dayCells.push(`<div class="cal-row">${row.join('')}</div>`);
    }

    return `
      <div class="calendar-toolbar">
        <button class="btn btn-outline" onclick="window.fixturesPage.prevMonth()">Prev</button>
        <div class="calendar-title">${this.calendarCursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
        <button class="btn btn-outline" onclick="window.fixturesPage.nextMonth()">Next</button>
      </div>
      <div class="calendar-grid">
        <div class="cal-head">Mon</div>
        <div class="cal-head">Tue</div>
        <div class="cal-head">Wed</div>
        <div class="cal-head">Thu</div>
        <div class="cal-head">Fri</div>
        <div class="cal-head">Sat</div>
        <div class="cal-head">Sun</div>
        ${dayCells.join('')}
      </div>
    `;
  }

  prevMonth() {
    this.calendarCursor = new Date(this.calendarCursor.getFullYear(), this.calendarCursor.getMonth() - 1, 1);
    this.renderPage();
  }
  nextMonth() {
    this.calendarCursor = new Date(this.calendarCursor.getFullYear(), this.calendarCursor.getMonth() + 1, 1);
    this.renderPage();
  }

  eventName(eventId) {
    return this.events.find(e => e.id === eventId)?.name || 'Event';
  }
  eventShort(f) {
    const home = f.home_team?.name || f.home_team || '-';
    const away = f.away_team?.name || f.away_team || '-';
    return `${home} vs ${away} • ${this.timeOf(f.starts_at)}`;
  }
  timeOf(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Create
  openCreateModal() {
    const content = this.fixtureForm();
    this.createModal('New Fixture', content, [
      { label: 'Cancel', class: 'btn-outline', onclick: 'window.app.closeModal()' },
      { label: 'Create', class: 'btn-primary', onclick: 'window.fixturesPage.create()' }
    ]);
  }

  fixtureForm(fixture = null) {
    const eventOptions = this.events.map(e => `<option value="${e.id}" ${fixture?.event === e.id ? 'selected' : ''}>${e.name}</option>`).join('');
    return `
      <form id="fixture-form">
        <div class="form-group">
          <label class="form-label" for="fx-event">Event *</label>
          <select id="fx-event" name="event" class="form-input" required>
            <option value="">Select event</option>
            ${eventOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="fx-round">Round</label>
          <input id="fx-round" name="round_no" type="number" class="form-input" value="${fixture?.round_no ?? ''}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="fx-home">Home</label>
          <input id="fx-home" name="home_team" type="text" class="form-input" value="${fixture?.home_team?.name || fixture?.home_team || ''}" placeholder="Home team" />
        </div>
        <div class="form-group">
          <label class="form-label" for="fx-away">Away</label>
          <input id="fx-away" name="away_team" type="text" class="form-input" value="${fixture?.away_team?.name || fixture?.away_team || ''}" placeholder="Away team" />
        </div>
        <div class="form-group">
          <label class="form-label" for="fx-venue">Venue</label>
          <input id="fx-venue" name="venue" type="text" class="form-input" value="${fixture?.venue?.name || ''}" placeholder="Venue name" />
        </div>
        <div class="form-group">
          <label class="form-label" for="fx-start">Start (ISO)</label>
          <input id="fx-start" name="starts_at" type="datetime-local" class="form-input" value="${fixture?.starts_at ? this.toLocalInputValue(fixture.starts_at) : ''}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="fx-status">Status</label>
          <select id="fx-status" name="status" class="form-input">
            <option value="scheduled" ${fixture?.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
            <option value="completed" ${fixture?.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${fixture?.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
      </form>
    `;
  }

  toLocalInputValue(iso) {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async create() {
    const form = document.getElementById('fixture-form');
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    if (!payload.event) { this.app.notificationManager.error('Event is required'); return; }
    try {
      await this.app.api.createFixture(payload);
      this.app.notificationManager.success('Fixture created');
      this.app.closeModal();
      await this.refresh();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Failed to create fixture');
    }
  }

  // Edit
  async openEditModal(id) {
    try {
      const f = await this.app.api.getFixture(id);
      const content = this.fixtureForm(f);
      this.createModal('Edit Fixture', content, [
        { label: 'Cancel', class: 'btn-outline', onclick: 'window.app.closeModal()' },
        { label: 'Save', class: 'btn-primary', onclick: `window.fixturesPage.update(${id})` }
      ]);
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Failed to load fixture');
    }
  }

  async update(id) {
    const form = document.getElementById('fixture-form');
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    try {
      await this.app.api.updateFixture(id, payload);
      this.app.notificationManager.success('Fixture updated');
      this.app.closeModal();
      await this.refresh();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Failed to update fixture');
    }
  }

  // Delete
  confirmDelete(id) {
    this.showConfirmation('Delete this fixture? This cannot be undone.', `window.fixturesPage.doDelete(${id})`);
  }
  async doDelete(id) {
    try {
      await this.app.api.deleteFixture(id);
      this.app.notificationManager.success('Fixture deleted');
      await this.refresh();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Failed to delete fixture');
    }
  }

  // Generator
  openGenerateModal() {
    const content = `
      <div class="form-group">
        <label class="form-label" for="gen-event">Event *</label>
        <select id="gen-event" class="form-input" required>
          <option value="">Select event</option>
          ${this.events.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="gen-rounds">Rounds</label>
        <input id="gen-rounds" type="number" min="1" class="form-input" placeholder="e.g., 3" />
      </div>
    `;
    this.createModal('Generate Fixtures', content, [
      { label: 'Cancel', class: 'btn-outline', onclick: 'window.app.closeModal()' },
      { label: 'Generate', class: 'btn-primary', onclick: 'window.fixturesPage.generate()' }
    ]);
  }

  async generate() {
    const eventId = document.getElementById('gen-event').value;
    if (!eventId) { this.app.notificationManager.error('Please select an event'); return; }
    try {
      await this.app.api.generateFixtures(eventId);
      this.app.notificationManager.success('Fixtures generation requested');
      this.app.closeModal();
      await this.refresh();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Failed to generate fixtures');
    }
  }
}
