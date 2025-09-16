/**
 * Reports Page - Analytics and reporting
 */
import { BasePage } from './BasePage.js';

export class ReportsPage extends BasePage {
  constructor(app) {
    super(app);
    this.kpis = {};
    this.events = [];
    this.reports = [];
    this.filters = { event: '', date_from: '', date_to: '' };
  }

  async render(route) {
    this.showLoading();
    try {
      await this.loadKPIs();
      await this.loadEvents();
      await this.loadReports();
      this.renderPage();
    } catch (e) {
      console.error('Reports render failed:', e);
      this.showError('Failed to load reports');
    }
  }

  async loadKPIs() {
    try {
      const res = await this.app.api.get('/reports/kpis/');
      this.kpis = res;
    } catch (e) {
      console.warn('KPIs not available:', e);
      this.kpis = {
        total_events: 0,
        total_tickets: 0,
        total_revenue: 0,
        total_participants: 0
      };
    }
  }

  async loadEvents() {
    try {
      const res = await this.app.api.getEvents({ page_size: 200 });
      this.events = res.data || [];
    } catch (e) {
      console.warn('Events not available:', e);
      this.events = [];
    }
  }

  async loadReports() {
    const params = {};
    if (this.filters.event) params.event = this.filters.event;
    if (this.filters.date_from) params.date_from = this.filters.date_from;
    if (this.filters.date_to) params.date_to = this.filters.date_to;

    try {
      const res = await this.app.api.get('/reports/events/', params);
      this.reports = res.results || res.data || [];
    } catch (e) {
      console.warn('Reports not available:', e);
      this.reports = [];
    }
  }

  renderPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="reports-page">
        <div class="page-header">
          <div class="page-title-section">
            <h1 class="page-title">Reports & Analytics</h1>
            <p class="page-subtitle">View performance metrics and generate reports</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline" onclick="window.reportsPage.exportCSV()">Export CSV</button>
            <button class="btn btn-primary" onclick="window.reportsPage.refresh()">Refresh</button>
          </div>
        </div>

        <div class="page-filters">
          <div class="filters-row">
            ${this.createFilterDropdown('Event', [ { value:'', label:'All Events' }, ...this.events.map(e => ({ value:e.id, label:e.name })) ], 'window.reportsPage.handleEventFilter')}
            <div class="form-group">
              <label class="form-label">From Date</label>
              <input type="date" class="form-input" onchange="window.reportsPage.handleDateFrom(this.value)" />
            </div>
            <div class="form-group">
              <label class="form-label">To Date</label>
              <input type="date" class="form-input" onchange="window.reportsPage.handleDateTo(this.value)" />
            </div>
          </div>
        </div>

        ${this.renderKPIs()}
        ${this.renderReports()}
      </div>
    `;
    window.reportsPage = this;
  }

  renderKPIs() {
    return `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path></svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">${this.kpis.total_events || 0}</div>
            <div class="kpi-label">Total Events</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">${this.kpis.total_tickets || 0}</div>
            <div class="kpi-label">Tickets Sold</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">$${this.kpis.total_revenue || 0}</div>
            <div class="kpi-label">Total Revenue</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">${this.kpis.total_participants || 0}</div>
            <div class="kpi-label">Participants</div>
          </div>
        </div>
      </div>
    `;
  }

  renderReports() {
    if (!this.reports.length) {
      return `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>
          </div>
          <h3 class="empty-title">No reports available</h3>
          <p class="empty-message">Select filters to view event reports</p>
        </div>
      `;
    }

    return `
      <div class="reports-section">
        <h2 class="section-title">Event Reports</h2>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Tickets Sold</th>
                <th>Revenue</th>
                <th>Participants</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${this.reports.map(report => this.renderReportRow(report)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderReportRow(report) {
    const event = this.events.find(e => e.id === report.event_id) || {};
    const statusClass = report.status === 'completed' ? 'status-active' : 
                       report.status === 'cancelled' ? 'status-inactive' : 'status-pending';
    
    return `
      <tr>
        <td>${event.name || 'Unknown Event'}</td>
        <td>${event.start_date ? new Date(event.start_date).toLocaleDateString() : '-'}</td>
        <td>${report.tickets_sold || 0}</td>
        <td>$${report.revenue || 0}</td>
        <td>${report.participants || 0}</td>
        <td><span class="status-badge ${statusClass}">${report.status || 'Unknown'}</span></td>
      </tr>
    `;
  }

  // Filters
  handleEventFilter = async (v) => { this.filters.event = v; await this.refresh(); }
  handleDateFrom = async (v) => { this.filters.date_from = v; await this.refresh(); }
  handleDateTo = async (v) => { this.filters.date_to = v; await this.refresh(); }

  async refresh() {
    this.showLoading();
    await this.loadKPIs();
    await this.loadReports();
    this.renderPage();
  }

  exportCSV() {
    if (!this.reports.length) {
      this.app.notificationManager.error('No data to export');
      return;
    }

    const headers = ['Event', 'Date', 'Tickets Sold', 'Revenue', 'Participants', 'Status'];
    const rows = this.reports.map(report => {
      const event = this.events.find(e => e.id === report.event_id) || {};
      return [
        event.name || 'Unknown Event',
        event.start_date ? new Date(event.start_date).toLocaleDateString() : '-',
        report.tickets_sold || 0,
        report.revenue || 0,
        report.participants || 0,
        report.status || 'Unknown'
      ];
    });

    const csvContent = [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.app.notificationManager.success('CSV exported');
  }
}
