import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

const emptyForm = { theaterId: '', movieId: '', showDate: '', showTime: '', price: '' };

export default function Shows() {
  const [shows, setShows] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      const [s, t, m] = await Promise.all([api.getShows(), api.getTheaters(), api.getMovies()]);
      setShows(s);
      setTheaters(t);
      setMovies(m);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (show) => {
    setForm({
      theaterId: show.theaterId || '',
      movieId: show.movieId || '',
      showDate: show.showDate || '',
      showTime: show.showTime || '',
      price: String(show.price || ''),
    });
    setEditId(show.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const payload = { ...form, price: parseFloat(form.price) || 0 };
      if (editId) {
        await api.updateShow(editId, payload);
      } else {
        await api.createShow(payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this show? All bookings will be permanently removed.')) return;
    try {
      await api.deleteShow(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const copyLink = (slug) => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}#/book/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.activeElement;
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      }
    });
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Shows</h1>
          <p className="subtitle">Schedule movies at your theaters</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? '✕ Cancel' : '+ New Show'}
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {showForm && (
        <form className="card form-card animate-slide-up" onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: 16 }}>{editId ? 'Edit Show' : 'Schedule a New Show'}</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Theater *</label>
              <select value={form.theaterId} onChange={(e) => setForm({ ...form, theaterId: e.target.value })} required>
                <option value="">Select a theater</option>
                {theaters.filter((t) => t.active).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Movie *</label>
              <select value={form.movieId} onChange={(e) => setForm({ ...form, movieId: e.target.value })} required>
                <option value="">Select a movie</option>
                {movies.filter((m) => m.active).map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input type="date" value={form.showDate} onChange={(e) => setForm({ ...form, showDate: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Time *</label>
              <input type="time" value={form.showTime} onChange={(e) => setForm({ ...form, showTime: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Price (₹)</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g., 150" />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">{editId ? 'Update Show' : 'Create Show'}</button>
            <button type="button" className="btn" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      {shows.length === 0 && !loading && (
        <div className="card text-center" style={{ padding: 48 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📅</p>
          <p style={{ color: 'var(--text-muted)' }}>No shows scheduled yet.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Create a show to start selling tickets.</p>
        </div>
      )}

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
                <th>Booking Link</th>
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
                    {show.slug ? (
                      <button className="btn btn-sm" onClick={() => copyLink(show.slug)} title="Copy public booking link">
                        🔗 Copy Link
                      </button>
                    ) : '—'}
                  </td>
                  <td>
                    <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn btn-sm" onClick={() => openEdit(show)}>✏️ Edit</button>
                      <Link to={`/admin/shows/${show.id}/bookings`} className="btn btn-sm">
                        📋 Bookings
                      </Link>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(show.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
