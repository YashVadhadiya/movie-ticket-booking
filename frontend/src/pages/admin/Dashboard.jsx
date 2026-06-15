import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [s, showsData] = await Promise.all([api.getStats(), api.getShows()]);
        setStats(s);
        setShows(showsData.slice(0, 5));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /><p>Loading dashboard...</p></div>;
  if (error) return <div className="alert error">{error}</div>;

  const statCards = [
    { icon: '📅', number: stats.totalShows, label: 'Active Shows' },
    { icon: '🏗️', number: stats.totalTheaters, label: 'Theaters' },
    { icon: '🎬', number: stats.totalMovies, label: 'Movies' },
    { icon: '🎫', number: stats.totalBookings, label: 'Total Bookings' },
    { icon: '💰', number: `₹${stats.totalRevenue}`, label: 'Revenue' },
    { icon: '📊', number: `${stats.occupancyRate}%`, label: 'Seat Occupancy' },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Overview of your theater operations</p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card card-glow" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="stat-icon">{card.icon}</div>
            <span className="stat-number">{card.number}</span>
            <span className="stat-label">{card.label}</span>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h2>Recent Shows</h2>
          <Link to="/admin/shows" className="btn btn-sm btn-ghost">View All →</Link>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Movie</th>
                  <th>Theater</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shows.map((show) => (
                  <tr key={show.id}>
                    <td style={{ fontWeight: 600 }}>{show.movie}</td>
                    <td>{show.theater}</td>
                    <td>{show.showDate}</td>
                    <td>{show.showTime}</td>
                    <td><span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--gold)', border: '1px solid rgba(245,158,11,0.2)' }}>₹{show.price}</span></td>
                    <td>
                      <Link to={`/admin/shows/${show.id}/bookings`} className="btn btn-sm">
                        Bookings →
                      </Link>
                    </td>
                  </tr>
                ))}
                {shows.length === 0 && (
                  <tr><td colSpan="6" className="empty">No shows yet. Create one from the Shows page.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
