import { useLocation, Link } from 'react-router-dom';

export default function Success() {
  const location = useLocation();
  const booking = location.state?.booking;

  if (!booking) {
    return (
      <div className="success-page">
        <div className="success-container">
          <div className="success-card card">
            <p style={{ fontSize: 48, marginBottom: 16 }}>🎭</p>
            <h1>Booking details not found</h1>
            <p className="success-subtitle">
              This page needs a valid booking reference.
            </p>
            <Link to="/" className="btn btn-primary">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-card card animate-scale-in">
          <div className="success-checkmark">✓</div>

          <h1>Booking Confirmed!</h1>
          <p className="success-subtitle">
            Your ticket has been booked successfully.
            <br />
            Confirmation has been sent to your mobile.
          </p>

          {/* Ticket */}
          <div className="ticket-card animate-slide-up">
            <div className="ticket-header">
              <div className="movie-name">{booking.movieTitle || 'Movie'}</div>
              <div className="theater-name">{booking.theaterName || 'Theater'}</div>
            </div>

            <div className="ticket-row">
              <span className="ticket-label">🆔 Booking ID</span>
              <span className="ticket-value mono">{booking.id}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">📅 Date</span>
              <span className="ticket-value">{booking.showDate}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">⏰ Time</span>
              <span className="ticket-value">{booking.showTime}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">🪑 Seat(s)</span>
              <span className="ticket-value highlight">{booking.seats?.join(', ')}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">👤 Customer</span>
              <span className="ticket-value">{booking.customerName}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">📱 Mobile</span>
              <span className="ticket-value">{booking.mobile}</span>
            </div>
            <div className="ticket-row" style={{ borderTop: '2px dashed var(--border-subtle)', marginTop: 8, paddingTop: 14 }}>
              <span className="ticket-label" style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 700 }}>Total Paid</span>
              <span className="ticket-value highlight" style={{ fontSize: 20 }}>₹{booking.totalAmount}</span>
            </div>
          </div>

          {/* WhatsApp CTA */}
          {booking.whatsappUrl && (
            <div className="success-whatsapp animate-fade-in">
              <a
                href={booking.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success btn-full btn-lg"
              >
                📱 Send Confirmation to WhatsApp
              </a>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                Opens WhatsApp with your ticket details pre-filled
              </p>
            </div>
          )}

          <p className="success-footer">
            Please show the booking ID at the counter. <br />
            Thank you for booking with {booking.theaterName || 'Mini Theater'}!
          </p>
        </div>
      </div>
    </div>
  );
}
