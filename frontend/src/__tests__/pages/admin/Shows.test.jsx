import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Shows from '../../../pages/admin/Shows';

const mockClipboard = { writeText: vi.fn().mockResolvedValue() };
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard, configurable: true, writable: true,
});

vi.mock('../../../services/api', () => ({
  api: {
    getShows: vi.fn(),
    getTheaters: vi.fn(),
    getMovies: vi.fn(),
    createShow: vi.fn(),
    updateShow: vi.fn(),
    deleteShow: vi.fn(),
  },
}));

const { api } = await import('../../../services/api');

function renderShows() {
  return render(
    <MemoryRouter>
      <Shows />
    </MemoryRouter>
  );
}

describe('Shows page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading initially', () => {
    api.getShows.mockReturnValue(new Promise(() => {}));
    api.getTheaters.mockReturnValue(new Promise(() => {}));
    api.getMovies.mockReturnValue(new Promise(() => {}));
    renderShows();
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  it('renders show list with movie and theater names', async () => {
    api.getShows.mockResolvedValue([
      { id: 'sh1', movie: 'Inception', theater: 'Main Hall', showDate: '2025-12-25', showTime: '18:00', price: 10, slug: 'abc123' },
    ]);
    api.getTheaters.mockResolvedValue([{ id: 'th1', name: 'Main Hall', active: true }]);
    api.getMovies.mockResolvedValue([{ id: 'mv1', title: 'Inception', active: true }]);
    renderShows();
    await waitFor(() => {
      expect(screen.getByText('Inception')).toBeInTheDocument();
      expect(screen.getByText('Main Hall')).toBeInTheDocument();
      expect(screen.getByText('18:00')).toBeInTheDocument();
    });
  });

  it('shows empty state', async () => {
    api.getShows.mockResolvedValue([]);
    api.getTheaters.mockResolvedValue([]);
    api.getMovies.mockResolvedValue([]);
    renderShows();
    await waitFor(() => {
      expect(screen.getByText(/No shows scheduled/)).toBeInTheDocument();
    });
  });

  it('creates a show', async () => {
    api.getShows.mockResolvedValue([]);
    api.getTheaters.mockResolvedValue([{ id: 'th1', name: 'Main Hall', active: true }]);
    api.getMovies.mockResolvedValue([{ id: 'mv1', title: 'Inception', active: true }]);
    api.createShow.mockResolvedValue({ id: 'sh1' });
    renderShows();
    await waitFor(() => screen.getByText('+ New Show'));

    await userEvent.click(screen.getByText('+ New Show'));
    expect(screen.getByText('Schedule a New Show')).toBeInTheDocument();

    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[0], 'th1');
    await userEvent.selectOptions(selects[1], 'mv1');
    const form = document.querySelector('form');
    fireEvent.submit(form);
    await waitFor(() => {
      expect(api.createShow).toHaveBeenCalled();
    });
  });

  it('copies booking link', async () => {
    api.getShows.mockResolvedValue([
      { id: 'sh1', movie: 'M', theater: 'T', showDate: '2025-12-25', showTime: '18:00', price: 10, slug: 'test-slug' },
    ]);
    api.getTheaters.mockResolvedValue([]);
    api.getMovies.mockResolvedValue([]);
    renderShows();
    await waitFor(() => screen.getByText('🔗 Copy Link'));

    await userEvent.click(screen.getByText('🔗 Copy Link'));
    expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/book/test-slug'));
  });

  it('shows error on failure', async () => {
    api.getShows.mockRejectedValue(new Error('Load failed'));
    renderShows();
    await waitFor(() => {
      expect(screen.getByText('Load failed')).toBeInTheDocument();
    });
  });
});
