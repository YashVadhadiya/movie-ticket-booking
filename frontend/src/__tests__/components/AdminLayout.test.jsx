import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import('../../context/AuthContext');

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminLayout />
    </MemoryRouter>
  );
}

describe('AdminLayout', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: { username: 'admin' },
      logout: vi.fn(),
    });
  });

  it('renders brand text', () => {
    renderLayout();
    expect(screen.getByText('Mini Theater')).toBeInTheDocument();
    expect(screen.getByText('Booking System')).toBeInTheDocument();
  });

  it('renders username and role', () => {
    renderLayout();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('renders all nav links in sidebar and mobile nav', () => {
    renderLayout();
    const sidebar = document.querySelector('.sidebar-nav');
    const mobileNav = document.querySelector('.mobile-bottom-nav');
    expect(within(sidebar).getByText('Dashboard')).toBeInTheDocument();
    expect(within(sidebar).getByText('Theaters')).toBeInTheDocument();
    expect(within(sidebar).getByText('Movies')).toBeInTheDocument();
    expect(within(sidebar).getByText('Shows')).toBeInTheDocument();
    expect(within(sidebar).getByText('SMS Logs')).toBeInTheDocument();
    expect(within(mobileNav).getAllByText('Dashboard')).toHaveLength(1);
  });

  it('renders logout button in sidebar and mobile nav', () => {
    renderLayout();
    const logoutBtns = screen.getAllByText('Logout');
    expect(logoutBtns).toHaveLength(2);
  });

  it('shows user initials in avatar', () => {
    renderLayout();
    expect(screen.getByText('AD')).toBeInTheDocument();
  });

  it('renders mobile bottom nav', () => {
    renderLayout();
    const mobileNav = document.querySelector('.mobile-bottom-nav');
    expect(mobileNav).toBeInTheDocument();
  });
});
