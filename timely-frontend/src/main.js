// Main application entry point
import { App } from './app/App.js';
import { API } from './services/api.js';
import { ThemeManager } from './utils/theme.js';
import { Router } from './utils/router.js';
import { NotificationManager } from './utils/notifications.js';
import { config } from './config/env.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize core services
    const themeManager = new ThemeManager();
    const api = new API();
    const router = new Router();
    const notificationManager = new NotificationManager();
    
    // Initialize the main app
    const app = new App({
      api,
      themeManager,
      router,
      notificationManager
    });
    
    // Make app globally accessible for debugging and onclick handlers
    window.app = app;
    
    await app.init();
    
    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    const mainApp = document.getElementById('main-app');
    
    if (loadingScreen && mainApp) {
      loadingScreen.classList.add('hidden');
      mainApp.classList.remove('hidden');
    }
    
  } catch (error) {
    console.error('Failed to initialize application:', error);
    
    // Show error state
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="error-state">
          <h2>Failed to load application</h2>
          <p>Please refresh the page or contact support if the problem persists.</p>
          <button onclick="location.reload()" class="btn btn-primary">Retry</button>
        </div>
      `;
    }
  }
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
