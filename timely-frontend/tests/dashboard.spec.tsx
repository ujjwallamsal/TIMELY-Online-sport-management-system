// tests/dashboard.spec.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../src/pages/admin/Dashboard';
import { AuthProvider } from '../src/context/AuthContext';

// Mock the API functions
jest.mock('../src/config/endpoints', () => ({
  getStats: jest.fn(() => Promise.resolve({
    data: {
      total_users: 150,
      active_events: 12,
      tickets_sold: 450,
      total_revenue: 25000,
      user_trend: 5.2,
      event_trend: 2.1,
      ticket_trend: 8.7,
      revenue_trend: 12.3
    }
  })),
  getRevenue: jest.fn(() => Promise.resolve({
    data: [
      { date: '2024-01-01', revenue: 5000 },
      { date: '2024-01-02', revenue: 7500 },
      { date: '2024-01-03', revenue: 6200 }
    ]
  })),
  getUserDistribution: jest.fn(() => Promise.resolve({
    data: [
      { role: 'athlete', count: 120, percentage: 80 },
      { role: 'coach', count: 20, percentage: 13.3 },
      { role: 'organizer', count: 10, percentage: 6.7 }
    ]
  })),
  getRecentEvents: jest.fn(() => Promise.resolve({
    data: [
      {
        id: 1,
        name: 'Summer Championship',
        start_datetime: '2024-06-15T10:00:00Z',
        location: 'Main Stadium',
        capacity: 1000,
        registered_count: 750,
        lifecycle_status: 'published',
        sport: 'Football'
      },
      {
        id: 2,
        name: 'Winter Tournament',
        start_datetime: '2024-12-20T14:00:00Z',
        location: 'Indoor Arena',
        capacity: 500,
        registered_count: 300,
        lifecycle_status: 'published',
        sport: 'Basketball'
      }
    ]
  })),
  getRecentRegistrations: jest.fn(() => Promise.resolve({
    data: [
      {
        id: 1,
        user: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com'
        },
        event: {
          name: 'Summer Championship',
          start_datetime: '2024-06-15T10:00:00Z'
        },
        type: 'athlete',
        status: 'approved',
        created_at: '2024-01-15T09:30:00Z'
      },
      {
        id: 2,
        user: {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@example.com'
        },
        event: {
          name: 'Winter Tournament',
          start_datetime: '2024-12-20T14:00:00Z'
        },
        type: 'coach',
        status: 'pending',
        created_at: '2024-01-14T16:45:00Z'
      }
    ]
  })),
  getHealth: jest.fn(() => Promise.resolve({
    data: {
      status: 'ok',
      database: 'ok',
      timestamp: '2024-01-15T10:00:00Z'
    }
  }))
}));

// Mock the useSocket hook
jest.mock('../src/hooks/useSocket', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isConnected: true,
    lastMessage: null
  }))
}));

// Mock user context
const mockUser = {
  id: 1,
  email: 'admin@example.com',
  first_name: 'Admin',
  last_name: 'User',
  role: 'ADMIN',
  is_staff: true,
  is_superuser: true
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Mock the AuthContext to return our test user
    jest.spyOn(React, 'useContext').mockImplementation((context) => {
      if (context === require('../src/context/AuthContext').AuthContext) {
        return {
          user: mockUser,
          loading: false,
          login: jest.fn(),
          logout: jest.fn(),
          register: jest.fn()
        };
      }
      return {};
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with loading state initially', () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Should show loading skeletons
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, Admin! Here\'s what\'s happening with your platform.')).toBeInTheDocument();
  });

  it('renders dashboard with data after loading', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    // Check stat cards
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Active Events')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Tickets Sold')).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('25000')).toBeInTheDocument();

    // Check charts section
    expect(screen.getByText('Revenue Overview')).toBeInTheDocument();
    expect(screen.getByText('User Distribution')).toBeInTheDocument();

    // Check tables
    expect(screen.getByText('Recent Events')).toBeInTheDocument();
    expect(screen.getByText('Summer Championship')).toBeInTheDocument();
    expect(screen.getByText('Recent Registrations')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Check system status
    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('WebSocket')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('handles revenue range changes', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Revenue Overview')).toBeInTheDocument();
    });

    // Check that range buttons are present
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
    expect(screen.getByText('Year')).toBeInTheDocument();
  });

  it('shows empty state when no data', async () => {
    // Mock empty data
    const { getStats, getRevenue, getUserDistribution, getRecentEvents, getRecentRegistrations } = require('../src/config/endpoints');
    getStats.mockResolvedValueOnce({ data: { total_users: 0, active_events: 0, tickets_sold: 0, total_revenue: 0 } });
    getRevenue.mockResolvedValueOnce({ data: [] });
    getUserDistribution.mockResolvedValueOnce({ data: [] });
    getRecentEvents.mockResolvedValueOnce({ data: [] });
    getRecentRegistrations.mockResolvedValueOnce({ data: [] });

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    // Should show empty states in tables
    expect(screen.getByText('No events found')).toBeInTheDocument();
    expect(screen.getByText('No registrations found')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock API errors
    const { getStats } = require('../src/config/endpoints');
    getStats.mockRejectedValueOnce(new Error('API Error'));

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Should still render the dashboard structure
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, Admin! Here\'s what\'s happening with your platform.')).toBeInTheDocument();
  });

  it('displays user name correctly', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    expect(screen.getByText('Welcome back, Admin! Here\'s what\'s happening with your platform.')).toBeInTheDocument();
  });

  it('shows WebSocket connection status', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('System Status')).toBeInTheDocument();
    });

    expect(screen.getByText('WebSocket')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });
});
