/**
 * Tickets Page - Manage event ticket types and sales breakdown
 */
import { BasePage } from './BasePage.js';

export class TicketsPage extends BasePage {
  constructor(app) {
    super(app);
    this.tickets = [];
    this.events = [];
    this.pagination = null;
    this.filters = { event: '', search: '' };
  }

  async render(route) {
    this.showLoading();
    try {
      const [evts] = await Promise.all([
        this.app.api.getEvents({ page_size: 200 })
      ]);
      this.events = evts.data || [];
      await this.loadTickets();
      this.renderPage();
    } catch (e) {
      console.error('Tickets render failed:', e);
      this.showError('Failed to load tickets');
    }
  }

  async loadTickets() {
    const res = await this.app.api.getTickets({
      event: this.filters.event,
      search: this.filters.search,
      page_size: 20
    });
    this.tickets = res.data || [];
    this.pagination = res.pagination;
  }

  renderPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="tickets-page">
        <div class="page-header">
          <div class="page-title-section">
            <h1 class="page-title">Tickets</h1>
            <p class="page-subtitle">Per-event pricing, inventory, and sales breakdown</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline" onclick="window.ticketsPage.exportCSV()">Export CSV</button>
            <button class="btn btn-primary" onclick="window.ticketsPage.openCreateModal()">New Ticket Type</button>
          </div>
        </div>

        <div class="page-filters">
          <div class="filters-row">
            ${this.createSearchInput('Search ticket types...', 'window.ticketsPage.handleSearch')}
            ${this.createFilterDropdown('Event', [ { value:'', label:'All Events' }, ...this.events.map(e=>({ value:e.id, label:e.name })) ], 'window.ticketsPage.handleEventFilter')}
          </div>
        </div>

