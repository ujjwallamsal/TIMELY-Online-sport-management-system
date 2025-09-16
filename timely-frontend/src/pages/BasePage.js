/**
 * Base Page Class - Common functionality for all pages
 */
export class BasePage {
  constructor(app) {
    this.app = app;
    this.isLoading = false;
    this.error = null;
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.isLoading = true;
    const content = document.getElementById('page-content');
    if (content) {
      content.innerHTML = `
        <div class="page-loading">
          <div class="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      `;
    }
  }

  /**
   * Show error state
   */
  showError(message, details = null) {
    this.error = message;
    const content = document.getElementById('page-content');
    if (content) {
      content.innerHTML = `
        <div class="page-error">
          <div class="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h2 class="error-title">Something went wrong</h2>
          <p class="error-message">${message}</p>
          ${details ? `<details class="error-details"><summary>Technical Details</summary><pre>${details}</pre></details>` : ''}
          <div class="error-actions">
            <button class="btn btn-primary" onclick="location.reload()">Retry</button>
            <button class="btn btn-outline" onclick="history.back()">Go Back</button>
          </div>
        </div>
      `;
    }
  }

  /**
   * Show empty state
   */
  showEmptyState(message, action = null) {
    const content = document.getElementById('page-content');
    if (content) {
      content.innerHTML = `
        <div class="page-empty">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 class="empty-title">No data available</h2>
          <p class="empty-message">${message}</p>
          ${action ? `<div class="empty-action">${action}</div>` : ''}
        </div>
      `;
    }
  }

  /**
   * Create a modal
   */
  createModal(title, content, actions = []) {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContainer = document.getElementById('modal-container');
    
    if (!modalOverlay || !modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close" onclick="window.app.closeModal()" aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        ${actions.length > 0 ? `
          <div class="modal-footer">
            ${actions.map(action => `
              <button class="btn ${action.class || 'btn-outline'}" onclick="${action.onclick}">
                ${action.label}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    modalOverlay.classList.remove('hidden');
    
    // Focus the modal
    const modal = modalContainer.querySelector('.modal');
    if (modal) {
      modal.focus();
    }
  }

  /**
   * Close modal
   */
  closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContainer = document.getElementById('modal-container');
    
    if (modalOverlay) {
      modalOverlay.classList.add('hidden');
    }
    
    if (modalContainer) {
      modalContainer.innerHTML = '';
    }
  }

  /**
   * Show confirmation dialog
   */
  showConfirmation(message, onConfirm, onCancel = null) {
    this.createModal(
      'Confirm Action',
      `<p>${message}</p>`,
      [
        {
          label: 'Cancel',
          class: 'btn-outline',
          onclick: `window.app.closeModal(); ${onCancel ? onCancel : ''}`
        },
        {
          label: 'Confirm',
          class: 'btn-danger',
          onclick: `window.app.closeModal(); ${onConfirm}`
        }
      ]
    );
  }

  /**
   * Format date for display
   */
  formatDate(dateString, options = {}) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
  }

  /**
   * Format date relative to now
   */
  formatRelativeDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Format currency
   */
  formatCurrency(amount, currency = 'USD') {
    if (typeof amount !== 'number') return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Format number with commas
   */
  formatNumber(number) {
    if (typeof number !== 'number') return 'N/A';
    
    return new Intl.NumberFormat('en-US').format(number);
  }

  /**
   * Get status badge HTML
   */
  getStatusBadge(status, type = 'default') {
    const statusClasses = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      active: 'status-active',
      inactive: 'status-inactive',
      upcoming: 'status-upcoming',
      ongoing: 'status-ongoing',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    };
    
    const className = statusClasses[status.toLowerCase()] || 'status-default';
    return `<span class="status-badge ${className}">${status}</span>`;
  }

  /**
   * Create a table row
   */
  createTableRow(data, columns) {
    return `
      <tr>
        ${columns.map(column => {
          const value = column.key ? this.getNestedValue(data, column.key) : '';
          const formattedValue = column.formatter ? column.formatter(value, data) : value;
          return `<td class="${column.class || ''}">${formattedValue}</td>`;
        }).join('')}
      </tr>
    `;
  }

  /**
   * Get nested object value
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  }

  /**
   * Create pagination controls
   */
  createPagination(pagination, onPageChange) {
    if (!pagination || pagination.totalPages <= 1) return '';

    const { page, totalPages, hasNext, hasPrevious } = pagination;
    
    return `
      <div class="pagination">
        <button 
          class="btn btn-outline btn-sm" 
          ${!hasPrevious ? 'disabled' : ''}
          onclick="${onPageChange}(${page - 1})"
        >
          Previous
        </button>
        
        <div class="pagination-info">
          Page ${page} of ${totalPages}
        </div>
        
        <button 
          class="btn btn-outline btn-sm" 
          ${!hasNext ? 'disabled' : ''}
          onclick="${onPageChange}(${page + 1})"
        >
          Next
        </button>
      </div>
    `;
  }

  /**
   * Create search input
   */
  createSearchInput(placeholder = 'Search...', onSearch) {
    return `
      <div class="search-input-wrapper">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input 
          type="text" 
          class="search-input" 
          placeholder="${placeholder}"
          onkeyup="if(event.key==='Enter') ${onSearch}(this.value)"
        >
      </div>
    `;
  }

  /**
   * Create filter dropdown
   */
  createFilterDropdown(name, options, onFilter) {
    return `
      <select class="filter-select" onchange="${onFilter}(this.value)">
        <option value="">All ${name}</option>
        ${options.map(option => `
          <option value="${option.value}">${option.label}</option>
        `).join('')}
      </select>
    `;
  }

  /**
   * Cleanup page resources
   */
  cleanup() {
    // Override in subclasses to clean up event listeners, timers, etc.
  }
}
