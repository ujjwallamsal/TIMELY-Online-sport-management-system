/**
 * Main Application Class
 * Orchestrates the entire application lifecycle
 */
import { DashboardPage } from '../pages/DashboardPage.js';
import { EventsPage } from '../pages/EventsPage.js';
import { EventDetailPage } from '../pages/EventDetailPage.js';
import { RegistrationsPage } from '../pages/RegistrationsPage.js';
import { FixturesPage } from '../pages/FixturesPage.js';
import { ResultsPage } from '../pages/ResultsPage.js';
import { TicketsPage } from '../pages/TicketsPage.js';
import { VenuesPage } from '../pages/VenuesPage.js';
import { MediaPage } from '../pages/MediaPage.js';
import { UsersPage } from '../pages/UsersPage.js';
import { ReportsPage } from '../pages/ReportsPage.js';
import { SettingsPage } from '../pages/SettingsPage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { NotFoundPage } from '../pages/NotFoundPage.js';
import { ErrorPage } from '../pages/ErrorPage.js';

export class App {
  constructor({ api, themeManager, router, notificationManager }) {
    this.api = api;
    this.themeManager = themeManager;
    this.router = router;
    this.notificationManager = notificationManager;
    
    this.currentUser = null;
    this.pages = new Map();
    this.currentPage = null;
    
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize pages
      this.initializePages();
      
      // Setup routing
      this.setupRouting();
      
      // Check authentication
      await this.checkAuthentication();
      
      // Setup real-time updates
      this.setupRealTimeUpdates();
      
    } catch (error) {
      console.error('App initialization failed:', error);
      this.notificationManager.error('Failed to initialize application');
    }
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.themeManager.toggle();
      });
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileMenuToggle && sidebar) {
      mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // Global search
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
      globalSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleGlobalSearch(e.target.value);
        }
      });
    }

    // Notifications toggle
    const notificationsToggle = document.getElementById('notifications-toggle');
    if (notificationsToggle) {
      notificationsToggle.addEventListener('click', () => {
        this.showNotifications();
      });
    }

    // User menu toggle
    const userMenuToggle = document.getElementById('user-menu-toggle');
    if (userMenuToggle) {
      userMenuToggle.addEventListener('click', () => {
        this.showUserMenu();
      });
    }

    // Click outside to close modals
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.closeModal();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  /**
   * Initialize all pages
   */
  initializePages() {
    this.pages.set('dashboard', new DashboardPage(this));
    this.pages.set('events', new EventsPage(this));
    this.pages.set('event-detail', new EventDetailPage(this));
    this.pages.set('registrations', new RegistrationsPage(this));
    this.pages.set('fixtures', new FixturesPage(this));
    this.pages.set('results', new ResultsPage(this));
    this.pages.set('tickets', new TicketsPage(this));
    this.pages.set('venues', new VenuesPage(this));
    this.pages.set('media', new MediaPage(this));
    this.pages.set('users', new UsersPage(this));
    this.pages.set('reports', new ReportsPage(this));
    this.pages.set('settings', new SettingsPage(this));
    this.pages.set('login', new LoginPage(this));
    this.pages.set('404', new NotFoundPage(this));
    this.pages.set('error', new ErrorPage(this));
  }

  /**
   * Setup routing
   */
  setupRouting() {
    // Define routes
    this.router.route('/', () => this.navigateToPage('dashboard'));
    this.router.route('/dashboard', () => this.navigateToPage('dashboard'));
    this.router.route('/events', () => this.navigateToPage('events'));
    this.router.route('/events/:id', (route) => this.navigateToPage('event-detail', route));
    this.router.route('/events/:id/:tab', (route) => this.navigateToPage('event-detail', route));
    this.router.route('/registrations', () => this.navigateToPage('registrations'));
    this.router.route('/fixtures', () => this.navigateToPage('fixtures'));
    this.router.route('/results', () => this.navigateToPage('results'));
    this.router.route('/tickets', () => this.navigateToPage('tickets'));
    this.router.route('/venues', () => this.navigateToPage('venues'));
    this.router.route('/media', () => this.navigateToPage('media'));
    this.router.route('/users', () => this.navigateToPage('users'));
    this.router.route('/reports', () => this.navigateToPage('reports'));
    this.router.route('/settings', () => this.navigateToPage('settings'));
    this.router.route('/login', () => this.navigateToPage('login'));
    this.router.route('/404', () => this.navigateToPage('404'));
    this.router.route('/error', () => this.navigateToPage('error'));
  }

  /**
   * Check user authentication
   */
  async checkAuthentication() {
    try {
      if (this.api.token) {
        this.currentUser = await this.api.getCurrentUser();
        this.updateUserInterface();
        this.updateNavigation();
      } else {
        this.redirectToLogin();
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      this.redirectToLogin();
    }
  }

  /**
   * Navigate to a page
   */
  async navigateToPage(pageName, route = null) {
    try {
      // Check if user needs to be authenticated
      if (pageName !== 'login' && !this.currentUser) {
        this.redirectToLogin();
        return;
      }

      // Clean up current page
      if (this.currentPage && this.currentPage.cleanup) {
        this.currentPage.cleanup();
      }

      // Get page instance
      const page = this.pages.get(pageName);
      if (!page) {
        this.navigateToPage('404');
        return;
      }

      // Render page
      this.currentPage = page;
      await page.render(route);

      // Update navigation state
      this.updateNavigationState(pageName, route);

    } catch (error) {
      console.error('Page navigation failed:', error);
      this.notificationManager.error('Failed to load page');
      this.navigateToPage('error');
    }
  }

  /**
   * Update navigation state
   */
  updateNavigationState(pageName, route) {
    // Update active nav item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
    });

    // Set active nav item based on current page
    const activeItem = document.querySelector(`[data-page="${pageName}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }

    // Update page title
    this.updatePageTitle(pageName, route);
  }

  /**
   * Update page title
   */
  updatePageTitle(pageName, route) {
    const titles = {
      dashboard: 'Dashboard',
      events: 'Events',
      'event-detail': route?.params?.id ? `Event ${route.params.id}` : 'Event Details',
      registrations: 'Registrations',
      fixtures: 'Fixtures',
      results: 'Results',
      tickets: 'Tickets',
      venues: 'Venues',
      media: 'Media',
      users: 'Users',
      reports: 'Reports',
      settings: 'Settings',
      login: 'Login'
    };

    const title = titles[pageName] || 'Timely';
    document.title = `${title} - Timely`;
  }

  /**
   * Update user interface with current user data
   */
  updateUserInterface() {
    if (!this.currentUser) return;

    // Update user name and role
    const userName = document.getElementById('user-name');
    const userRole = document.getElementById('user-role');
    const userInitials = document.getElementById('user-initials');
    const userInitialsSmall = document.getElementById('user-initials-small');

    if (userName) {
      userName.textContent = this.currentUser.display_name || this.currentUser.email;
    }

    if (userRole) {
      userRole.textContent = this.currentUser.primary_role_display || this.currentUser.role || 'User';
    }

    if (userInitials) {
      userInitials.textContent = this.getInitials(this.currentUser);
    }

    if (userInitialsSmall) {
      userInitialsSmall.textContent = this.getInitials(this.currentUser);
    }
  }

  /**
   * Get user initials
   */
  getInitials(user) {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  }

  /**
   * Update navigation based on user role
   */
  updateNavigation() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav || !this.currentUser) return;

    const role = this.currentUser.role || 'SPECTATOR';
    const navigationItems = this.getNavigationItems(role);

    nav.innerHTML = navigationItems.map(item => `
      <a href="#${item.path}" class="nav-item" data-page="${item.page}">
        <svg class="nav-item-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${item.icon}
        </svg>
        <span class="nav-item-text">${item.label}</span>
      </a>
    `).join('');

    // Add click handlers
    nav.addEventListener('click', (e) => {
      const navItem = e.target.closest('.nav-item');
      if (navItem) {
        e.preventDefault();
        const page = navItem.dataset.page;
        this.router.navigate(navItem.getAttribute('href'));
      }
    });
  }

  /**
   * Get navigation items based on user role
   */
  getNavigationItems(role) {
    const baseItems = [
      { path: '/dashboard', page: 'dashboard', label: 'Dashboard', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9,22 9,12 15,12 15,22"></polyline>' },
      { path: '/events', page: 'events', label: 'Events', icon: '<path d="M7 3v4"></path><path d="M17 3v4"></path><path d="M3 8h18"></path><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"></path>' }
    ];

    const roleBasedItems = {
      ADMIN: [
        { path: '/users', page: 'users', label: 'Users', icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' },
        { path: '/reports', page: 'reports', label: 'Reports', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline>' }
      ],
      ORGANIZER: [
        { path: '/registrations', page: 'registrations', label: 'Registrations', icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' },
        { path: '/fixtures', page: 'fixtures', label: 'Fixtures', icon: '<path d="M9 11H5a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h4m0-7v7m0-7h10a2 2 0 0 1 2 2v3c0 1.1-.9 2-2 2h-10m0-7v7"></path>' },
        { path: '/results', page: 'results', label: 'Results', icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>' },
        { path: '/tickets', page: 'tickets', label: 'Tickets', icon: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>' },
        { path: '/venues', page: 'venues', label: 'Venues', icon: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>' },
        { path: '/media', page: 'media', label: 'Media', icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21,15 16,10 5,21"></polyline>' },
        { path: '/reports', page: 'reports', label: 'Reports', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline>' }
      ],
      COACH: [
        { path: '/registrations', page: 'registrations', label: 'My Teams', icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' },
        { path: '/fixtures', page: 'fixtures', label: 'Schedule', icon: '<path d="M9 11H5a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h4m0-7v7m0-7h10a2 2 0 0 1 2 2v3c0 1.1-.9 2-2 2h-10m0-7v7"></path>' },
        { path: '/results', page: 'results', label: 'Results', icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>' }
      ],
      ATHLETE: [
        { path: '/registrations', page: 'registrations', label: 'My Registrations', icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' },
        { path: '/fixtures', page: 'fixtures', label: 'My Schedule', icon: '<path d="M9 11H5a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h4m0-7v7m0-7h10a2 2 0 0 1 2 2v3c0 1.1-.9 2-2 2h-10m0-7v7"></path>' },
        { path: '/results', page: 'results', label: 'My Results', icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>' }
      ],
      SPECTATOR: [
        { path: '/fixtures', page: 'fixtures', label: 'Schedule', icon: '<path d="M9 11H5a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h4m0-7v7m0-7h10a2 2 0 0 1 2 2v3c0 1.1-.9 2-2 2h-10m0-7v7"></path>' },
        { path: '/results', page: 'results', label: 'Results', icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>' },
        { path: '/tickets', page: 'tickets', label: 'Tickets', icon: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>' }
      ]
    };

    const commonItems = [
      { path: '/settings', page: 'settings', label: 'Settings', icon: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>' }
    ];

    return [...baseItems, ...(roleBasedItems[role] || []), ...commonItems];
  }

  /**
   * Handle global search
   */
  handleGlobalSearch(query) {
    if (!query.trim()) return;
    
    // For now, just navigate to events with search query
    this.router.navigateWithParams('/events', { search: query });
  }

  /**
   * Show notifications
   */
  showNotifications() {
    // TODO: Implement notifications modal
    this.notificationManager.info('Notifications feature coming soon');
  }

  /**
   * Show user menu
   */
  showUserMenu() {
    // TODO: Implement user menu dropdown
    this.notificationManager.info('User menu feature coming soon');
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('global-search');
      if (searchInput) {
        searchInput.focus();
      }
    }

    // Escape to close modals
    if (e.key === 'Escape') {
      this.closeModal();
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
   * Setup real-time updates
   */
  setupRealTimeUpdates() {
    // TODO: Implement WebSocket/SSE connections
    console.log('Real-time updates setup - TODO');
  }

  /**
   * Redirect to login
   */
  redirectToLogin() {
    this.router.navigate('/login');
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      await this.api.logout();
      this.currentUser = null;
      this.redirectToLogin();
    } catch (error) {
      console.error('Logout failed:', error);
      this.notificationManager.error('Logout failed');
    }
  }
}
