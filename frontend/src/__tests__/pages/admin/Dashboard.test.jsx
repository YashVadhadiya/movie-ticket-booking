import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../../../pages/admin/Dashboard';

vi.mock('../../../services/api', () => ({
  api: {
    getStats: vi.fn(),
    getShows: vi.fn(),
  },
}));

const { api } = await import('../../../services/api');

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading initially', () => {
    api.getStats.mockReturnValue(new Promise(() => {}));
    api.getShows.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('renders stat cards with data', async () => {
    api.getStats.mockResolvedValue({
      totalShows: 5,
      totalTheaters: 3,
      totalMovies: 10,
      totalBookings: 25,
      totalRevenue: 5000,
      occupancyRate: 65,
    });
    api.getShows.mockResolvedValue([]);
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  it('formats revenue with rupee symbol', async () => {
    api.getStats.mockResolvedValue({ totalShows: 0, totalTheaters: 0, totalMovies: 0, totalBookings: 0, totalRevenue: 1500, occupancyRate: 0 });
    api.getShows.mockResolvedValue([]);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('₹1500')).toBeInTheDocument();
    });
  });

  it('shows occupancy rate', async () => {
    api.getStats.mockResolvedValue({ totalShows: 0, totalTheaters: 0, totalMovies: 0, totalBookings: 0, totalRevenue: 0, occupancyRate: 42 });
    api.getShows.mockResolvedValue([]);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('42%')).toBeInTheDocument();
    });
  });

  it('renders recent shows table', async () => {
    api.getStats.mockResolvedValue({ totalShows: 1, totalTheaters: 0, totalMovies: 0, totalBookings: 0, totalRevenue: 0, occupancyRate: 0 });
    api.getShows.mockResolvedValue([{ id: 'sh1', movie: 'Inception', theater: 'Main Hall', showDate: '2025-12-25', showTime: '18:00', price: 10 }]);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Inception')).toBeInTheDocument();
      expect(screen.getByText('Main Hall')).toBeInTheDocument();
      expect(screen.getByText('18:00')).toBeInTheDocument();
    });
  });

  it('shows empty state when no shows', async () => {
    api.getStats.mockResolvedValue({ totalShows: 0, totalTheaters: 0, totalMovies: 0, totalBookings: 0, totalRevenue: 0, occupancyRate: 0 });
    api.getShows.mockResolvedValue([]);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('No shows yet. Create one from the Shows page.')).toBeInTheDocument();
    });
  });

  it('shows error on API failure', async () => {
    api.getStats.mockRejectedValue(new Error('Failed to load'));
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });
});
