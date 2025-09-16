/**
 * Login Page - User authentication
 */
import { BasePage } from './BasePage.js';

export class LoginPage extends BasePage {
  constructor(app) {
    super(app);
    this.isLoading = false;
  }

  /**
   * Render the login page
   */
  async render(route) {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="login-page">
        <div class="login-container">
          <div class="login-header">
            <div class="brand">
              <div class="brand-icon">T</div>
              <span class="brand-text">Timely</span>
            </div>
            <h1 class="login-title">Welcome back</h1>
            <p class="login-subtitle">Sign in to your account to continue</p>
          </div>

          <form id="login-form" class="login-form">
            <div class="form-group">
              <label for="email" class="form-label">Email address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                class="form-input" 
                placeholder="Enter your email"
                required
                autocomplete="email"
              >
            </div>

            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                class="form-input" 
                placeholder="Enter your password"
                required
                autocomplete="current-password"
              >
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" id="remember" name="remember">
                <span class="checkbox-text">Remember me</span>
              </label>
              <a href="#/forgot-password" class="forgot-password">Forgot password?</a>
            </div>

            <button type="submit" class="btn btn-primary btn-full" ${this.isLoading ? 'disabled' : ''}>
              ${this.isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div class="login-footer">
            <p>Don't have an account? <a href="#/register" class="signup-link">Sign up</a></p>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const form = document.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Handle Enter key in password field
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleLogin();
        }
      });
    }
  }

  /**
   * Handle login form submission
   */
  async handleLogin() {
    const form = document.getElementById('login-form');
    const formData = new FormData(form);
    
    const email = formData.get('email');
    const password = formData.get('password');
    const remember = formData.get('remember');

    if (!email || !password) {
      this.app.notificationManager.error('Please fill in all fields');
      return;
    }

    this.isLoading = true;
    this.updateSubmitButton();

    try {
      const response = await this.app.api.login(email, password);
      
      if (response.access) {
        this.app.notificationManager.success('Successfully signed in!');
        
        // Update user data
        this.app.currentUser = await this.app.api.getCurrentUser();
        this.app.updateUserInterface();
        this.app.updateNavigation();
        
        // Redirect to dashboard
        this.app.router.navigate('/dashboard');
      } else {
        throw new Error('Invalid response from server');
      }
      
    } catch (error) {
      console.error('Login failed:', error);
      
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.status === 403) {
        errorMessage = 'Account is disabled. Please contact support.';
      } else if (error.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      }
      
      this.app.notificationManager.error(errorMessage);
      
    } finally {
      this.isLoading = false;
      this.updateSubmitButton();
    }
  }

  /**
   * Update submit button state
   */
  updateSubmitButton() {
    const submitButton = document.querySelector('#login-form button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = this.isLoading;
      submitButton.textContent = this.isLoading ? 'Signing in...' : 'Sign in';
    }
  }
}
