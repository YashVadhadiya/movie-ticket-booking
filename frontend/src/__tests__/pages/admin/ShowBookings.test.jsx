import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ShowBookings from '../../../pages/admin/ShowBookings';

const mockClipboard = { writeText: vi.fn().mockResolvedValue() };
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard, configurable: true, writable: true,
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: () => ({ id: 'sh1' }) };
});

vi.mock('../../../services/api', () => ({
  api: {
    getShowBookings: vi.fn(),
    blockSeats: vi.fn(),
    cancelBooking: vi.fn(),
  },
}));

const { api } = await import('../../../services/api');

function renderShowBookings() {
  return render(
    <MemoryRouter>
      <ShowBookings />
    </MemoryRouter>
  );
}

const showData = {
  show: {
    id: 'sh1', slug: 'test-slug',
    movie: { id: 'mv1', title: 'Inception' },
    theater: {
      id: 'th1', name: 'Main Hall',
      seatLayout: {
        screen: { position: 'top' },
        rows: [
          { label: 'A', seats: [{ id: 'A1' }, { id: 'A2' }, { id: 'A3', blocked: true }] },
          { label: 'B', seats: [{ id: 'B1' }, { id: 'B2' }] },
        ],
      },
    },
    showDate: '2025-12-25', showTime: '18:00', price: 10,
  },
  bookings: [
    { id: 'bk1', customerName: 'John Doe', mobile: '1234567890', seats: ['A1'], totalAmount: 10, status: 'confirmed', createdAt: new Date().toISOString() },
  ],
};

describe('ShowBookings page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading initially', () => {
    api.getShowBookings.mockReturnValue(new Promise(() => {}));
    renderShowBookings();
    expect(screen.getByText('Loading bookings...')).toBeInTheDocument();
  });

  it('renders show details and bookings', async () => {
    api.getShowBookings.mockResolvedValue(showData);
    renderShowBookings();
    await waitFor(() => {
      expect(screen.getByText(/Inception/)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.getByText('1234567890')).toBeInTheDocument();
    });
  });

  it('shows booking stats', async () => {
    api.getShowBookings.mockResolvedValue(showData);
    renderShowBookings();
    await waitFor(() => {
      expect(screen.getByText('Booked:')).toBeInTheDocument();
      expect(screen.getByText('Available:')).toBeInTheDocument();
    });
  });

  it('shows empty bookings message', async () => {
    api.getShowBookings.mockResolvedValue({
      show: showData.show, bookings: [],
    });
    renderShowBookings();
    await waitFor(() => {
      expect(screen.getByText('No bookings yet for this show.')).toBeInTheDocument();
    });
  });

  it('copies booking link', async () => {
    api.getShowBookings.mockResolvedValue(showData);
    renderShowBookings();
    await waitFor(() => screen.getByText('🔗 Copy Link'));
    await userEvent.click(screen.getByText('🔗 Copy Link'));
    expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/book/test-slug'));
  });

  it('blocks selected seats', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    api.getShowBookings.mockResolvedValue(showData);
    api.blockSeats.mockResolvedValue({});
    renderShowBookings();
    await waitFor(() => screen.getByText(/📋 Bookings/));
    const seatBtn = screen.getByTitle('A2');
    await userEvent.click(seatBtn);
    expect(screen.getByText('🚫 Block 1 Seat(s)')).toBeInTheDocument();
    await userEvent.click(screen.getByText('🚫 Block 1 Seat(s)'));
    await waitFor(() => {
      expect(api.blockSeats).toHaveBeenCalled();
    });
  });
});