        ${this.renderTable()}
      </div>
    `;
    window.ticketsPage = this;
  }

  renderTable() {
    if (!this.tickets.length) {
      return `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
          <h3 class="empty-title">No ticket types</h3>
          <p class="empty-message">Create a ticket type to start selling</p>
          <button class="btn btn-primary" onclick="window.ticketsPage.openCreateModal()">New Ticket Type</button>
        </div>
      `;
    }

    return `
      <div class="registrations-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Name</th>
              <th>Price</th>
              <th>Inventory</th>
              <th>Sold</th>
              <th>Sales</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.tickets.map(t => this.renderRow(t)).join('')}
          </tbody>
        </table>
        ${this.pagination ? this.createPagination(this.pagination, 'window.ticketsPage.gotoPage') : ''}
      </div>
    `;
  }

  renderRow(t) {
    const evt = this.events.find(e => e.id === t.event);
    const price = typeof t.price_cents === 'number' ? this.formatCurrency(t.price_cents / 100.0) : (t.price ? this.formatCurrency(t.price) : '—');
    const inventory = t.inventory ?? t.capacity ?? 0;
    const sold = t.sold ?? t.sales_count ?? 0;
    const pct = inventory > 0 ? Math.min(100, Math.round((sold / inventory) * 100)) : 0;
    const salesAmount = typeof t.price_cents === 'number' ? (t.price_cents / 100.0) * sold : (t.price || 0) * sold;
    return `
      <tr>
        <td>${evt?.name || 'Event'}</td>
        <td>${t.name || t.title || 'Ticket'}</td>
        <td>${price}</td>
        <td>${inventory}</td>
        <td>${sold}</td>
        <td>
          <div class="sales-bar"><div class="sales-bar-fill" style="width:${pct}%"></div></div>
          <div class="sales-meta">${pct}% • ${this.formatCurrency(salesAmount)}</div>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline" onclick='window.ticketsPage.openEditModal(${t.id})'>Edit</button>
            <button class="btn btn-sm btn-danger" onclick='window.ticketsPage.confirmDelete(${t.id})'>Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  // Filters
  handleSearch = async (q) => { this.filters.search = q; await this.refresh(); }
  handleEventFilter = async (v) => { this.filters.event = v; await this.refresh(); }
  gotoPage = async () => {}

  async refresh() {
    this.showLoading();
    await this.loadTickets();
    this.renderPage();
  }

  // Create/Edit
  openCreateModal() {
    const content = this.ticketForm();
    this.createModal('New Ticket Type', content, [
      { label: 'Cancel', class: 'btn-outline', onclick: 'window.app.closeModal()' },
      { label: 'Create', class: 'btn-primary', onclick: 'window.ticketsPage.create()' }
    ]);
  }

  async openEditModal(id) {
    const t = this.tickets.find(x => x.id === id) || null;
    const content = this.ticketForm(t);
    this.createModal('Edit Ticket Type', content, [
      { label: 'Cancel', class: 'btn-outline', onclick: 'window.app.closeModal()' },
      { label: 'Save', class: 'btn-primary', onclick: `window.ticketsPage.save(${id})` }
    ]);
  }

  ticketForm(ticket = null) {
    const eventOptions = this.events.map(e => `<option value="${e.id}" ${ticket?.event === e.id ? 'selected' : ''}>${e.name}</option>`).join('');
    return `
      <form id="ticket-form">
        <div class="form-group">
          <label class="form-label" for="tk-event">Event *</label>
          <select id="tk-event" name="event" class="form-input" required>
            <option value="">Select event</option>
            ${eventOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="tk-name">Name *</label>
          <input id="tk-name" name="name" class="form-input" placeholder="e.g., General Admission" value="${ticket?.name || ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="tk-price">Price (in cents) *</label>
          <input id="tk-price" name="price_cents" type="number" class="form-input" value="${ticket?.price_cents ?? ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="tk-inv">Inventory</label>
          <input id="tk-inv" name="inventory" type="number" class="form-input" value="${ticket?.inventory ?? ''}" />
        </div>
      </form>
    `;
  }

  async create() {
    const form = document.getElementById('ticket-form');
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    if (!payload.event || !payload.name || !payload.price_cents) {
      this.app.notificationManager.error('Please fill all required fields');
      return;
    }
    payload.price_cents = Number(payload.price_cents);
    if (payload.inventory) payload.inventory = Number(payload.inventory);
    try {
      await this.app.api.createTicket(payload);
      this.app.notificationManager.success('Ticket type created');
      this.app.closeModal();
      await this.refresh();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Failed to create ticket type');
    }
  }

  async save(id) {
    const form = document.getElementById('ticket-form');
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    if (payload.price_cents) payload.price_cents = Number(payload.price_cents);
    if (payload.inventory) payload.inventory = Number(payload.inventory);
    try {
      await this.app.api.updateTicket(id, payload);
      this.app.notificationManager.success('Ticket type updated');
      this.app.closeModal();
      await this.refresh();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Failed to update ticket type');
    }
  }

  confirmDelete(id) {
    this.showConfirmation('Delete this ticket type?', `window.ticketsPage.doDelete(${id})`);
  }

  async doDelete(id) {
    try {
      await this.app.api.deleteTicket(id);
      this.app.notificationManager.success('Deleted');
      await this.refresh();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Failed to delete');
    }
  }

  // CSV export (client-side)
  exportCSV() {
    const rows = [ ['Event','Name','Price','Inventory','Sold','SalesAmount'] ];
    this.tickets.forEach(t => {
      const evt = this.events.find(e => e.id === t.event);
      const inventory = t.inventory ?? t.capacity ?? 0;
      const sold = t.sold ?? t.sales_count ?? 0;
      const price = typeof t.price_cents === 'number' ? t.price_cents/100.0 : (t.price || 0);
      const salesAmount = price * sold;
      rows.push([
        (evt?.name || ''), (t.name || t.title || ''), price, inventory, sold, salesAmount
      ]);
    });
    const csv = rows.map(r => r.map(x => (typeof x === 'string' && x.includes(',')) ? `"${x}"` : x).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'tickets.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
