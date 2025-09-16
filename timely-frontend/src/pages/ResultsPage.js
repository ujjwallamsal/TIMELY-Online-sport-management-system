/**
 * Results Page - Manage event results and leaderboard
 */
import { BasePage } from './BasePage.js';

export class ResultsPage extends BasePage {
  constructor(app) {
    super(app);
    this.results = [];
    this.events = [];
    this.pagination = null;
    this.filters = { event: '', status: '', search: '' };
    this.viewMode = 'list';
    this.leaderboard = [];
  }

  async render(route) {
    this.showLoading();
    try {
      await this.loadInit();
      await this.refreshData();
      this.renderPage();
    } catch (e) {
      console.error('Results render failed:', e);
      this.showError('Failed to load results');
    }
  }

  async loadInit() {
    const eventsRes = await this.app.api.getEvents({ page_size: 200 });
    this.events = eventsRes.data || [];
  }

  async refreshData() {
    if (this.viewMode === 'leaderboard' && this.filters.event) {
      try { this.leaderboard = await this.app.api.getLeaderboard(this.filters.event); }
      catch { this.leaderboard = []; }
      return;
    }
    const res = await this.app.api.getResults({
      event: this.filters.event,
      status: this.filters.status,
      search: this.filters.search,
      page_size: 20
    });
    this.results = res.data || [];
    this.pagination = res.pagination;
  }

  renderPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="results-page">
        <div class="page-header">
          <div class="page-title-section">
            <h1 class="page-title">Results</h1>
            <p class="page-subtitle">Enter scores and view leaderboards</p>
          </div>
          <div class="page-actions">
            <div class="btn-group" role="group">
              <button class="btn ${this.viewMode==='list' ? 'btn-primary' : 'btn-outline'}" onclick="window.resultsPage.switchView('list')">List</button>
              <button class="btn ${this.viewMode==='leaderboard' ? 'btn-primary' : 'btn-outline'}" onclick="window.resultsPage.switchView('leaderboard')">Leaderboard</button>
            </div>
            <button class="btn btn-primary" onclick="window.resultsPage.openEntryModal()">Enter Result</button>
          </div>
        </div>

        <div class="page-filters">
          <div class="filters-row">
            ${this.createSearchInput('Search results...', 'window.resultsPage.handleSearch')}
            ${this.createFilterDropdown('Event', [{ value:'', label:'All Events' }, ...this.events.map(e => ({ value: e.id, label: e.name }))], 'window.resultsPage.handleEventFilter')}
            ${this.createFilterDropdown('Status', [
              { value:'', label:'All Status' },
              { value:'draft', label:'Draft' },
              { value:'final', label:'Final' }
            ], 'window.resultsPage.handleStatusFilter')}
          </div>
        </div>

