import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const showsStore = {};
const theatersStore = {};
const moviesStore = {};

const redisService = {
  createShow: vi.fn(async (id, data) => {
    showsStore[id] = { id, theaterId: data.theaterId, movieId: data.movieId, showDate: data.showDate, showTime: data.showTime, price: parseFloat(data.price) || 0, slug: data.slug, status: 'active', createdAt: new Date().toISOString() };
    return { id, slug: data.slug };
  }),
  getShow: vi.fn(async (id) => showsStore[id] || null),
  getShowBySlug: vi.fn(async (slug) => {
    const show = Object.values(showsStore).find(s => s.slug === slug);
    return show || null;
  }),
  updateShow: vi.fn(async (id, data) => {
    if (showsStore[id]) Object.assign(showsStore[id], data);
  }),
  deleteShow: vi.fn(async (id) => {
    if (!showsStore[id]) return false;
    delete showsStore[id];
    return true;
  }),
  listShows: vi.fn(async () => Object.values(showsStore)),
  getShowSeats: vi.fn(async () => ({ available: ['A1', 'A2', 'B1'], booked: [] })),
  getTheater: vi.fn(async (id) => theatersStore[id] || null),
  getMovie: vi.fn(async (id) => moviesStore[id] || null),
};

vi.mock('../../src/services/redis.js', () => redisService);

let app;
let token;

beforeEach(async () => {
  vi.clearAllMocks();
  Object.keys(showsStore).forEach(k => delete showsStore[k]);
  Object.keys(theatersStore).forEach(k => delete theatersStore[k]);
  Object.keys(moviesStore).forEach(k => delete moviesStore[k]);
  theatersStore['th1'] = { id: 'th1', name: 'Test Theater', seatLayout: { rows: [] } };
  moviesStore['mv1'] = { id: 'mv1', title: 'Test Movie' };
  vi.resetModules();
  app = (await import('../../src/app.js')).default;
  const jwt = (await import('jsonwebtoken')).default;
  token = jwt.sign({ username: 'admin', role: 'admin' }, 'test-secret');
});

describe('Shows API', () => {
  describe('POST /api/shows', () => {
    it('should create a show', async () => {
      const res = await request(app)
        .post('/api/shows')
        .set('Authorization', `Bearer ${token}`)
        .send({ theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00', price: 10 });
      expect(res.status).toBe(201);
      expect(res.body.theaterId).toBe('th1');
      expect(res.body.movieId).toBe('mv1');
      expect(res.body.price).toBe(10);
    });

    it('should require required fields', async () => {
      const res = await request(app)
        .post('/api/shows')
        .set('Authorization', `Bearer ${token}`)
        .send({ theaterId: 'th1' });
      expect(res.status).toBe(400);
    });

    it('should require auth', async () => {
      const res = await request(app)
        .post('/api/shows')
        .send({ theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/shows', () => {
    it('should list shows with theater and movie names', async () => {
      showsStore['sh1'] = { id: 'sh1', theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00', price: 10, status: 'active' };
      const res = await request(app).get('/api/shows').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].theater).toBe('Test Theater');
      expect(res.body[0].movie).toBe('Test Movie');
    });

    it('should require auth', async () => {
      const res = await request(app).get('/api/shows');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/shows/slug/:slug', () => {
    it('should get show by slug with theater, movie, and seats', async () => {
      showsStore['sh1'] = { id: 'sh1', theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00', price: 10, slug: 'public-slug', status: 'active' };
      const res = await request(app).get('/api/shows/slug/public-slug');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('sh1');
      expect(res.body.theater).toBeDefined();
      expect(res.body.movie).toBeDefined();
      expect(res.body.seats).toBeDefined();
    });

    it('should return 404 for non-existent slug', async () => {
      const res = await request(app).get('/api/shows/slug/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/shows/:id', () => {
    it('should get a show by id', async () => {
      showsStore['sh1'] = { id: 'sh1', theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00', price: 10, status: 'active' };
      const res = await request(app).get('/api/shows/sh1');
      expect(res.status).toBe(200);
      expect(res.body.theater).toBeDefined();
      expect(res.body.movie).toBeDefined();
    });
  });

  describe('GET /api/shows/:id/seats', () => {
    it('should get seat availability', async () => {
      showsStore['sh1'] = { id: 'sh1', theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00', price: 10 };
      const res = await request(app).get('/api/shows/sh1/seats');
      expect(res.status).toBe(200);
      expect(res.body.available).toContain('A1');
    });

    it('should return 404 for non-existent show', async () => {
      const res = await request(app).get('/api/shows/nonexistent/seats');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/shows/:id', () => {
    it('should update a show', async () => {
      showsStore['sh1'] = { id: 'sh1', theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00', price: 10 };
      const res = await request(app).put('/api/shows/sh1').set('Authorization', `Bearer ${token}`).send({ price: 15 });
      expect(res.status).toBe(200);
      expect(res.body.price).toBe(15);
    });
  });

  describe('DELETE /api/shows/:id', () => {
    it('should delete a show', async () => {
      showsStore['sh1'] = { id: 'sh1', theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00', price: 10 };
      const res = await request(app).delete('/api/shows/sh1').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent show', async () => {
      const res = await request(app).delete('/api/shows/nonexistent').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
