import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function Theaters() {
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', location: '' });

  const load = async () => {
    try {
      setError('');
      setLoading(true);
      const data = await api.getTheaters();
      setTheaters(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.createTheater(form);
      setForm({ name: '', location: '' });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this theater? This cannot be undone.')) return;
    try {
      await api.deleteTheater(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Theaters</h1>
          <p className="subtitle">Manage your theater venues and seat layouts</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm(!showForm); setForm({ name: '', location: '' }); }}
        >
          {showForm ? '✕ Cancel' : '+ New Theater'}
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {showForm && (
        <form className="card form-card animate-slide-up" onSubmit={handleCreate}>
          <h3 style={{ marginBottom: 16 }}>Create New Theater</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Theater Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g., Main Hall"
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., Ground Floor"
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Create Theater</button>
            <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {theaters.map((t) => {
                const totalSeats = t.seatLayout?.rows?.reduce((sum, r) => sum + r.seats.length, 0) || 0;
                const availableSeats = t.seatLayout?.rows?.reduce(
                  (sum, r) => sum + r.seats.filter((s) => !s.blocked).length, 0
                ) || 0;

                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td>{t.location || '—'}</td>
                    <td>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{availableSeats}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> / {totalSeats}</span>
                    </td>
                    <td>
                      <span className={`badge ${t.active ? 'active' : 'inactive'}`}>
                        {t.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                        <Link to={`/admin/theaters/${t.id}/design`} className="btn btn-sm">
                          🪑 Design
                        </Link>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {theaters.length === 0 && (
                <tr><td colSpan="5" className="empty">No theaters yet. Create your first theater!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
