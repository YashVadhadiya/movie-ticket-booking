import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SmsLogs from '../../../pages/admin/SmsLogs';

const mockOpen = vi.fn();
vi.stubGlobal('open', mockOpen);

vi.mock('../../../services/api', () => ({
  api: {
    getSmsLogs: vi.fn(),
    retrySms: vi.fn(),
  },
}));

const { api } = await import('../../../services/api');

function renderSmsLogs() {
  return render(
    <MemoryRouter>
      <SmsLogs />
    </MemoryRouter>
  );
}

describe('SmsLogs page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOpen.mockReset();
  });

  it('shows loading initially', () => {
    api.getSmsLogs.mockReturnValue(new Promise(() => {}));
    renderSmsLogs();
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  it('renders SMS log list', async () => {
    api.getSmsLogs.mockResolvedValue([
      { id: 'log1', bookingId: 'bk1', mobile: '1234567890', message: 'Your ticket is confirmed for Inception on 2025-12-25 at 18:00.', status: 'logged', createdAt: new Date().toISOString() },
    ]);
    renderSmsLogs();
    await waitFor(() => {
      expect(screen.getByText(/📝 Logged/)).toBeInTheDocument();
      expect(screen.getByText('1234567890')).toBeInTheDocument();
    });
  });

  it('shows empty state', async () => {
    api.getSmsLogs.mockResolvedValue([]);
    renderSmsLogs();
    await waitFor(() => {
      expect(screen.getByText('No message logs yet.')).toBeInTheDocument();
    });
  });

  it('handles retry WhatsApp', async () => {
    api.getSmsLogs.mockResolvedValue([
      { id: 'log1', bookingId: 'bk1', mobile: '1234567890', message: 'Test msg', status: 'logged', createdAt: new Date().toISOString() },
    ]);
    api.retrySms.mockResolvedValue({ whatsappUrl: 'https://wa.me/1234567890?text=Hello' });
    renderSmsLogs();
    await waitFor(() => screen.getByText('📱 Send WhatsApp'));
    await userEvent.click(screen.getByText('📱 Send WhatsApp'));
    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith('https://wa.me/1234567890?text=Hello', '_blank');
    });
  });

  it('shows error on failure', async () => {
    api.getSmsLogs.mockRejectedValue(new Error('Failed to load'));
    renderSmsLogs();
    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('shows info note about WhatsApp', async () => {
    api.getSmsLogs.mockResolvedValue([]);
    renderSmsLogs();
    await waitFor(() => {
      expect(screen.getByText(/WhatsApp click-to-chat/)).toBeInTheDocument();
    });
  });
});
