import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import('../../context/AuthContext');

function renderProtected(overrides = {}) {
  return render(
    <MemoryRouter>
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('shows loading spinner when auth is loading', () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    renderProtected();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    useAuth.mockReturnValue({ user: { username: 'admin' }, loading: false });
    renderProtected();
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /admin/login when user is null', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderProtected();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});
