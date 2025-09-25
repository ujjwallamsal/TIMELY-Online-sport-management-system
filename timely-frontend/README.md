# TIMELY Sports Management System - Frontend

A comprehensive React 18 frontend for the TIMELY online sports management system, built with TypeScript, Vite, and Tailwind CSS.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🏗️ Architecture

### Tech Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **React Router v6** for routing
- **Axios** for API communication
- **Zod** for form validation
- **Lucide React** for icons

### Key Features

#### 🔐 Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Organizer, Coach, Athlete, Spectator)
- Protected routes and navigation

#### 🏠 Public Homepage
- Compelling landing page with real data
- Featured events showcase
- News and gallery sections
- Call-to-action sections

#### 👨‍💼 Admin Dashboard
- User management with search and filtering
- Event management with status controls
- System metrics and analytics
- Quick actions for common tasks

#### 🎯 Organizer Module
- Event creation and management
- Registration approval/rejection
- Fixture generation
- Results tracking
- Event announcements

#### 🏆 Coach Module
- Results entry for fixtures
- Team management
- Performance tracking
- Real-time updates

#### 🏃‍♂️ Athlete Module
- Event registration
- Personal dashboard
- Registration history
- Upcoming fixtures

#### 👥 Spectator Module
- Event browsing
- Ticket purchasing (simulated)
- Live results viewing
- Event details

#### ⚡ Real-time Features
- Server-Sent Events (SSE) with polling fallback
- Live result updates
- Real-time notifications
- Connection status indicators

#### 🎨 Design System
- Modern, responsive design
- Consistent color palette and typography
- Mobile-first approach
- Accessibility features
- Loading states and animations

## 📁 Project Structure

```
src/
├── api/                 # API client and queries
├── auth/               # Authentication context and hooks
├── components/         # Reusable UI components
├── contexts/           # React contexts
├── features/           # Feature-specific components
│   ├── admin/          # Admin dashboard and management
│   ├── dashboard/      # Role-based dashboards
│   ├── events/         # Event management
│   ├── fixtures/       # Fixture management
│   ├── news/           # News and announcements
│   ├── notifications/  # Notification system
│   ├── registrations/  # Registration management
│   ├── results/        # Results and leaderboards
│   └── tickets/        # Ticketing system
├── hooks/              # Custom React hooks
├── schemas/            # Zod validation schemas
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### API Integration
The frontend integrates with a Django REST Framework backend. Key endpoints:

- **Authentication**: `/api/auth/login/`, `/api/auth/refresh/`
- **Events**: `/api/events/`, `/api/events/{id}/`
- **Users**: `/api/users/`
- **Registrations**: `/api/registrations/`
- **Results**: `/api/results/`
- **Fixtures**: `/api/fixtures/`

## 🚦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## 🎯 Key Features Implemented

### ✅ Authentication System
- JWT token management
- Automatic token refresh
- Role-based routing
- Logout on token expiration

### ✅ Data Management
- React Query for caching and synchronization
- Optimistic updates
- Error handling and retry logic
- Loading states

### ✅ Form Handling
- Zod validation schemas
- Custom form hooks
- Error display and validation
- Submission states

### ✅ Real-time Updates
- SSE connection management
- Polling fallback
- Connection status monitoring
- Automatic reconnection

### ✅ Error Handling
- Error boundaries
- Toast notifications
- Graceful degradation
- User-friendly error messages

### ✅ Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interactions
- Consistent spacing

## 🔄 State Management

- **React Query** for server state
- **React Context** for global app state
- **Local state** with useState/useReducer
- **URL state** with React Router

## 🎨 Styling

- **Tailwind CSS** for utility-first styling
- **Custom CSS** for complex components
- **Design tokens** for consistency
- **Responsive breakpoints**
- **Dark mode support** (ready for implementation)

## 🚀 Performance

- **Code splitting** with React.lazy
- **Bundle optimization** with Vite
- **Image optimization**
- **Lazy loading** for components
- **Memoization** for expensive operations

## 🔒 Security

- **JWT token security**
- **XSS protection**
- **CSRF protection** (backend dependent)
- **Input validation**
- **Secure API communication**

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Write meaningful commit messages
4. Test your changes thoroughly
5. Follow the established patterns

## 📄 License

This project is part of the TIMELY Sports Management System.

---

**Built with ❤️ using React, TypeScript, and modern web technologies.**