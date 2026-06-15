import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { getYoutubeId, getYoutubeThumbnail } from '../../services/utils';

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', youtube: '', duration: '', language: '', description: '' });

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.getMovies();
      setMovies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ title: '', youtube: '', duration: '', language: '', description: '' });
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (movie) => {
    setForm({
      title: movie.title,
      youtube: movie.youtube || '',
      duration: String(movie.duration || ''),
      language: movie.language || '',
      description: movie.description || '',
    });
    setEditId(movie.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const payload = { ...form, poster: '', duration: parseInt(form.duration) || 0 };
      if (editId) {
        await api.updateMovie(editId, payload);
      } else {
        await api.createMovie(payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this movie?')) return;
    try {
      await api.deleteMovie(id);
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
          <h1>Movies</h1>
          <p className="subtitle">Manage your movie catalog</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { resetForm(); setShowForm(!showForm); }}
        >
          {showForm ? '✕ Cancel' : '+ Add Movie'}
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {showForm && (
        <form className="card form-card animate-slide-up" onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: 16 }}>{editId ? 'Edit Movie' : 'Add New Movie'}</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Movie title"
              />
            </div>
            <div className="form-group">
              <label>Duration (min)</label>
              <input
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="e.g., 120"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Language</label>
              <input
                type="text"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                placeholder="e.g., Hindi, English"
              />
            </div>
            <div className="form-group">
              <label>YouTube Link (trailer)</label>
              <input
                type="url"
                value={form.youtube}
                onChange={(e) => setForm({ ...form, youtube: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Brief description of the movie..."
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editId ? 'Update Movie' : 'Add Movie'}
            </button>
            <button type="button" className="btn" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      {movies.length === 0 && !loading && (
        <div className="card text-center" style={{ padding: 48 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🎬</p>
          <p style={{ color: 'var(--text-muted)' }}>No movies in the catalog yet.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Add your first movie to get started.</p>
        </div>
      )}

      <div className="movie-grid">
        {movies.map((m) => {
          const ytThumb = getYoutubeThumbnail(m.youtube || m.poster);
          const ytId = getYoutubeId(m.youtube || m.poster);
          return (
          <div key={m.id} className="movie-card card card-glow">
            {ytThumb ? (
              <a href={m.youtube || m.poster} target="_blank" rel="noopener noreferrer" title="Watch trailer on YouTube">
                <img
                  src={ytThumb}
                  alt={m.title}
                  className="movie-poster"
                  style={{ cursor: 'pointer', position: 'relative' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </a>
            ) : (
              <div className="movie-poster" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'var(--text-muted)' }}>
                🎬
              </div>
            )}
            <div className="movie-info">
              <h3>{m.title}</h3>
              <div className="meta">
                <span className="tag">{m.language || 'N/A'}</span>
                {m.duration > 0 && <span className="tag">{m.duration} min</span>}
                {ytId && <span className="tag">▶ YouTube</span>}
              </div>
              {m.description && <p className="desc">{m.description}</p>}
              <div className="btn-group">
                <button className="btn btn-sm" onClick={() => openEdit(m)}>✏️ Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m.id)}>🗑️ Delete</button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
