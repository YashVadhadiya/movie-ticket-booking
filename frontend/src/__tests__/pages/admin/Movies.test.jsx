import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Movies from '../../../pages/admin/Movies';

vi.mock('../../../services/api', () => ({
  api: {
    getMovies: vi.fn(),
    createMovie: vi.fn(),
    updateMovie: vi.fn(),
    deleteMovie: vi.fn(),
  },
}));

const { api } = await import('../../../services/api');

function renderMovies() {
  return render(
    <MemoryRouter>
      <Movies />
    </MemoryRouter>
  );
}

describe('Movies page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading initially', () => {
    api.getMovies.mockReturnValue(new Promise(() => {}));
    renderMovies();
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  it('renders movie list', async () => {
    api.getMovies.mockResolvedValue([
      { id: 'mv1', title: 'Inception', duration: 148, language: 'English', description: 'A mind-bending thriller', youtube: 'https://youtu.be/dQw4w9WgXcQ', poster: '', active: true },
      { id: 'mv2', title: 'Parasite', duration: 132, language: 'Korean', description: '', youtube: '', poster: '', active: true },
    ]);
    renderMovies();
    await waitFor(() => {
      expect(screen.getByText('Inception')).toBeInTheDocument();
      expect(screen.getByText('Parasite')).toBeInTheDocument();
      expect(screen.getByText('148 min')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });
  });

  it('shows empty state', async () => {
    api.getMovies.mockResolvedValue([]);
    renderMovies();
    await waitFor(() => {
      expect(screen.getByText(/No movies in the catalog/)).toBeInTheDocument();
    });
  });

  it('opens create form and creates a movie', async () => {
    api.getMovies.mockResolvedValue([]);
    api.createMovie.mockResolvedValue({ id: 'mv1' });
    renderMovies();
    await waitFor(() => screen.getByText('+ Add Movie'));

    await userEvent.click(screen.getByText('+ Add Movie'));
    expect(screen.getByText('Add New Movie')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Movie title'), 'New Movie');
    await userEvent.type(screen.getByPlaceholderText('e.g., 120'), '90');
    await userEvent.click(screen.getByText('Add Movie'));

    await waitFor(() => {
      expect(api.createMovie).toHaveBeenCalled();
      expect(api.createMovie.mock.calls[0][0].title).toBe('New Movie');
    });
  });

  it('opens edit form with pre-filled data', async () => {
    api.getMovies.mockResolvedValue([
      { id: 'mv1', title: 'Old Title', duration: 120, language: 'English', description: 'Desc', youtube: 'https://youtu.be/test', poster: '', active: true },
    ]);
    renderMovies();
    await waitFor(() => screen.getByText('✏️ Edit'));

    await userEvent.click(screen.getByText('✏️ Edit'));
    expect(screen.getByText('Edit Movie')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Old Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('120')).toBeInTheDocument();
  });

  it('shows error on failure', async () => {
    api.getMovies.mockRejectedValue(new Error('API Error'));
    renderMovies();
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });
});
