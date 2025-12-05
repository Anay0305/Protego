import { render, screen } from '@testing-library/react';
import AlertCard from '../components/AlertCard';

describe('AlertCard Component', () => {
  const mockAlert = {
    id: 1,
    type: 'SCREAM',
    confidence: 0.85,
    status: 'triggered',
    location_lat: 40.7128,
    location_lng: -74.0060,
    created_at: new Date().toISOString(),
    triggered_at: new Date().toISOString(),
  };

  test('renders alert information correctly', () => {
    render(<AlertCard alert={mockAlert} />);

    expect(screen.getByText(/Scream/i)).toBeInTheDocument();
    expect(screen.getByText(/85%/i)).toBeInTheDocument();
    expect(screen.getByText(/Triggered/i)).toBeInTheDocument();
  });

  test('displays location link when coordinates provided', () => {
    render(<AlertCard alert={mockAlert} />);

    const locationLink = screen.getByText(/View Location on Map/i);
    expect(locationLink).toBeInTheDocument();
    expect(locationLink.closest('a')).toHaveAttribute(
      'href',
      expect.stringContaining('maps.google.com')
    );
  });

  test('renders different status badges correctly', () => {
    const { rerender } = render(<AlertCard alert={{ ...mockAlert, status: 'pending' }} />);
    expect(screen.getByText(/Pending/i)).toBeInTheDocument();

    rerender(<AlertCard alert={{ ...mockAlert, status: 'cancelled' }} />);
    expect(screen.getByText(/Cancelled/i)).toBeInTheDocument();

    rerender(<AlertCard alert={{ ...mockAlert, status: 'safe' }} />);
    expect(screen.getByText(/Safe/i)).toBeInTheDocument();
  });
});
