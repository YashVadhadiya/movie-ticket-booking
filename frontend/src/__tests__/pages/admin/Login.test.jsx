import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../../pages/admin/Login';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import('../../../context/AuthContext');

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe('Login page', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders login form', () => {
    useAuth.mockReturnValue({ login: vi.fn(), user: null });
    renderLogin();
    expect(screen.getByText('Mini Theater')).toBeInTheDocument();
    expect(screen.getByText('Sign in to manage your theater')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter admin username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter admin password')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('redirects to /admin if user is already logged in', () => {
    useAuth.mockReturnValue({ login: vi.fn(), user: { username: 'admin' } });
    renderLogin();
    expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
  });

  it('shows error on failed login', async () => {
    const loginMock = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    useAuth.mockReturnValue({ login: loginMock, user: null });
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('Enter admin username'), 'admin');
    await userEvent.type(screen.getByPlaceholderText('Enter admin password'), 'wrong');
    await userEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/)).toBeInTheDocument();
    });
  });

  it('calls login and navigates on success', async () => {
    const loginMock = vi.fn().mockResolvedValue({ token: 'abc' });
    useAuth.mockReturnValue({ login: loginMock, user: null });
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('Enter admin username'), 'admin');
    await userEvent.type(screen.getByPlaceholderText('Enter admin password'), 'pass');
    await userEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('admin', 'pass');
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  it('disables button while loading', async () => {
    const loginMock = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    useAuth.mockReturnValue({ login: loginMock, user: null });
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('Enter admin username'), 'admin');
    await userEvent.type(screen.getByPlaceholderText('Enter admin password'), 'pass');
    await userEvent.click(screen.getByText('Sign In'));

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
  });
});
