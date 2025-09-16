/**
 * Environment Configuration
 * This file handles environment variables and configuration
 */

// Default configuration
const defaultConfig = {
  API_BASE_URL: 'http://127.0.0.1:8000/api',
  WS_URL: 'ws://127.0.0.1:8000/ws/',
  APP_NAME: 'Timely',
  VERSION: '1.0.0',
  DEBUG: false
};

// Get configuration from environment or use defaults
export const config = {
  ...defaultConfig,
  // Override with environment variables if available
  ...(window.ENV || {})
};

// Make config globally available
window.ENV = config;
