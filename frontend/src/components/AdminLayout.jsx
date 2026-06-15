import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/theaters', label: 'Theaters', icon: '🏗️' },
  { to: '/admin/movies', label: 'Movies', icon: '🎬' },
  { to: '/admin/shows', label: 'Shows', icon: '📅' },
  { to: '/admin/sms-logs', label: 'SMS Logs', icon: '📋' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">🎭</div>
          <div className="brand-text">
            Mini Theater
            <span>Booking System</span>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.username}</div>
            <div className="user-role">Administrator</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <span>🚪</span> Logout
        </button>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>

      <nav className="mobile-bottom-nav">
        <div className="nav-items">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `m-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="m-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button className="m-nav-item" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <span className="m-nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
