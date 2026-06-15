import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Success from '../../../pages/book/Success';

const mockLocation = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useLocation: () => mockLocation() };
});

function renderSuccess() {
  return render(
    <MemoryRouter>
      <Success />
    </MemoryRouter>
  );
}

describe('Success page', () => {
  beforeEach(() => {
    mockLocation.mockReset();
  });

  it('renders booking details when state is provided', () => {
    mockLocation.mockReturnValue({
      state: {
        booking: {
          id: 'bk1',
          movieTitle: 'Inception',
          theaterName: 'Main Hall',
          showDate: '2025-12-25',
          showTime: '18:00',
          seats: ['A1', 'A2'],
          customerName: 'John Doe',
          mobile: '1234567890',
          totalAmount: 20,
          whatsappUrl: 'https://wa.me/1234567890?text=Confirmed',
        },
      },
    });
    renderSuccess();
    expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
    expect(screen.getByText('Inception')).toBeInTheDocument();
    expect(screen.getByText('Main Hall')).toBeInTheDocument();
    expect(screen.getByText('bk1')).toBeInTheDocument();
    expect(screen.getByText('2025-12-25')).toBeInTheDocument();
    expect(screen.getByText('18:00')).toBeInTheDocument();
    expect(screen.getByText('A1, A2')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText('₹20')).toBeInTheDocument();
  });

  it('renders WhatsApp button when whatsappUrl is present', () => {
    mockLocation.mockReturnValue({
      state: {
        booking: {
          id: 'bk1', movieTitle: 'M', theaterName: 'T', showDate: 'D', showTime: 'T',
          seats: ['A1'], customerName: 'J', mobile: '123', totalAmount: 10,
          whatsappUrl: 'https://wa.me/123?text=Hello',
        },
      },
    });
    renderSuccess();
    const whatsappLink = screen.getByText('📱 Send Confirmation to WhatsApp');
    expect(whatsappLink.closest('a')).toHaveAttribute('href', 'https://wa.me/123?text=Hello');
  });

  it('shows fallback message when booking state is missing', () => {
    mockLocation.mockReturnValue({ state: null });
    renderSuccess();
    expect(screen.getByText('Booking details not found')).toBeInTheDocument();
  });
});
