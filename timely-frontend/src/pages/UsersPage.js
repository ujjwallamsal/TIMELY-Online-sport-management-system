/**
 * Users Page - User and role management
 */
import { BasePage } from './BasePage.js';

export class UsersPage extends BasePage {
  constructor(app) {
    super(app);
    this.users = [];
    this.roles = [];
    this.filters = { search: '', role: '', status: '' };
    this.pagination = null;
  }

  async render(route) {
    this.showLoading();
    try {
      await this.loadRoles();
      await this.loadUsers();
      this.renderPage();
    } catch (e) {
      console.error('Users render failed:', e);
      this.showError('Failed to load users');
    }
  }

  async loadRoles() {
    try {
      const res = await this.app.api.get('/accounts/roles/');
      this.roles = res.results || res.data || [];
    } catch (e) {
      console.warn('Roles not available:', e);
      this.roles = [];
    }
  }

  async loadUsers() {
    const params = { page_size: 50 };
    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.role) params.role = this.filters.role;
    if (this.filters.status) params.status = this.filters.status;
    
    const res = await this.app.api.get('/accounts/users/', params);
    this.users = res.results || res.data || [];
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
      <div class="users-page">
        <div class="page-header">
          <div class="page-title-section">
            <h1 class="page-title">Users & Roles</h1>
            <p class="page-subtitle">Manage user accounts and permissions</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline" onclick="window.usersPage.openInviteModal()">Invite User</button>
            <button class="btn btn-primary" onclick="window.usersPage.openCreateModal()">Add User</button>
          </div>
        </div>

        <div class="page-filters">
          <div class="filters-row">
            ${this.createSearchInput('Search users...', 'window.usersPage.handleSearch')}
            ${this.createFilterDropdown('Role', [ { value:'', label:'All Roles' }, ...this.roles.map(r => ({ value:r.role_type, label:r.role_type })) ], 'window.usersPage.handleRoleFilter')}
            ${this.createFilterDropdown('Status', [ { value:'', label:'All Status' }, { value:'active', label:'Active' }, { value:'inactive', label:'Inactive' } ], 'window.usersPage.handleStatusFilter')}
          </div>
        </div>

