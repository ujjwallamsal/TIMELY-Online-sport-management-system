/**
 * 404 Not Found Page
 */
import { BasePage } from './BasePage.js';

export class NotFoundPage extends BasePage {
  constructor(app) {
    super(app);
  }

  /**
   * Render the 404 page
   */
  async render(route) {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="not-found-page">
        <div class="not-found-content">
          <div class="not-found-icon">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h1 class="not-found-title">404</h1>
          <h2 class="not-found-subtitle">Page Not Found</h2>
          <p class="not-found-message">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div class="not-found-actions">
            <button class="btn btn-primary" onclick="window.app.router.navigate('/dashboard')">
              Go to Dashboard
            </button>
            <button class="btn btn-outline" onclick="history.back()">
              Go Back
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