        ${this.viewMode === 'leaderboard' ? this.renderLeaderboard() : this.renderResultsTable()}
      </div>
    `;
    window.resultsPage = this;
  }

  async switchView(mode) {
    this.viewMode = mode;
    await this.refreshData();
    this.renderPage();
  }

  handleSearch = async (q) => { this.filters.search = q; await this.refreshAndRender(); }
  handleEventFilter = async (v) => { this.filters.event = v; await this.refreshAndRender(); }
  handleStatusFilter = async (v) => { this.filters.status = v; await this.refreshAndRender(); }

  async refreshAndRender() {
    this.showLoading();
    await this.refreshData();
    this.renderPage();
  }

  renderResultsTable() {
    if (!this.results.length) {
      return `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
          </div>
          <h3 class="empty-title">No results</h3>
          <p class="empty-message">Enter scores to see results here</p>
          <button class="btn btn-primary" onclick="window.resultsPage.openEntryModal()">Enter Result</button>
        </div>`;
    }
    return `
      <div class="registrations-table-container">
        <table class="data-table">
          <thead>
            <tr><th>Event</th><th>Fixture</th><th>Score</th><th>Status</th><th>Updated</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${this.results.map(r => this.renderRow(r)).join('')}
          </tbody>
        </table>
        ${this.pagination ? this.createPagination(this.pagination, 'window.resultsPage.gotoPage') : ''}
      </div>`;
  }

  renderRow(r) {
    const evt = this.events.find(e => e.id === r.event || e.id === r.fixture?.event);
    const home = r.fixture?.home_team?.name || r.fixture?.home_team || '-';
    const away = r.fixture?.away_team?.name || r.fixture?.away_team || '-';
    const score = (r.score_home ?? '-') + ' - ' + (r.score_away ?? '-');
    const status = (r.status || r.state || 'final');
    return `
      <tr>
        <td>${evt?.name || 'Event'}</td>
        <td>${home} vs ${away}</td>
        <td>${score}</td>
        <td>${this.getStatusBadge(status)}</td>
        <td>${this.formatRelativeDate(r.updated_at || r.created_at)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline" onclick="window.resultsPage.openEntryModal(${r.id})">Edit</button>
          </div>
        </td>
      </tr>`;
  }

  gotoPage = async () => {}

  renderLeaderboard() {
    if (!this.filters.event) {
      return `<div class="empty-state"><h3 class="empty-title">Select an event to view leaderboard</h3></div>`;
    }
    if (!this.leaderboard.length) {
      return `<div class="empty-state"><h3 class="empty-title">No leaderboard data yet</h3><p class="empty-message">Finalize results to populate leaderboard</p></div>`;
    }
    return `
      <div class="registrations-table-container">
        <table class="data-table">
          <thead>
            <tr><th>Rank</th><th>Team/Athlete</th><th>Played</th><th>Won</th><th>Drawn</th><th>Lost</th><th>GF</th><th>GA</th><th>Points</th></tr>
          </thead>
          <tbody>
            ${this.leaderboard.map((row, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${row.name || row.team || row.participant || '-'}</td>
                <td>${row.played ?? '-'}</td>
                <td>${row.won ?? '-'}</td>
                <td>${row.drawn ?? '-'}</td>
                <td>${row.lost ?? '-'}</td>
                <td>${row.goals_for ?? row.gf ?? '-'}</td>
                <td>${row.goals_against ?? row.ga ?? '-'}</td>
                <td><strong>${row.points ?? '-'}</strong></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  async openEntryModal(resultId = null) {
    let result = null;
    try { if (resultId) result = this.results.find(r => r.id === resultId) || await this.app.api.getResult(resultId); } catch {}

    const eventOptions = this.events.map(e => `<option value="${e.id}" ${(this.filters.event && String(this.filters.event)===String(e.id)) || (result?.event===e.id) ? 'selected' : ''}>${e.name}</option>`).join('');

    const content = `
      <form id="result-form">
        <div class="form-group">
          <label class="form-label" for="res-event">Event *</label>
          <select id="res-event" name="event" class="form-input" required>
            <option value="">Select event</option>
            ${eventOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="res-fixture">Fixture ID (optional)</label>
          <input id="res-fixture" name="fixture" class="form-input" placeholder="Fixture ID" value="${result?.fixture?.id || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Score</label>
          <div style="display:flex; gap:8px; align-items:center">
            <input name="score_home" type="number" class="form-input" placeholder="Home" value="${result?.score_home ?? ''}" style="max-width:120px" />
            <span>vs</span>
            <input name="score_away" type="number" class="form-input" placeholder="Away" value="${result?.score_away ?? ''}" style="max-width:120px" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="res-status">Status</label>
          <select id="res-status" name="status" class="form-input">
            <option value="final" ${result?.status==='final' ? 'selected' : ''}>Final</option>
            <option value="draft" ${result?.status==='draft' ? 'selected' : ''}>Draft</option>
          </select>
        </div>
      </form>`;

    this.createModal(resultId ? 'Edit Result' : 'Enter Result', content, [
      { label: 'Cancel', class: 'btn-outline', onclick: 'window.app.closeModal()' },
      { label: resultId ? 'Save' : 'Create', class: 'btn-primary', onclick: resultId ? `window.resultsPage.save(${resultId})` : 'window.resultsPage.create()' }
    ]);
  }

  async create() {
    const form = document.getElementById('result-form');
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    if (!payload.event) { this.app.notificationManager.error('Event is required'); return; }
    if (payload.score_home) payload.score_home = Number(payload.score_home);
    if (payload.score_away) payload.score_away = Number(payload.score_away);
    try {
      await this.app.api.createResult(payload);
      this.app.notificationManager.success('Result created');
      this.app.closeModal();
      await this.refreshAndRender();
    } catch {
      this.app.notificationManager.error('Failed to create result');
    }
  }

  async save(id) {
    const form = document.getElementById('result-form');
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    if (payload.score_home) payload.score_home = Number(payload.score_home);
    if (payload.score_away) payload.score_away = Number(payload.score_away);
    try {
      await this.app.api.updateResult(id, payload);
      this.app.notificationManager.success('Result updated');
      this.app.closeModal();
      await this.refreshAndRender();
    } catch {
      this.app.notificationManager.error('Failed to update result');
    }
  }
}
