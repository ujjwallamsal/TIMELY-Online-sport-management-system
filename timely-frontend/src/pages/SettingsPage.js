/**
 * Settings Page - Application settings
 */
import { BasePage } from './BasePage.js';

export class SettingsPage extends BasePage {
  async render(route) {
    this.showEmptyState(
      'Settings configuration coming soon',
      '<button class="btn btn-primary">Save Settings</button>'
    );
  }
}
