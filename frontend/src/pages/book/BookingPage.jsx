import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { getYoutubeThumbnail } from '../../services/utils';
import SeatGrid from '../../components/SeatGrid';

export default function BookingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ name: '', mobile: '' });
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getShowBySlug(slug);
        setShow(data);
      } catch (err) {
        setError('Show not found or has expired.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const toggleSeat = (seatId) => {
    setSelected((prev) =>
      prev.includes(seatId)
        ? prev.filter((s) => s !== seatId)
        : [...prev, seatId]
    );
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (selected.length === 0) {
      setBookingError('Please select at least one seat.');
      return;
    }
    if (!form.name.trim()) {
      setBookingError('Please enter your name.');
      return;
    }
    if (!form.mobile.trim()) {
      setBookingError('Please enter your mobile number.');
      return;
    }
    setBooking(true);
    setBookingError('');

    try {
      const result = await api.createBooking({
        showId: show.id,
        seats: selected,
        customerName: form.name,
        mobile: form.mobile,
      });
      navigate(`/booking/${result.id}/success`, { state: { booking: result } });
    } catch (err) {
      setBookingError(err.message);
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading show details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-page">
        <div className="user-container" style={{ textAlign: 'center', paddingTop: 80 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🎭</p>
          <h1 style={{ marginBottom: 12 }}>Show Not Found</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
            {error} This booking link may be invalid or the show has expired.
          </p>
        </div>
      </div>
    );
  }

  const movie = show.movie;
  const theater = show.theater;
  const totalAmount = show.price * selected.length;

  return (
    <div className="user-page">
      <div className="user-container">
        {/* Hero Section */}
        <div className="booking-hero">
          {(movie?.youtube || movie?.poster) ? (
            <img
              src={getYoutubeThumbnail(movie.youtube || movie.poster)}
              alt={movie.title}
              className="poster"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div
              className="poster"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                background: 'var(--bg-surface)',
              }}
            >
              🎬
            </div>
          )}
          <div className="hero-info">
            <h1>{movie?.title || 'Movie'}</h1>
            <div className="movie-meta">
              {movie?.language && <span className="tag">{movie.language}</span>}
              {movie?.duration > 0 && <span className="tag">{movie.duration} min</span>}
              {movie?.youtube && <a href={movie.youtube} target="_blank" rel="noopener noreferrer" className="tag" style={{ textDecoration: 'none' }}>▶ Watch Trailer</a>}
            </div>
            {movie?.description && <p className="desc">{movie.description}</p>}
            <div className="show-details">
              <div className="detail-item">
                <div className="detail-label">Date</div>
                <div className="detail-value">{show.showDate}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Time</div>
                <div className="detail-value">{show.showTime}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Theater</div>
                <div className="detail-value">{theater?.name || 'Theater'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Price</div>
                <div className="detail-value">₹{show.price}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Seat Selection */}
        <div className="booking-form-section">
          <div className="section-title">
            <span className="step">1</span> Select Your Seats
          </div>
          <div className="card card-glow">
            <SeatGrid
              layout={theater?.seatLayout}
              available={show.seats?.available || []}
              booked={show.seats?.booked || []}
              selected={selected}
              onToggle={toggleSeat}
            />
          </div>
        </div>

        {/* Booking Form */}
        <div className="booking-form-section" style={{ marginTop: 24 }}>
          <div className="section-title">
            <span className="step">2</span> Confirm Your Booking
          </div>
          <div className="card">
            <div className="selected-summary">
              <div className="selected-seats">
                Selected: <strong>{selected.length > 0 ? selected.join(', ') : 'None'}</strong>
              </div>
              <div className="selected-total">
                ₹{totalAmount}
              </div>
            </div>

            {bookingError && <div className="alert error">✕ {bookingError}</div>}

            <form onSubmit={handleBooking}>
              <div className="form-row">
                <div className="form-group">
                  <label>Your Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    required
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-xl"
                disabled={booking || selected.length === 0}
                style={{ marginTop: 20 }}
              >
                {booking ? (
                  <>
                    <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                    Booking...
                  </>
                ) : selected.length === 0 ? (
                  'Select Seats First'
                ) : (
                  `🎟️ Book Now - ₹${totalAmount}`
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
