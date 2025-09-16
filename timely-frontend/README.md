# Timely Frontend

A modern, responsive sports event management system built with vanilla JavaScript, HTML, and CSS.

## Features

- **Clean, Professional UI**: Modern design with light/dark theme support
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Role-Based Navigation**: Different views for Admin, Organizer, Coach, Athlete, and Spectator
- **Real-time Updates**: WebSocket support for live data updates
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation
- **Modular Architecture**: Clean separation of concerns with ES6 modules

## Tech Stack

- **HTML5**: Semantic markup
- **CSS3**: Custom properties, Grid, Flexbox
- **Vanilla JavaScript**: ES6+ modules, no frameworks
- **WebSocket**: Real-time communication
- **Fetch API**: HTTP requests

## Project Structure

```
src/
├── app/                 # Main application logic
│   └── App.js          # Application orchestrator
├── pages/              # Page components
│   ├── BasePage.js     # Base page class
│   ├── DashboardPage.js
│   ├── EventsPage.js
│   ├── LoginPage.js
│   └── ...
├── services/           # API and external services
│   └── api.js         # API client
├── utils/             # Utility functions
│   ├── theme.js       # Theme management
│   ├── router.js      # Hash-based routing
│   └── notifications.js # Toast notifications
├── config/            # Configuration
│   └── env.js         # Environment variables
└── styles/            # CSS styles
    └── main.css       # Main stylesheet
```

## Getting Started

1. **Install Dependencies**: No build step required - just serve the files
2. **Configure Backend**: Update `src/config/env.js` with your backend URL
3. **Serve Files**: Use any static file server (e.g., `python -m http.server`)
4. **Open Browser**: Navigate to `http://localhost:8000`

## Configuration

### Environment Variables

Create a `src/config/env.js` file or set `window.ENV` before loading:

```javascript
window.ENV = {
  API_BASE_URL: 'http://127.0.0.1:8000/api',
  WS_URL: 'ws://127.0.0.1:8000/ws/',
  DEBUG: false
};
```

### Backend Integration

The frontend expects a Django REST API with the following endpoints:

- `GET /api/accounts/users/me/` - Current user
- `POST /api/accounts/auth/login/` - Login
- `GET /api/events/` - List events
- `GET /api/venues/` - List venues
- `GET /api/registrations/` - List registrations
- And more...

## Pages

### Dashboard
- KPI cards showing key metrics
- Recent events, registrations, and notifications
- Quick actions based on user role

### Events
- List view with search and filters
- Create/edit event modals
- Event detail view with tabs

### Event Detail
- Overview tab with event information
- Participants tab for registrations
- Fixtures tab for schedule
- Results tab for scores and leaderboard
- Media tab for photos/videos
- Tickets tab for sales
- Settings tab for configuration

### Other Pages
- Registrations management
- Fixtures and scheduling
- Results and leaderboards
- Ticket management
- Venue management
- Media gallery
- User and role management
- Reports and analytics
- Settings

## Theming

The application supports light and dark themes with CSS custom properties:

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #1e293b;
  --primary: #3b82f6;
  /* ... more variables */
}

[data-theme="dark"] {
  --bg-primary: #0f172a;
  --text-primary: #f8fafc;
  /* ... dark theme overrides */
}
```

## Routing

Uses hash-based routing for deep linking:

- `#/dashboard` - Dashboard
- `#/events` - Events list
- `#/events/123` - Event detail
- `#/events/123/results` - Event results tab
- `#/registrations` - Registrations
- And more...

## API Client

The `API` class handles all backend communication:

```javascript
// Get events
const events = await app.api.getEvents({ page: 1, page_size: 20 });

// Create event
const event = await app.api.createEvent({
  name: 'New Event',
  start_date: '2024-01-01T10:00:00Z'
});

// Upload file
const result = await app.api.upload('/api/upload/', file);
```

## Notifications

Toast notifications for user feedback:

```javascript
// Success notification
app.notificationManager.success('Event created successfully!');

// Error notification
app.notificationManager.error('Failed to save event');

// Info notification
app.notificationManager.info('Processing...');
```

## Responsive Design

- **Desktop**: Full sidebar and topbar
- **Tablet** (≤1150px): Collapsible sidebar
- **Mobile** (≤768px): Stacked layout, full-width buttons

## Accessibility

- Keyboard navigation support
- ARIA labels and roles
- Focus management
- Screen reader friendly
- High contrast support

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Development

### Adding New Pages

1. Create a new page class extending `BasePage`
2. Add route in `App.js` setupRouting()
3. Add navigation item in `getNavigationItems()`

### Adding New Components

1. Create component in appropriate directory
2. Import and use in pages
3. Add styles to `main.css`

### Styling Guidelines

- Use CSS custom properties for theming
- Follow BEM-like naming conventions
- Use semantic HTML elements
- Ensure responsive design
- Test with keyboard navigation

## License

MIT License - see LICENSE file for details.