import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EventCard from '../EventCard';

// Mock data for testing
const mockEvent = {
  id: 1,
  name: "Summer Football Championship",
  sport_type: "Football",
  start_date: "2024-07-15",
  end_date: "2024-07-20",
  venue_name: "Central Stadium",
  capacity: 200,
  fee_dollars: 25.00,
  status: "PUBLISHED",
  is_registration_open: true,
  days_until_start: 30
};

// Wrapper component to provide router context
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('EventCard', () => {
  test('renders event information correctly', () => {
    renderWithRouter(<EventCard event={mockEvent} />);
    
    // Check if event name is displayed
    expect(screen.getByText('Summer Football Championship')).toBeInTheDocument();
    
    // Check if sport type is displayed
    expect(screen.getByText('Football')).toBeInTheDocument();
    
    // Check if venue is displayed
    expect(screen.getByText('Central Stadium')).toBeInTheDocument();
    
    // Check if fee is displayed
    expect(screen.getByText('$25.00')).toBeInTheDocument();
  });

  test('displays correct status badge', () => {
    renderWithRouter(<EventCard event={mockEvent} />);
    
    const statusBadge = screen.getByText('PUBLISHED');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
  });

  test('shows registration status correctly', () => {
    renderWithRouter(<EventCard event={mockEvent} />);
    
    // Check if registration open indicator is shown
    expect(screen.getByText('Registration Open')).toBeInTheDocument();
    
    // Check if the green dot is present
    const greenDot = screen.getByTestId('registration-status-dot');
    expect(greenDot).toHaveClass('bg-green-500');
  });

  test('displays days until event', () => {
    renderWithRouter(<EventCard event={mockEvent} />);
    
    expect(screen.getByText('30 days away')).toBeInTheDocument();
  });

  test('renders view details button', () => {
    renderWithRouter(<EventCard event={mockEvent} />);
    
    const viewButton = screen.getByRole('link', { name: /view details/i });
    expect(viewButton).toBeInTheDocument();
    expect(viewButton).toHaveAttribute('href', '/events/1');
  });

  test('handles missing optional data gracefully', () => {
    const minimalEvent = {
      id: 2,
      name: "Minimal Event",
      sport_type: "Tennis",
      start_date: "2024-08-01",
      end_date: "2024-08-01",
      status: "DRAFT",
      is_registration_open: false,
      days_until_start: 0
    };
    
    renderWithRouter(<EventCard event={minimalEvent} />);
    
    // Should still render the basic information
    expect(screen.getByText('Minimal Event')).toBeInTheDocument();
    expect(screen.getByText('Tennis')).toBeInTheDocument();
    
    // Should handle missing venue gracefully
    expect(screen.getByText('Venue: TBD')).toBeInTheDocument();
    
    // Should show registration closed
    expect(screen.getByText('Registration Closed')).toBeInTheDocument();
  });

  test('applies correct styling classes', () => {
    renderWithRouter(<EventCard event={mockEvent} />);
    
    const card = screen.getByTestId('event-card');
    expect(card).toHaveClass(
      'bg-white',
      'rounded-lg',
      'shadow-sm',
      'border',
      'border-gray-200',
      'hover:shadow-md'
    );
  });
});
