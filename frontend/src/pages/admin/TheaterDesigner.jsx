import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import SeatGrid from '../../components/SeatGrid';

export default function TheaterDesigner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [theater, setTheater] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [layout, setLayout] = useState({ rows: [], screen: { position: 'top' } });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getTheater(id);
        setTheater(data);
        setLayout(data.seatLayout || { rows: [], screen: { position: 'top' } });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const addRow = () => {
    const label = String.fromCharCode(65 + layout.rows.length);
    const newRow = {
      label,
      seats: Array.from({ length: 8 }, (_, i) => ({
        id: `${label}${i + 1}`,
        blocked: false,
      })),
    };
    setLayout({ ...layout, rows: [...layout.rows, newRow] });
  };

  const removeRow = (rowIdx) => {
    const rows = layout.rows.filter((_, i) => i !== rowIdx);
    setLayout({ ...layout, rows });
  };

  const addSeat = (rowIdx) => {
    const rows = [...layout.rows];
    const row = { ...rows[rowIdx] };
    const nextNum = row.seats.length + 1;
    row.seats = [...row.seats, { id: `${row.label}${nextNum}`, blocked: false }];
    rows[rowIdx] = row;
    setLayout({ ...layout, rows });
  };

  const removeSeat = (rowIdx) => {
    const rows = [...layout.rows];
    const row = { ...rows[rowIdx] };
    if (row.seats.length <= 1) return;
    row.seats = row.seats.slice(0, -1);
    rows[rowIdx] = row;
    setLayout({ ...layout, rows });
  };

  const toggleBlocked = (rowIdx, seatIdx) => {
    const rows = [...layout.rows];
    const seats = [...rows[rowIdx].seats];
    seats[seatIdx] = { ...seats[seatIdx], blocked: !seats[seatIdx].blocked };
    rows[rowIdx] = { ...rows[rowIdx], seats };
    setLayout({ ...layout, rows });
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api.updateTheater(id, { seatLayout: layout });
      setTimeout(() => setSaving(false), 600);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const allSeatIds = layout.rows.flatMap((r) => r.seats.map((s) => s.id));
  const blockedIds = layout.rows.flatMap((r) => r.seats.filter((s) => s.blocked).map((s) => s.id));
  const availableIds = allSeatIds.filter((s) => !blockedIds.includes(s));

  if (loading) return <div className="loading"><div className="spinner" /><p>Loading theater...</p></div>;
  if (!theater) return <div className="alert error">Theater not found</div>;

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Seat Designer</h1>
          <p className="subtitle">{theater.name} · {theater.location || 'No location set'}</p>
        </div>
        <div className="btn-group">
          <button
            className={`btn ${saving ? 'btn-success' : 'btn-primary'}`}
            onClick={save}
            disabled={saving}
          >
            {saving ? '✓ Saved!' : '💾 Save Layout'}
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/admin/theaters')}>
            ← Back
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="designer-layout">
        <div className="card designer-preview card-glow">
          <SeatGrid
            layout={layout}
            available={availableIds}
            booked={blockedIds}
            selected={[]}
            onToggle={(seatId) => {
              const parts = seatId.match(/([A-Z]+)(\d+)/);
              if (!parts) return;
              const rowLabel = parts[1];
              const seatNum = parseInt(parts[2]);
              const ri = layout.rows.findIndex((r) => r.label === rowLabel);
              if (ri === -1) return;
              const si = layout.rows[ri].seats.findIndex((s) => s.id === seatId);
              if (si === -1) return;
              toggleBlocked(ri, si);
            }}
          />
        </div>

        <div className="designer-tools">
          <div className="card">
            <h3>🎛️ Controls</h3>
            <p className="subtitle" style={{ marginBottom: 16, fontSize: 13 }}>
              {layout.rows.length} rows · {allSeatIds.length} total seats · {availableIds.length} available
            </p>

            <div className="row-list">
              {layout.rows.map((row, ri) => (
                <div key={ri} className="row-item">
                  <div>
                    <div className="row-label">Row {row.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {row.seats.length} seats
                    </div>
                  </div>
                  <div className="btn-group">
                    <button className="btn btn-xs" onClick={() => addSeat(ri)} title="Add seat">
                      +1
                    </button>
                    <button
                      className="btn btn-xs btn-danger"
                      onClick={() => removeSeat(ri)}
                      disabled={row.seats.length <= 1}
                      title="Remove seat"
                    >
                      −1
                    </button>
                    <button
                      className="btn btn-xs btn-danger"
                      onClick={() => removeRow(ri)}
                      title="Remove row"
                    >
                      ✕ Row
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-full" onClick={addRow} style={{ marginBottom: 16 }}>
              + Add Row ({String.fromCharCode(65 + layout.rows.length)})
            </button>

            <div className="legend-box">
              <p><span className="legend-dot green" /> Available — click to block</p>
              <p><span className="legend-dot grey" /> Blocked — click to unblock</p>
              <p className="hint" style={{ marginTop: 8 }}>Click any seat in the preview to toggle blocked/unblocked</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
