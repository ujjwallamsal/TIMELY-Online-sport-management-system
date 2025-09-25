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
const configuredBase = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
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

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 404 errors gracefully - don't retry
    if (error.response?.status === 404) {
      console.warn('API endpoint not found:', error.config?.url);
      return Promise.reject(error);
    }

    // Single refresh attempt on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
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
            const response = await axios.post(normalizeApiUrl(ENDPOINTS.refresh), {
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
              window.dispatchEvent(new CustomEvent('logout'));
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
          window.dispatchEvent(new CustomEvent('logout'));
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