        ${this.renderTable()}
      </div>
    `;
    window.usersPage = this;
  }

  renderTable() {
    if (!this.users.length) {
      return `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <h3 class="empty-title">No users found</h3>
          <p class="empty-message">Invite or add users to get started</p>
        </div>
      `;
    }

    return `
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.users.map(user => this.renderUserRow(user)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderUserRow(user) {
    const roles = user.roles || [];
    const statusClass = user.is_active ? 'status-active' : 'status-inactive';
    const statusText = user.is_active ? 'Active' : 'Inactive';
    const lastActive = user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never';

    return `
      <tr>
        <td>
          <div class="user-info">
            <div class="user-avatar">${(user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase()}</div>
            <div class="user-details">
              <div class="user-name">${`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}</div>
            </div>
          </div>
        </td>
        <td>${user.email}</td>
        <td>
          <div class="role-tags">
            ${roles.map(role => `<span class="role-tag">${role.role_type || role}</span>`).join('')}
          </div>
        </td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${lastActive}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline" onclick="window.usersPage.openEditModal(${user.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="window.usersPage.confirmDelete(${user.id})">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  // Filters
  handleSearch = async (q) => { this.filters.search = q; await this.refresh(); }
  handleRoleFilter = async (v) => { this.filters.role = v; await this.refresh(); }
  handleStatusFilter = async (v) => { this.filters.status = v; await this.refresh(); }

  async refresh() {
    this.showLoading();
    await this.loadUsers();
    this.renderPage();
  }

  // Create User
  openCreateModal() {
    const content = `
      <form id="user-create-form">
        <div class="form-group">
          <label class="form-label" for="uc-email">Email *</label>
          <input id="uc-email" name="email" type="email" class="form-input" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="uc-username">Username *</label>
          <input id="uc-username" name="username" class="form-input" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="uc-first">First Name</label>
            <input id="uc-first" name="first_name" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label" for="uc-last">Last Name</label>
            <input id="uc-last" name="last_name" class="form-input" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="uc-roles">Roles</label>
          <select id="uc-roles" name="roles" class="form-input" multiple>
            ${this.roles.map(r => `<option value="${r.role_type}">${r.role_type}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="uc-password">Password *</label>
          <input id="uc-password" name="password" type="password" class="form-input" required />
        </div>
      </form>
    `;
    this.createModal('Create User', content, [
      { label: 'Cancel', class: 'btn-outline', onclick: 'window.app.closeModal()' },
      { label: 'Create', class: 'btn-primary', onclick: 'window.usersPage.createUser()' }
    ]);
  }

  async createUser() {
    const form = document.getElementById('user-create-form');
    const data = new FormData(form);
    const userData = {
      email: data.get('email'),
      username: data.get('username'),
      first_name: data.get('first_name') || '',
      last_name: data.get('last_name') || '',
      password: data.get('password'),
      roles: Array.from(form.querySelectorAll('#uc-roles option:checked')).map(o => o.value)
    };

    try {
      await this.app.api.post('/accounts/users/', userData);
      this.app.notificationManager.success('User created');
      this.app.closeModal();
      await this.refresh();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Failed to create user');
    }
  }

  // Invite User
  openInviteModal() {
    const content = `
      <form id="user-invite-form">
        <div class="form-group">
          <label class="form-label" for="ui-email">Email *</label>
          <input id="ui-email" name="email" type="email" class="form-input" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="ui-roles">Roles</label>
          <select id="ui-roles" name="roles" class="form-input" multiple>
            ${this.roles.map(r => `<option value="${r.role_type}">${r.role_type}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="ui-message">Message</label>
          <textarea id="ui-message" name="message" class="form-input" rows="3" placeholder="Optional invitation message"></textarea>
        </div>
      </form>
    `;
    this.createModal('Invite User', content, [
      { label: 'Cancel', class: 'btn-outline', onclick: 'window.app.closeModal()' },
      { label: 'Send Invite', class: 'btn-primary', onclick: 'window.usersPage.inviteUser()' }
    ]);
  }

  async inviteUser() {
    const form = document.getElementById('user-invite-form');
    const data = new FormData(form);
    const inviteData = {
      email: data.get('email'),
      roles: Array.from(form.querySelectorAll('#ui-roles option:checked')).map(o => o.value),
      message: data.get('message') || ''
    };

    try {
      await this.app.api.post('/accounts/invite/', inviteData);
      this.app.notificationManager.success('Invitation sent');
      this.app.closeModal();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Failed to send invitation');
    }
  }

  // Edit User
  async openEditModal(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    const content = `
      <form id="user-edit-form">
        <div class="form-group">
          <label class="form-label" for="ue-email">Email *</label>
          <input id="ue-email" name="email" type="email" class="form-input" value="${user.email}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="ue-username">Username *</label>
          <input id="ue-username" name="username" class="form-input" value="${user.username}" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="ue-first">First Name</label>
            <input id="ue-first" name="first_name" class="form-input" value="${user.first_name || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="ue-last">Last Name</label>
            <input id="ue-last" name="last_name" class="form-input" value="${user.last_name || ''}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="ue-roles">Roles</label>
          <select id="ue-roles" name="roles" class="form-input" multiple>
            ${this.roles.map(r => `<option value="${r.role_type}" ${(user.roles || []).some(ur => ur.role_type === r.role_type) ? 'selected' : ''}>${r.role_type}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" name="is_active" ${user.is_active ? 'checked' : ''} />
            Active user
          </label>
        </div>
      </form>
    `;
    this.createModal('Edit User', content, [
      { label: 'Cancel', class: 'btn-outline', onclick: 'window.app.closeModal()' },
      { label: 'Save', class: 'btn-primary', onclick: `window.usersPage.updateUser(${userId})` }
    ]);
  }

  async updateUser(userId) {
    const form = document.getElementById('user-edit-form');
    const data = new FormData(form);
    const userData = {
      email: data.get('email'),
      username: data.get('username'),
      first_name: data.get('first_name') || '',
      last_name: data.get('last_name') || '',
      roles: Array.from(form.querySelectorAll('#ue-roles option:checked')).map(o => o.value),
      is_active: form.querySelector('input[name="is_active"]').checked
    };

    try {
      await this.app.api.put(`/accounts/users/${userId}/`, userData);
      this.app.notificationManager.success('User updated');
      this.app.closeModal();
      await this.refresh();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Failed to update user');
    }
  }

  confirmDelete(userId) {
    this.showConfirmation('Delete this user?', `window.usersPage.deleteUser(${userId})`);
  }

  async deleteUser(userId) {
    try {
      await this.app.api.delete(`/accounts/users/${userId}/`);
      this.app.notificationManager.success('User deleted');
      await this.refresh();
    } catch (e) {
      console.error(e);
      this.app.notificationManager.error('Failed to delete user');
    }
  }
}
