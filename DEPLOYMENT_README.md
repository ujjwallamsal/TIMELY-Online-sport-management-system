# Timely Application - Deployment Guide

## Frontend (React + Vite)

### Production Build
```bash
cd timely-frontend
npm install
npm run build
```

The build creates optimized assets in `dist/` directory:
- `dist/index.html` (0.73 kB gzipped)
- `dist/assets/index-DmLH5svr.css` (62.56 kB, 11.84 kB gzipped)
- `dist/assets/index-B0HAhLET.js` (2.28 kB, 1.10 kB gzipped)
- `dist/assets/index-C7K3RuMR.js` (356.37 kB, 90.90 kB gzipped)

### Static File Serving
- Serve the `dist/` directory with a web server (nginx, Apache, etc.)
- Configure fallback routing to `index.html` for SPA routing
- Set appropriate cache headers for assets

### Environment Variables
- `VITE_API_URL`: Backend API URL (default: `http://127.0.0.1:8000/api`)

## Backend (Django + Channels)

### Production Checklist
Run `python manage.py check --deploy` to verify deployment readiness.

### Required Environment Variables
```bash
# Core Django
DEBUG=False
SECRET_KEY=your-secure-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# Redis (for WebSockets)
REDIS_URL=redis://localhost:6379/0

# JWT Tokens
ACCESS_TOKEN_LIFETIME_MIN=60
REFRESH_TOKEN_LIFETIME_DAYS=7

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Static & Media Files
```bash
# Collect static files
python manage.py collectstatic --noinput

# Serve static files with nginx or CDN
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Serve media files
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
```

### WebSocket Configuration
The app uses Django Channels with Redis for production:

```python
# Production (with Redis)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [os.environ.get('REDIS_URL')],
        },
    },
}

# Development (in-memory)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}
```

### Database Migrations
```bash
python manage.py migrate
python manage.py createsuperuser
```

### Production Server Setup
1. **WSGI Server**: Use Gunicorn or uWSGI
   ```bash
   pip install gunicorn
   gunicorn timely.wsgi:application
   ```

2. **ASGI Server**: Use Daphne for WebSocket support
   ```bash
   pip install daphne
   daphne -b 0.0.0.0 -p 8000 timely.asgi:application
   ```

3. **Process Manager**: Use systemd, supervisor, or PM2

4. **Reverse Proxy**: Configure nginx for static files and proxy to Django

### Security Settings for Production
```python
# Add to settings.py for production
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
```

### Monitoring & Logging
- Set up logging configuration for production
- Monitor WebSocket connections
- Set up health checks for `/health/` endpoint
- Configure error tracking (Sentry, Rollbar, etc.)

### Performance Optimizations
- Enable database connection pooling
- Use Redis for caching
- Configure CDN for static assets
- Enable gzip compression
- Set up database indexes for frequently queried fields

## Docker Deployment (Optional)

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### Backend Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["gunicorn", "timely.wsgi:application"]
```

## Health Checks

### Backend Health Check
```bash
curl http://localhost:8000/health/
```

### Frontend Health Check
- Check if the main bundle loads without errors
- Verify API connectivity
- Test WebSocket connection

## Troubleshooting

### Common Issues
1. **WebSocket Connection Failed**: Check Redis connection and CHANNEL_LAYERS config
2. **Static Files 404**: Run `collectstatic` and check STATIC_ROOT/STATIC_URL
3. **CORS Errors**: Configure CORS_ALLOWED_ORIGINS for your frontend domain
4. **Database Connection**: Verify DATABASE_URL and database server status

### Logs to Monitor
- Django application logs
- WebSocket connection logs
- Nginx access/error logs
- Redis logs (if using Redis)

## Scaling Considerations

### Horizontal Scaling
- Use Redis for shared WebSocket state
- Configure database connection pooling
- Use load balancer with sticky sessions for WebSockets
- Consider using Redis Cluster for high availability

### Vertical Scaling
- Monitor memory usage for WebSocket connections
- Optimize database queries
- Use caching for frequently accessed data
- Enable database query optimization
