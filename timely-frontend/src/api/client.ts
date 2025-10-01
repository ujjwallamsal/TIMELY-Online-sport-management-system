import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { ENDPOINTS, normalizeApiUrl } from './ENDPOINTS';

// Token management
const TOKEN_KEY = 'timely_access_token';
const REFRESH_TOKEN_KEY = 'timely_refresh_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setStoredTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearStoredTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Create axios instance (ensure no trailing slash on baseURL)
const configuredBase = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');
const apiClient: AxiosInstance = axios.create({
  baseURL: configuredBase,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Token refresh state management
let refreshing = false;
let refreshQueue: Array<() => void> = [];

// Response interceptor to handle token refresh and error normalization
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Check for HTML responses masquerading as JSON
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html') && typeof response.data === 'string') {
      console.error('Received HTML response instead of JSON:', response.config.url);
      throw new Error('Server returned HTML instead of JSON. Please check your API configuration.');
    }
    
    // Normalize response data to handle both array and {results: []} shapes
    if (response.data && typeof response.data === 'object') {
      // If it's a paginated response with results array, keep as is
      if (response.data.results && Array.isArray(response.data.results)) {
        return response;
      }
      // If it's a plain array, wrap it in results structure for consistency
      if (Array.isArray(response.data)) {
        response.data = {
          results: response.data,
          count: response.data.length,
          next: null,
          previous: null
        };
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle HTML error responses (common on 500s) - normalize error format
    const contentType = error.response?.headers?.['content-type'] || '';
    if (contentType.includes('text/html') || 
        (error.response?.data && typeof error.response.data === 'string' && error.response.data.trim().startsWith('<'))) {
      const statusCode = error.response?.status || 500;
      console.error(`Received HTML error response (${statusCode}):`, error.config?.url);
      error.response.data = { 
        detail: `Server Error (${statusCode})`,
        error: 'The server returned an HTML error page. Please check server logs.',
        message: 'Server configuration error'
      };
    }
    
    // Normalize error data to always have detail/error/message fields
    if (error.response?.data && typeof error.response.data === 'object' && !error.response.data.detail && !error.response.data.error && !error.response.data.message) {
      // Extract first error message if available
      const firstKey = Object.keys(error.response.data)[0];
      const firstValue = error.response.data[firstKey];
      error.response.data.detail = Array.isArray(firstValue) ? firstValue[0] : firstValue || 'An error occurred';
    }

    // Handle 404 errors gracefully - don't retry
    if (error.response?.status === 404) {
      console.warn('API endpoint not found:', error.config?.url);
      return Promise.reject(error);
    }

    // Single refresh attempt on 401 with token_not_valid semantics
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errData = error.response?.data || {};
      const code: string | undefined = errData.code || errData.detail || '';
      const isTokenInvalid = typeof code === 'string' && code.toLowerCase().includes('token_not_valid');
      if (!isTokenInvalid) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      const refreshToken = getStoredRefreshToken();
      if (refreshToken) {
        // If already refreshing, queue this request
        if (refreshing) {
          await new Promise<void>((resolve) => {
            refreshQueue.push(resolve);
          });
        } else {
          refreshing = true;
          try {
            const response = await apiClient.post(normalizeApiUrl(ENDPOINTS.refresh), {
              refresh: refreshToken,
            }, { withCredentials: true });

            const { access, refresh: newRefreshToken } = response.data;
            setStoredTokens(access, newRefreshToken || refreshToken);
          } catch (refreshError) {
            // Refresh failed, clear tokens and logout
            clearStoredTokens();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('toast', {
                detail: { type: 'error', title: 'Session Expired', message: 'Please login again' }
              }));
              try {
                localStorage.setItem('auth:logout', String(Date.now()));
              } catch {}
              const next = encodeURIComponent(window.location.pathname + window.location.search);
              window.location.assign(`/login?next=${next}`);
            }
            return Promise.reject(refreshError);
          } finally {
            refreshing = false;
            // Process queued requests
            refreshQueue.forEach(resolve => resolve());
            refreshQueue = [];
          }
        }

        // Retry original request with new token
        const newToken = getStoredToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } else {
        // No refresh token, logout
        clearStoredTokens();
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('auth:logout', String(Date.now()));
          } catch {}
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.assign(`/login?next=${next}`);
        }
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.get(normalizeApiUrl(url), config),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.post(normalizeApiUrl(url), data, config),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.put(normalizeApiUrl(url), data, config),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.patch(normalizeApiUrl(url), data, config),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.delete(normalizeApiUrl(url), config),
};

export default apiClient;
