import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TheaterDesigner from '../../../pages/admin/TheaterDesigner';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: 'th1' }) };
});

vi.mock('../../../services/api', () => ({
  api: {
    getTheater: vi.fn(),
    updateTheater: vi.fn(),
  },
}));

const { api } = await import('../../../services/api');

function renderDesigner() {
  return render(
    <MemoryRouter>
      <TheaterDesigner />
    </MemoryRouter>
  );
}

describe('TheaterDesigner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it('shows loading initially', () => {
    api.getTheater.mockReturnValue(new Promise(() => {}));
    renderDesigner();
    expect(screen.getByText('Loading theater...')).toBeInTheDocument();
  });

  it('shows error if theater not found', async () => {
    api.getTheater.mockResolvedValue(null);
    renderDesigner();
    await waitFor(() => {
      expect(screen.getByText('Theater not found')).toBeInTheDocument();
    });
  });

  it('renders designer with theater data', async () => {
    api.getTheater.mockResolvedValue({
      id: 'th1', name: 'Main Hall', location: 'Floor 1',
      seatLayout: { rows: [{ label: 'A', seats: [{ id: 'A1', blocked: false }] }], screen: { position: 'top' } },
    });
    renderDesigner();
    await waitFor(() => {
      expect(screen.getByText('Seat Designer')).toBeInTheDocument();
      expect(screen.getByText('Main Hall · Floor 1')).toBeInTheDocument();
    });
  });

  it('allows adding a row', async () => {
    api.getTheater.mockResolvedValue({
      id: 'th1', name: 'T', location: '',
      seatLayout: { rows: [], screen: { position: 'top' } },
    });
    renderDesigner();
    await waitFor(() => screen.getByText('+ Add Row (A)'));

    await userEvent.click(screen.getByText('+ Add Row (A)'));
    expect(screen.getByText('Row A')).toBeInTheDocument();
  });

  it('allows removing a row', async () => {
    api.getTheater.mockResolvedValue({
      id: 'th1', name: 'T', location: '',
      seatLayout: { rows: [{ label: 'A', seats: [{ id: 'A1' }, { id: 'A2' }] }], screen: { position: 'top' } },
    });
    renderDesigner();
    await waitFor(() => screen.getByText('Row A'));

    await userEvent.click(screen.getByText('✕ Row'));
    expect(screen.queryByText('Row A')).not.toBeInTheDocument();
  });

  it('saves layout', async () => {
    api.getTheater.mockResolvedValue({
      id: 'th1', name: 'T', location: '',
      seatLayout: { rows: [], screen: { position: 'top' } },
    });
    api.updateTheater.mockResolvedValue({});
    renderDesigner();
    await waitFor(() => screen.getByText('💾 Save Layout'));

    await userEvent.click(screen.getByText('💾 Save Layout'));
    await waitFor(() => {
      expect(api.updateTheater).toHaveBeenCalled();
    });
  });

  it('shows error on save failure', async () => {
    api.getTheater.mockResolvedValue({
      id: 'th1', name: 'T', location: '',
      seatLayout: { rows: [], screen: { position: 'top' } },
    });
    api.updateTheater.mockRejectedValue(new Error('Save failed'));
    renderDesigner();
    await waitFor(() => screen.getByText('💾 Save Layout'));

    await userEvent.click(screen.getByText('💾 Save Layout'));
    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });

  it('shows back button', async () => {
    api.getTheater.mockResolvedValue({
      id: 'th1', name: 'T', location: '',
      seatLayout: { rows: [], screen: { position: 'top' } },
    });
    renderDesigner();
    await waitFor(() => screen.getByText('← Back'));
    await userEvent.click(screen.getByText('← Back'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/theaters');
  });
});
