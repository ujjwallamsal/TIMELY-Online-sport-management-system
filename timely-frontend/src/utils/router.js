/**
 * Router - Simple hash-based routing system
 */
export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.init();
  }

  /**
   * Initialize router
   */
  init() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      this.handleRouteChange();
    });

    // Handle initial route
    this.handleRouteChange();
  }

  /**
   * Register a route
   */
  route(path, handler) {
    this.routes.set(path, handler);
  }

  /**
   * Navigate to a route
   */
  navigate(path) {
    if (path.startsWith('#')) {
      window.location.hash = path;
    } else {
      window.location.hash = `#${path}`;
    }
  }

  /**
   * Get current route
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Get current hash without #
   */
  getCurrentHash() {
    return window.location.hash.slice(1);
  }

  /**
   * Handle route changes
   */
  handleRouteChange() {
    const hash = this.getCurrentHash();
    const route = this.parseRoute(hash);
    
    this.currentRoute = route;
    
    // Find matching route handler
    const handler = this.findRouteHandler(route.path);
    
    if (handler) {
      try {
        handler(route);
      } catch (error) {
        console.error('Route handler error:', error);
        this.navigate('/error');
      }
    } else {
      // Default to dashboard if no route matches
      if (hash === '' || hash === '/') {
        this.navigate('/dashboard');
      } else {
        this.navigate('/404');
      }
    }
  }

  /**
   * Parse route from hash
   */
  parseRoute(hash) {
    const [path, queryString] = hash.split('?');
    const params = this.parseQueryString(queryString || '');
    
    // Extract route parameters
    const pathParts = path.split('/').filter(part => part);
    const routeParams = {};
    
    // Check for dynamic segments (e.g., :id)
    for (const [routePath, handler] of this.routes) {
      const routeParts = routePath.split('/').filter(part => part);
      
      if (routeParts.length === pathParts.length) {
        let matches = true;
        const params = {};
        
        for (let i = 0; i < routeParts.length; i++) {
          const routePart = routeParts[i];
          const pathPart = pathParts[i];
          
          if (routePart.startsWith(':')) {
            // Dynamic parameter
            const paramName = routePart.slice(1);
            params[paramName] = pathPart;
          } else if (routePart !== pathPart) {
            matches = false;
            break;
          }
        }
        
        if (matches) {
          return {
            path: routePath,
            actualPath: path,
            params: { ...params, ...this.parseQueryString(queryString || '') },
            query: this.parseQueryString(queryString || '')
          };
        }
      }
    }
    
    return {
      path,
      actualPath: path,
      params: this.parseQueryString(queryString || ''),
      query: this.parseQueryString(queryString || '')
    };
  }

  /**
   * Parse query string
   */
  parseQueryString(queryString) {
    const params = {};
    
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key) {
          params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : true;
        }
      });
    }
    
    return params;
  }

  /**
   * Find route handler
   */
  findRouteHandler(path) {
    // Direct match
    if (this.routes.has(path)) {
      return this.routes.get(path);
    }
    
    // Check for dynamic routes
    for (const [routePath, handler] of this.routes) {
      if (this.isRouteMatch(routePath, path)) {
        return handler;
      }
    }
    
    return null;
  }

  /**
   * Check if route matches pattern
   */
  isRouteMatch(pattern, path) {
    const patternParts = pattern.split('/').filter(part => part);
    const pathParts = path.split('/').filter(part => part);
    
    if (patternParts.length !== pathParts.length) {
      return false;
    }
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];
      
      if (patternPart.startsWith(':')) {
        // Dynamic parameter - matches any value
        continue;
      } else if (patternPart !== pathPart) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Build URL with parameters
   */
  buildUrl(path, params = {}) {
    let url = path;
    
    // Replace path parameters
    Object.keys(params).forEach(key => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, params[key]);
        delete params[key];
      }
    });
    
    // Add query parameters
    const queryParams = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    if (queryParams) {
      url += `?${queryParams}`;
    }
    
    return url;
  }

  /**
   * Navigate with parameters
   */
  navigateWithParams(path, params = {}) {
    const url = this.buildUrl(path, params);
    this.navigate(url);
  }

  /**
   * Get route parameter
   */
  getParam(name) {
    return this.currentRoute?.params?.[name];
  }

  /**
   * Get query parameter
   */
  getQuery(name) {
    return this.currentRoute?.query?.[name];
  }

  /**
   * Check if current route matches pattern
   */
  isCurrentRoute(pattern) {
    if (!this.currentRoute) return false;
    return this.isRouteMatch(pattern, this.currentRoute.actualPath);
  }
}
