/**
 * Error Page - General error handling
 */
import { BasePage } from './BasePage.js';

export class ErrorPage extends BasePage {
  constructor(app) {
    super(app);
  }

  /**
   * Render the error page
   */
  async render(route) {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="error-page">
        <div class="error-content">
          <div class="error-icon">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h1 class="error-title">Something went wrong</h1>
          <p class="error-message">
            We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.
          </p>
          <div class="error-actions">
            <button class="btn btn-primary" onclick="location.reload()">
              Try Again
            </button>
            <button class="btn btn-outline" onclick="window.app.router.navigate('/dashboard')">
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
