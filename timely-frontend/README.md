# Timely - Sports Event Management System

A modern, real-time sports event management platform built with Django 5 + DRF + PostgreSQL + React (Vite).

## 🚀 Features

### Event Management
- **CRUD Operations**: Create, read, update, and delete events (organizers only)
- **Event Statuses**: Draft → Published → Upcoming → Ongoing → Completed/Cancelled
- **Validation**: Date validation, capacity limits, venue conflict detection
- **Real-time Updates**: WebSocket integration for live event updates

### User Roles & Permissions
- **Spectator**: Browse and attend events
- **Athlete**: Participate in sports events
- **Coach**: Train and guide athletes
- **Organizer**: Create and manage events
- **Admin**: Full system access

### Modern UI/UX
- **Tailwind CSS**: Utility-first, responsive design
- **Mobile-First**: Optimized for all devices
- **Accessibility**: WCAG AA compliant
- **Real-time Indicators**: Live connection status

## 🛠️ Tech Stack

### Backend
- **Django 5**: Modern Python web framework
- **Django REST Framework**: API development
- **PostgreSQL**: Robust database
- **Django Channels**: WebSocket support
- **Redis**: Message broker for real-time features

### Frontend
- **React 18**: Modern UI library
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first CSS framework
- **WebSockets**: Real-time communication

## 📁 Project Structure

```
timely-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── context/            # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # API and utility functions
│   └── utils/              # Helper functions
├── public/                 # Static assets
└── package.json            # Dependencies
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running (see backend setup)

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd timely-frontend
   npm install
   ```

2. **Environment variables**
   Create `.env.local` file:
   ```env
   VITE_API_BASE=http://127.0.0.1:8000
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### Backend Setup

1. **Navigate to backend**
   ```bash
   cd timely-backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Database setup**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

5. **Start development server**
   ```bash
   python manage.py runserver
   ```

6. **Start Redis (for WebSockets)**
   ```bash
   redis-server
   ```

## 🔧 Key Components

### Event Management
- **EventManagement.jsx**: Organizer dashboard for CRUD operations
- **Events.jsx**: Public event listing with filters
- **EventDetail.jsx**: Comprehensive event information

### Real-time Features
- **useWebSocket.js**: WebSocket hook for real-time updates
- **Event updates**: Live notifications when events change
- **Connection status**: Visual indicators for WebSocket state

### Authentication
- **AuthContext.jsx**: User authentication and role management
- **Protected routes**: Role-based access control
- **JWT tokens**: Secure authentication

## 🎨 Design Principles

- **Mobile-First**: Responsive design starting from mobile
- **Accessibility**: WCAG AA compliance
- **Performance**: Optimized loading and real-time updates
- **User Experience**: Intuitive navigation and clear feedback

## 📱 Responsive Design

- **Mobile**: Single-column layout, touch-friendly
- **Tablet**: Two-column grid, optimized spacing
- **Desktop**: Full-featured layout with sidebar

## 🔒 Security Features

- **Role-based access**: Granular permissions
- **Input validation**: Client and server-side validation
- **CSRF protection**: Django security features
- **Secure headers**: HTTPS and security headers

## 🧪 Testing

```bash
# Frontend tests
npm run test

# Backend tests
python manage.py test
```

## 🚀 Deployment

### Frontend
```bash
npm run build
# Deploy dist/ folder to your hosting service
```

### Backend
```bash
# Production settings
python manage.py collectstatic
gunicorn timely.wsgi:application
```

## 📊 Database Indexes

Optimized for performance:
- `(status, start_date)` - Event filtering
- `(sport_type, status)` - Sport-based queries
- `(venue, start_date)` - Venue availability

## 🔄 Real-time Updates

- **WebSocket events**: `event.changed`, `user.updated`
- **Fallback**: Automatic reconnection with polling
- **Lightweight**: Efficient message handling

## 📊 Admin Dashboard Data & Realtime

### Dashboard Features
- **Live Statistics**: Total users, active events, tickets sold, total revenue
- **Revenue Charts**: Interactive time series with week/month/year views
- **User Distribution**: Pie chart showing role-based user breakdown
- **Recent Activity**: Tables for recent events and registrations
- **System Status**: Real-time health monitoring

### Data Sources
The dashboard automatically detects and uses the first available endpoint from these configurations:

```typescript
// Stats endpoints (tried in order)
stats: [
  '/api/reports/admin/stats/',
  '/api/reports/summary/',
  '/api/admin/stats/',
]

// Revenue data
revenue: [
  '/api/reports/revenue/',
  '/api/payments/revenue/',
]

// User distribution
userDistribution: [
  '/api/reports/users/by-role/',
  '/api/accounts/stats/roles/',
]
```

### Real-time Channels
Dashboard subscribes to these WebSocket groups:
- `events:admin` - Event updates
- `registrations:admin` - Registration changes
- `payments:admin` - Payment updates
- `reports:admin` - Statistics updates

### Polling Fallback
If WebSocket disconnects, dashboard automatically falls back to 15-second polling to keep data fresh.

### Endpoint Detection
The system automatically probes multiple endpoint variants and caches the working one for the session, ensuring compatibility with different backend configurations.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

---

**Built with ❤️ for the sports community**
