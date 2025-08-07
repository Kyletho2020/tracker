import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Activities } from './Activities';

vi.mock('../hooks/useActivityTracker', () => ({
  useActivityTracker: () => ({
    activities: [
      { id: '1', type: 'website', name: 'GitHub', url: 'github.com', category: 'Dev', duration: 60, timestamp: new Date(), productivity_score: 5 },
      { id: '2', type: 'application', name: 'VS Code', category: 'Dev', duration: 120, timestamp: new Date(), productivity_score: 4 },
    ],
    isTracking: false,
    startTracking: vi.fn(),
    stopTracking: vi.fn(),
  }),
}));

describe('Activities', () => {
  it('shows activity count', () => {
    render(<Activities userId="1" />);
    expect(screen.getByText(/showing 2 of 2 activities/i)).toBeInTheDocument();
  });

  it('filters by search term', async () => {
    render(<Activities userId="1" />);
    await userEvent.type(screen.getByPlaceholderText(/search activities/i), 'code');
    expect(screen.getByText(/showing 1 of 2 activities/i)).toBeInTheDocument();
  });
});
