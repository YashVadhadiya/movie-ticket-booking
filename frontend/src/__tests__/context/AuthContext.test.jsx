import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../context/AuthContext';

const apiModule = await import('../../services/api');

function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="user">{auth.user ? auth.user.username : 'null'}</span>
      <span data-testid="loading">{auth.loading ? 'true' : 'false'}</span>
      <button data-testid="login-btn" onClick={() => auth.login('admin', 'pass')}>Login</button>
      <button data-testid="logout-btn" onClick={auth.logout}>Logout</button>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('shows loading initially when token exists', async () => {
    localStorage.setItem('admin_token', 'some-token');
    apiModule.api.verifyToken = vi.fn().mockResolvedValue({ username: 'admin' });
    renderWithAuth();
    expect(screen.getByTestId('loading').textContent).toBe('true');
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });

  it('sets user when token is verified', async () => {
    localStorage.setItem('admin_token', 'valid-token');
    apiModule.api.verifyToken = vi.fn().mockResolvedValue({ username: 'admin' });
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('admin');
    });
  });

  it('clears token when verification fails', async () => {
    localStorage.setItem('admin_token', 'invalid-token');
    apiModule.api.verifyToken = vi.fn().mockRejectedValue(new Error('Invalid'));
    renderWithAuth();
    await waitFor(() => {
      expect(localStorage.getItem('admin_token')).toBeNull();
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  it('sets user to null when no token exists', async () => {
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  it('calls api.login and sets user on login', async () => {
    apiModule.api.login = vi.fn().mockResolvedValue({ token: 'new-token', username: 'newadmin' });
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await userEvent.click(screen.getByTestId('login-btn'));
    await waitFor(() => {
      expect(localStorage.getItem('admin_token')).toBe('new-token');
      expect(screen.getByTestId('user').textContent).toBe('newadmin');
    });
  });

  it('clears user and token on logout', async () => {
    localStorage.setItem('admin_token', 'some-token');
    apiModule.api.verifyToken = vi.fn().mockResolvedValue({ username: 'admin' });
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('admin'));

    await userEvent.click(screen.getByTestId('logout-btn'));
    expect(localStorage.getItem('admin_token')).toBeNull();
    expect(screen.getByTestId('user').textContent).toBe('null');
  });
});
