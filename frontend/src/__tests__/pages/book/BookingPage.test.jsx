import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BookingPage from '../../../pages/book/BookingPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: () => ({ slug: 'test-slug' }), useNavigate: () => mockNavigate };
});

vi.mock('../../../services/api', () => ({
  api: {
    getShowBySlug: vi.fn(),
    createBooking: vi.fn(),
  },
}));

const { api } = await import('../../../services/api');

const showData = {
  id: 'sh1', slug: 'test-slug', showDate: '2025-12-25', showTime: '18:00', price: 10,
  movie: { id: 'mv1', title: 'Inception', language: 'English', duration: 148, description: 'A mind-bending thriller', youtube: 'https://youtu.be/dQw4w9WgXcQ' },
  theater: {
    id: 'th1', name: 'Main Hall',
    seatLayout: {
      screen: { position: 'top' },
      rows: [{ label: 'A', seats: [{ id: 'A1' }, { id: 'A2' }, { id: 'A3' }] }],
    },
  },
  seats: { available: ['A1', 'A2', 'A3'], booked: [] },
};

function renderBookingPage() {
  return render(
    <MemoryRouter>
      <BookingPage />
    </MemoryRouter>
  );
}

describe('BookingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it('shows loading initially', () => {
    api.getShowBySlug.mockReturnValue(new Promise(() => {}));
    renderBookingPage();
    expect(screen.getByText('Loading show details...')).toBeInTheDocument();
  });

  it('renders movie and show details', async () => {
    api.getShowBySlug.mockResolvedValue(showData);
    renderBookingPage();
    await waitFor(() => {
      expect(screen.getByText('Inception')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('148 min')).toBeInTheDocument();
      expect(screen.getByText('2025-12-25')).toBeInTheDocument();
      expect(screen.getAllByText(/18:00/).length).toBeGreaterThan(0);
      expect(screen.getByText('Main Hall')).toBeInTheDocument();
    });
  });

  it('shows error when show is not found', async () => {
    api.getShowBySlug.mockRejectedValue(new Error('Not found'));
    renderBookingPage();
    await waitFor(() => {
      expect(screen.getByText('Show Not Found')).toBeInTheDocument();
      expect(screen.getByText(/booking link may be invalid/)).toBeInTheDocument();
    });
  });

  it('allows selecting seats', async () => {
    api.getShowBySlug.mockResolvedValue(showData);
    renderBookingPage();

    await waitFor(() => screen.getByText('Select Your Seats'));
    await userEvent.click(screen.getByTitle('A1'));

    expect(screen.getByText(/A1/)).toBeInTheDocument();
  });

  it('shows total amount when seats selected', async () => {
    api.getShowBySlug.mockResolvedValue(showData);
    renderBookingPage();

    await waitFor(() => screen.getByText('Select Your Seats'));
    await userEvent.click(screen.getByTitle('A1'));
    await userEvent.click(screen.getByTitle('A2'));

    expect(screen.getByText('₹20')).toBeInTheDocument();
  });

  it('shows "Select Seats First" when no seats selected', async () => {
    api.getShowBySlug.mockResolvedValue(showData);
    renderBookingPage();
    await waitFor(() => {
      expect(screen.getByText('Select Seats First')).toBeInTheDocument();
    });
  });

  it('submits booking and navigates to success', async () => {
    api.getShowBySlug.mockResolvedValue(showData);
    api.createBooking.mockResolvedValue({ id: 'bk1' });
    renderBookingPage();

    await waitFor(() => screen.getByText('Select Your Seats'));
    await userEvent.click(screen.getByTitle('A1'));
    await userEvent.click(screen.getByTitle('A3'));

    await userEvent.type(screen.getByPlaceholderText('Enter your full name'), 'John Doe');
    await userEvent.type(screen.getByPlaceholderText('+91 9876543210'), '1234567890');

    await userEvent.click(screen.getByText('🎟️ Book Now - ₹20'));

    await waitFor(() => {
      expect(api.createBooking).toHaveBeenCalledWith({
        showId: 'sh1',
        seats: ['A1', 'A3'],
        customerName: 'John Doe',
        mobile: '1234567890',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/booking/bk1/success', expect.any(Object));
    });
  });

  it('shows validation error when no name', async () => {
    api.getShowBySlug.mockResolvedValue(showData);
    renderBookingPage();
    await waitFor(() => screen.getByText('Select Your Seats'));
    await userEvent.click(screen.getByTitle('A1'));
    const form = document.querySelector('form');
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText(/Please enter your name/)).toBeInTheDocument();
    });
  });

  it('shows booking error from API', async () => {
    api.getShowBySlug.mockResolvedValue(showData);
    api.createBooking.mockRejectedValue(new Error('Seats no longer available'));
    renderBookingPage();

    await waitFor(() => screen.getByText('Select Your Seats'));
    await userEvent.click(screen.getByTitle('A1'));
    await userEvent.type(screen.getByPlaceholderText('Enter your full name'), 'John');
    await userEvent.type(screen.getByPlaceholderText('+91 9876543210'), '123');
    await userEvent.click(screen.getByText('🎟️ Book Now - ₹10'));

    await waitFor(() => {
      expect(screen.getByText(/Seats no longer available/)).toBeInTheDocument();
    });
  });
});
