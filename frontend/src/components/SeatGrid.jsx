const SeatGrid = ({ layout, available, booked, selected, onToggle, readOnly, compact }) => {
  if (!layout || !layout.rows || layout.rows.length === 0) {
    return (
      <div className="no-seats">
        <p>No seat layout defined</p>
        <p style={{ fontSize: 13, marginTop: 8 }}>Design seats in the Theater settings</p>
      </div>
    );
  }

  const bookedSet = new Set(booked || []);
  const availableSet = new Set(available || []);

  return (
    <div className="seat-container">
      <div className="screen-area">
        <div className="screen-curve" />
        <div className="screen-label">Screen</div>
      </div>

      <div className="seat-grid">
        {layout.rows.map((row, ri) => {
          const walkwayAfter = layout.walkwayAfter && layout.walkwayAfter[ri];

          return (
            <div key={row.label}>
              <div className="seat-row">
                <span className="row-label">{row.label}</span>
                <div className="seats">
                  {row.seats.map((seat) => {
                    const seatId = seat.id;
                    const isBlocked = seat.blocked;
                    const isBooked = !isBlocked && bookedSet.has(seatId);
                    const isAvailable = !isBlocked && !isBooked;
                    const isSelected = selected && selected.includes(seatId);

                    let cls = 'seat';
                    if (isBlocked) cls += ' blocked';
                    else if (isBooked) cls += ' booked';
                    else if (isSelected) cls += ' selected';
                    else if (isAvailable) cls += ' available';

                    return (
                      <button
                        key={seatId}
                        className={cls}
                        disabled={isBlocked || isBooked || readOnly}
                        onClick={() => onToggle && !isBlocked && !isBooked && onToggle(seatId)}
                        title={`${seatId}${isBlocked ? ' (blocked)' : isBooked ? ' (booked)' : ''}`}
                        style={compact ? { width: 32, height: 28, fontSize: 8 } : {}}
                      >
                        {seatId.replace(row.label, '')}
                      </button>
                    );
                  })}
                </div>
                <span className="row-label right">{row.label}</span>
              </div>
              {walkwayAfter && <div className="walkway" />}
            </div>
          );
        })}
      </div>

      <div className="seat-legend">
        <span>
          <span className="legend-swatch green" />
          Available
        </span>
        <span>
          <span className="legend-swatch amber" />
          Selected
        </span>
        <span>
          <span className="legend-swatch red" />
          Booked
        </span>
        <span>
          <span className="legend-swatch grey" />
          Blocked
        </span>
      </div>
    </div>
  );
};

export default SeatGrid;
