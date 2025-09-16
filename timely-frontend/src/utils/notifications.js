/**
 * Notification Manager - Handles toast notifications and system notifications
 */
export class NotificationManager {
  constructor() {
    this.container = null;
    this.notifications = new Map();
    this.init();
  }

  /**
   * Initialize notification system
   */
  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.createContainer();
    }
  }

  /**
   * Create notification container if it doesn't exist
   */
  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  }

  /**
   * Show a notification
   */
  show(message, type = 'info', duration = 5000, options = {}) {
    const id = this.generateId();
    const notification = this.createNotification(id, message, type, options);
    
    this.container.appendChild(notification);
    this.notifications.set(id, notification);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
    
    return id;
  }

  /**
   * Create notification element
   */
  createNotification(id, message, type, options = {}) {
    const notification = document.createElement('div');
    notification.className = `toast toast-${type}`;
    notification.setAttribute('data-id', id);
    
    const icon = this.getIcon(type);
    const title = options.title || this.getDefaultTitle(type);
    
    notification.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">${icon}</div>
        <div class="toast-body">
          ${title ? `<div class="toast-title">${title}</div>` : ''}
          <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="window.notificationManager.remove('${id}')" aria-label="Close notification">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
    
    // Add click handler for close button
    const closeBtn = notification.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.remove(id));
    
    // Add click handler for notification body (if clickable)
    if (options.onClick) {
      notification.style.cursor = 'pointer';
      notification.addEventListener('click', options.onClick);
    }
    
    return notification;
  }

  /**
   * Get icon for notification type
   */
  getIcon(type) {
    const icons = {
      success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22,4 12,14.01 9,11.01"></polyline>
      </svg>`,
      error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>`,
      warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>`,
      info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>`
    };
    
    return icons[type] || icons.info;
  }

  /**
   * Get default title for notification type
   */
  getDefaultTitle(type) {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    };
    
    return titles[type] || 'Notification';
  }

  /**
   * Remove notification
   */
  remove(id) {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.classList.add('toast-removing');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        this.notifications.delete(id);
      }, 300);
    }
  }

  /**
   * Clear all notifications
   */
  clear() {
    this.notifications.forEach((notification, id) => {
      this.remove(id);
    });
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Show success notification
   */
  success(message, options = {}) {
    return this.show(message, 'success', 5000, options);
  }

  /**
   * Show error notification
   */
  error(message, options = {}) {
    return this.show(message, 'error', 8000, options);
  }

  /**
   * Show warning notification
   */
  warning(message, options = {}) {
    return this.show(message, 'warning', 6000, options);
  }

  /**
   * Show info notification
   */
  info(message, options = {}) {
    return this.show(message, 'info', 5000, options);
  }

  /**
   * Show loading notification
   */
  loading(message, options = {}) {
    return this.show(message, 'info', 0, { ...options, loading: true });
  }

  /**
   * Update notification count in UI
   */
  updateNotificationCount(count) {
    const badge = document.getElementById('notification-count');
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count.toString();
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }
}

// Add toast styles
const toastStyles = `
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: var(--z-toast);
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 400px;
    pointer-events: none;
  }

  .toast {
    background-color: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: 16px;
    pointer-events: auto;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease-in-out;
    animation: slideIn 0.3s ease-out forwards;
  }

  .toast-removing {
    animation: slideOut 0.3s ease-in forwards;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .toast-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .toast-icon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    margin-top: 2px;
  }

  .toast-success .toast-icon {
    color: var(--success);
  }

  .toast-error .toast-icon {
    color: var(--danger);
  }

  .toast-warning .toast-icon {
    color: var(--warning);
  }

  .toast-info .toast-icon {
    color: var(--info);
  }

  .toast-body {
    flex: 1;
    min-width: 0;
  }

  .toast-title {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
    font-size: 0.875rem;
  }

  .toast-message {
    color: var(--text-secondary);
    font-size: 0.875rem;
    line-height: 1.4;
  }

  .toast-close {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius);
    transition: var(--transition);
    flex-shrink: 0;
  }

  .toast-close:hover {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .toast-success {
    border-left: 4px solid var(--success);
  }

  .toast-error {
    border-left: 4px solid var(--danger);
  }

  .toast-warning {
    border-left: 4px solid var(--warning);
  }

  .toast-info {
    border-left: 4px solid var(--info);
  }

  @media (max-width: 768px) {
    .toast-container {
      top: 10px;
      right: 10px;
      left: 10px;
      max-width: none;
    }
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = toastStyles;
document.head.appendChild(styleSheet);
