/**
 * Theme Manager - Handles light/dark theme switching
 */
export class ThemeManager {
  constructor() {
    this.theme = this.getStoredTheme();
    this.init();
  }

  /**
   * Get stored theme from localStorage
   */
  getStoredTheme() {
    const stored = localStorage.getItem('theme');
    if (stored && ['light', 'dark'].includes(stored)) {
      return stored;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  }

  /**
   * Initialize theme
   */
  init() {
    this.applyTheme(this.theme);
    this.setupSystemThemeListener();
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update theme icon
    this.updateThemeIcon();
  }

  /**
   * Toggle between light and dark themes
   */
  toggle() {
    const newTheme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
    return newTheme;
  }

  /**
   * Set specific theme
   */
  setTheme(theme) {
    if (['light', 'dark'].includes(theme)) {
      this.applyTheme(theme);
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.theme;
  }

  /**
   * Update theme toggle icon
   */
  updateThemeIcon() {
    const themeIcon = document.getElementById('theme-icon');
    if (!themeIcon) return;

    if (this.theme === 'light') {
      // Show sun icon for light theme
      themeIcon.innerHTML = `
        <circle cx="12" cy="12" r="5"></circle>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
      `;
    } else {
      // Show moon icon for dark theme
      themeIcon.innerHTML = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      `;
    }
  }

  /**
   * Setup listener for system theme changes
   */
  setupSystemThemeListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a preference
        const storedTheme = localStorage.getItem('theme');
        if (!storedTheme) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  /**
   * Get theme-aware color value
   */
  getColor(colorName) {
    const root = document.documentElement;
    return getComputedStyle(root).getPropertyValue(`--${colorName}`).trim();
  }

  /**
   * Check if current theme is dark
   */
  isDark() {
    return this.theme === 'dark';
  }

  /**
   * Check if current theme is light
   */
  isLight() {
    return this.theme === 'light';
  }
}
