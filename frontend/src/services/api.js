const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('admin_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  // Auth
  login: (username, password) =>
    request('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  verifyToken: () =>
    request('/admin/verify'),

  // Theaters
  getTheaters: () =>
    request('/theaters'),

  getTheater: (id) =>
    request(`/theaters/${id}`),

  createTheater: (data) =>
    request('/theaters', { method: 'POST', body: JSON.stringify(data) }),

  updateTheater: (id, data) =>
    request(`/theaters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteTheater: (id) =>
    request(`/theaters/${id}`, { method: 'DELETE' }),

  // Movies
  getMovies: () =>
    request('/movies'),

  getMovie: (id) =>
    request(`/movies/${id}`),

  createMovie: (data) =>
    request('/movies', { method: 'POST', body: JSON.stringify(data) }),

  updateMovie: (id, data) =>
    request(`/movies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteMovie: (id) =>
    request(`/movies/${id}`, { method: 'DELETE' }),

  // Shows
  getShows: () =>
    request('/shows'),

  getShow: (id) =>
    request(`/shows/${id}`),

  getShowBySlug: (slug) =>
    request(`/shows/slug/${slug}`),

  getShowSeats: (id) =>
    request(`/shows/${id}/seats`),

  createShow: (data) =>
    request('/shows', { method: 'POST', body: JSON.stringify(data) }),

  updateShow: (id, data) =>
    request(`/shows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteShow: (id) =>
    request(`/shows/${id}`, { method: 'DELETE' }),

  // Bookings
  createBooking: (data) =>
    request('/bookings', { method: 'POST', body: JSON.stringify(data) }),

  getShowBookings: (showId) =>
    request(`/bookings/${showId}`),

  getAllBookings: () =>
    request('/bookings/all'),

  cancelBooking: (id) =>
    request(`/bookings/${id}/cancel`, { method: 'POST' }),

  blockSeats: (showId, seats) =>
    request(`/bookings/${showId}/block-seats`, { method: 'POST', body: JSON.stringify({ seats }) }),

  // SMS
  getSmsLogs: () =>
    request('/sms'),

  retrySms: (bookingId) =>
    request(`/sms/retry/${bookingId}`, { method: 'POST' }),

  // Stats
  getStats: () =>
    request('/stats'),
};
