import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import SeatGrid from '../../components/SeatGrid';

export default function ShowBookings() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blockSeats, setBlockSeats] = useState([]);
  const [blocking, setBlocking] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const result = await api.getShowBookings(id);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleBlockSeats = async () => {
    if (blockSeats.length === 0) return;
    if (!confirm(`Mark ${blockSeats.length} seat(s) as unavailable? This cannot be undone.`)) return;
    setBlocking(true);
    try {
      await api.blockSeats(id, blockSeats);
      setBlockSeats([]);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBlocking(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!confirm('Cancel this booking? Seats will become available again.')) return;
    try {
      await api.cancelBooking(bookingId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /><p>Loading bookings...</p></div>;
  if (!data) return <div className="alert error">Show not found</div>;

  const { show, bookings } = data;

  const confirmedBooked = new Set(
    bookings.filter((b) => b.status === 'confirmed').flatMap((b) => b.seats)
  );

  const layout = show?.theater?.seatLayout;
  const allSeatIds = layout?.rows?.flatMap((r) => r.seats.map((s) => s.id)) || [];
  const blockedIds = layout?.rows?.flatMap((r) => r.seats.filter((s) => s.blocked).map((s) => s.id)) || [];
  const totalAvailSeats = allSeatIds.filter((s) => !blockedIds.includes(s)).length;

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Show Bookings</h1>
          <p className="subtitle">
            {show?.movie?.title || 'Movie'} · {show?.showDate} at {show?.showTime} · ₹{show?.price} per seat
          </p>
        </div>
        <div className="btn-group">
          {show?.slug && (
            <button
              className="btn btn-sm"
              onClick={() => {
                const url = `${window.location.origin}${import.meta.env.BASE_URL}#/book/${show.slug}`;
                navigator.clipboard.writeText(url);
                const btn = document.activeElement;
                if (btn) {
                  btn.textContent = '✓ Copied!';
                  setTimeout(() => { btn.textContent = '🔗 Copy Link'; }, 2000);
                }
              }}
            >
              🔗 Copy Link
            </button>
          )}
          <Link to="/admin/shows" className="btn btn-sm btn-ghost">← Shows</Link>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="booking-stats">
        <div className="stat-pill">
          <span className="lbl">Total:</span>
          <span className="num">{totalAvailSeats}</span>
        </div>
        <div className="stat-pill">
          <span className="lbl">Booked:</span>
          <span className="num">{confirmedBooked.size}</span>
        </div>
        <div className="stat-pill">
          <span className="lbl">Available:</span>
          <span className="num">{totalAvailSeats - confirmedBooked.size}</span>
        </div>
        <div className="stat-pill">
          <span className="lbl">Occupancy:</span>
          <span className="num">{totalAvailSeats > 0 ? Math.round((confirmedBooked.size / totalAvailSeats) * 100) : 0}%</span>
        </div>
      </div>

      <div className="booking-split">
        <div className="card card-glow">
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <h3>🎪 Seat Map</h3>
            {blockSeats.length > 0 && (
              <button
                className="btn btn-sm btn-warning"
                onClick={handleBlockSeats}
                disabled={blocking}
              >
                {blocking ? 'Blocking...' : `🚫 Block ${blockSeats.length} Seat(s)`}
              </button>
            )}
          </div>
          <SeatGrid
            layout={layout}
            available={[]}
            booked={[...confirmedBooked, ...blockedIds]}
            selected={blockSeats}
            onToggle={(seatId) => {
              setBlockSeats((prev) =>
                prev.includes(seatId)
                  ? prev.filter((s) => s !== seatId)
                  : [...prev, seatId]
              );
            }}
          />
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 20px 0' }}>
            <h3>📋 Bookings ({bookings.length})</h3>
          </div>
          <div className="table-wrapper" style={{ marginTop: 12 }}>
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>Seats</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const initials = b.customerName?.slice(0, 2).toUpperCase() || '?';
                  return (
                    <tr key={b.id}>
                      <td><code className="mono">{b.id}</code></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="customer-avatar">{initials}</span>
                          {b.customerName}
                        </div>
                      </td>
                      <td>{b.mobile}</td>
                      <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{b.seats?.join(', ')}</td>
                      <td>₹{b.totalAmount}</td>
                      <td><span className={`badge ${b.status}`}>{b.status}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {b.createdAt ? new Date(b.createdAt).toLocaleString() : '-'}
                      </td>
                      <td>
                        {b.status === 'confirmed' && (
                          <button className="btn btn-xs btn-danger" onClick={() => handleCancel(b.id)}>
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {bookings.length === 0 && (
                  <tr><td colSpan="8" className="empty">No bookings yet for this show.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
