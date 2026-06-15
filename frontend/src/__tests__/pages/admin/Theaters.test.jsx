import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Theaters from '../../../pages/admin/Theaters';

vi.mock('../../../services/api', () => ({
  api: {
    getTheaters: vi.fn(),
    createTheater: vi.fn(),
    deleteTheater: vi.fn(),
  },
}));

const { api } = await import('../../../services/api');

function renderTheaters() {
  return render(
    <MemoryRouter>
      <Theaters />
    </MemoryRouter>
  );
}

describe('Theaters page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading initially', () => {
    api.getTheaters.mockReturnValue(new Promise(() => {}));
    renderTheaters();
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  it('renders theater list', async () => {
    api.getTheaters.mockResolvedValue([
      { id: 'th1', name: 'Main Hall', location: 'Floor 1', active: true, seatLayout: { rows: [{ seats: [{ id: 'A1' }, { id: 'A2' }] }] } },
      { id: 'th2', name: 'VIP Room', location: '', active: false, seatLayout: { rows: [] } },
    ]);
    renderTheaters();
    await waitFor(() => {
      expect(screen.getByText('Main Hall')).toBeInTheDocument();
      expect(screen.getByText('VIP Room')).toBeInTheDocument();
    });
  });

  it('shows empty state when no theaters', async () => {
    api.getTheaters.mockResolvedValue([]);
    renderTheaters();
    await waitFor(() => {
      expect(screen.getByText(/No theaters yet/)).toBeInTheDocument();
    });
  });

  it('toggles create form', async () => {
    api.getTheaters.mockResolvedValue([]);
    renderTheaters();
    await waitFor(() => screen.getByText('+ New Theater'));
    await userEvent.click(screen.getByText('+ New Theater'));
    expect(screen.getByText('Create New Theater')).toBeInTheDocument();
    await userEvent.click(screen.getByText('✕ Cancel'));
  });

  it('creates a theater', async () => {
    api.getTheaters.mockResolvedValue([]);
    api.createTheater.mockResolvedValue({ id: 'th1' });
    renderTheaters();
    await waitFor(() => screen.getByText('+ New Theater'));

    await userEvent.click(screen.getByText('+ New Theater'));
    await userEvent.type(screen.getByPlaceholderText('e.g., Main Hall'), 'New Hall');
    await userEvent.type(screen.getByPlaceholderText('e.g., Ground Floor'), 'Floor 2');
    await userEvent.click(screen.getByText('Create Theater'));

    await waitFor(() => {
      expect(api.createTheater).toHaveBeenCalledWith({ name: 'New Hall', location: 'Floor 2' });
    });
  });

  it('shows error on create failure', async () => {
    api.getTheaters.mockResolvedValue([]);
    api.createTheater.mockRejectedValue(new Error('Name required'));
    renderTheaters();
    await waitFor(() => screen.getByText('+ New Theater'));

    await userEvent.click(screen.getByText('+ New Theater'));
    await userEvent.type(screen.getByPlaceholderText('e.g., Main Hall'), 'Test');
    await userEvent.click(screen.getByText('Create Theater'));

    await waitFor(() => {
      expect(screen.getByText('Name required')).toBeInTheDocument();
    });
  });

  it('shows capacity counts', async () => {
    api.getTheaters.mockResolvedValue([
      { id: 'th1', name: 'T1', location: '', active: true, seatLayout: { rows: [
        { seats: [{ id: 'A1' }, { id: 'A2', blocked: true }] },
        { seats: [{ id: 'B1' }] },
      ] } },
    ]);
    renderTheaters();
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('/ 3')).toBeInTheDocument();
    });
  });
});
