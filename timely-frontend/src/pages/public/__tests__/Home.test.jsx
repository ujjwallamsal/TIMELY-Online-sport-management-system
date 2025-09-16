import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../Home';

// Mock the components to avoid complex dependencies
jest.mock('../../components/public/Hero', () => {
  return function MockHero() {
    return <div data-testid="hero">Hero Component</div>;
  };
});

jest.mock('../../components/public/Stats', () => {
  return function MockStats() {
    return <div data-testid="stats">Stats Component</div>;
  };
});

jest.mock('../../components/public/Features', () => {
  return function MockFeatures() {
    return <div data-testid="features">Features Component</div>;
  };
});

jest.mock('../../components/public/UpcomingEvents', () => {
  return function MockUpcomingEvents() {
    return <div data-testid="upcoming-events">Upcoming Events Component</div>;
  };
});

jest.mock('../../components/public/Roles', () => {
  return function MockRoles() {
    return <div data-testid="roles">Roles Component</div>;
  };
});

jest.mock('../../components/public/Testimonials', () => {
  return function MockTestimonials() {
    return <div data-testid="testimonials">Testimonials Component</div>;
  };
});

jest.mock('../../components/public/CTA', () => {
  return function MockCTA() {
    return <div data-testid="cta">CTA Component</div>;
  };
});

jest.mock('../../components/public/PublicFooter', () => {
  return function MockPublicFooter() {
    return <div data-testid="footer">Footer Component</div>;
  };
});

// Mock the useSocket hook
jest.mock('../../hooks/useSocket', () => {
  return function useSocket() {
    return {
      connectionStatus: 'connected',
      lastMessage: null
    };
  };
});

const renderHome = () => {
  return render(
    <BrowserRouter>
      <Home />
    </BrowserRouter>
  );
};

describe('Home Page', () => {
  test('renders all main sections', () => {
    renderHome();
    
    // Check that all main components are rendered
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('stats')).toBeInTheDocument();
    expect(screen.getByTestId('features')).toBeInTheDocument();
    expect(screen.getByTestId('upcoming-events')).toBeInTheDocument();
    expect(screen.getByTestId('roles')).toBeInTheDocument();
    expect(screen.getByTestId('testimonials')).toBeInTheDocument();
    expect(screen.getByTestId('cta')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  test('renders header with navigation', () => {
    renderHome();
    
    // Check header elements
    expect(screen.getByText('Timely')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  test('has proper accessibility features', () => {
    renderHome();
    
    // Check for skip link
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
    
    // Check for main content landmark
    const mainContent = screen.getByRole('main');
    expect(mainContent).toBeInTheDocument();
    expect(mainContent).toHaveAttribute('id', 'main-content');
    
    // Check for navigation landmark
    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();
  });

  test('has proper semantic structure', () => {
    renderHome();
    
    // Check for header
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    // Check for main content
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    
    // Check for footer
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  test('navigation links have proper attributes', () => {
    renderHome();
    
    // Check navigation links
    const homeLink = screen.getByText('Home');
    expect(homeLink).toHaveAttribute('href', '#home');
    
    const eventsLink = screen.getByText('Events');
    expect(eventsLink).toHaveAttribute('href', '#events');
    
    const featuresLink = screen.getByText('Features');
    expect(featuresLink).toHaveAttribute('href', '#features');
  });

  test('CTA buttons have proper focus states', () => {
    renderHome();
    
    const signInLink = screen.getByText('Sign In');
    const registerLink = screen.getByText('Register');
    
    expect(signInLink).toHaveClass('transition-colors');
    expect(registerLink).toHaveClass('focus:outline-none', 'focus:ring-4', 'focus:ring-blue-500');
  });
});

describe('Home Page Integration', () => {
  test('renders without crashing', () => {
    expect(() => renderHome()).not.toThrow();
  });

  test('has proper page structure', () => {
    renderHome();
    
    // Check that the page has the correct structure
    const page = screen.getByRole('main').closest('div');
    expect(page).toHaveClass('min-h-screen', 'bg-white');
  });

  test('all sections are visible', async () => {
    renderHome();
    
    await waitFor(() => {
      // All sections should be visible
      expect(screen.getByTestId('hero')).toBeVisible();
      expect(screen.getByTestId('stats')).toBeVisible();
      expect(screen.getByTestId('features')).toBeVisible();
      expect(screen.getByTestId('upcoming-events')).toBeVisible();
      expect(screen.getByTestId('roles')).toBeVisible();
      expect(screen.getByTestId('testimonials')).toBeVisible();
      expect(screen.getByTestId('cta')).toBeVisible();
      expect(screen.getByTestId('footer')).toBeVisible();
    });
  });
});
