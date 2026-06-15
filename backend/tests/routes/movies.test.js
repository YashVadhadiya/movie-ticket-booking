import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const mockMovies = {};

const redisService = {
  createMovie: vi.fn(async (id, data) => {
    mockMovies[id] = { id, title: data.title, poster: data.poster || '', youtube: data.youtube || '', duration: parseInt(data.duration) || 0, language: data.language || '', description: data.description || '', active: true, createdAt: new Date().toISOString() };
    return id;
  }),
  getMovie: vi.fn(async (id) => mockMovies[id] || null),
  updateMovie: vi.fn(async (id, data) => {
    if (mockMovies[id]) Object.assign(mockMovies[id], data);
  }),
  listMovies: vi.fn(async () => Object.values(mockMovies)),
  deleteMovie: vi.fn(async (id) => { delete mockMovies[id]; }),
};

vi.mock('../../src/services/redis.js', () => redisService);

let app;
let token;

beforeEach(async () => {
  vi.clearAllMocks();
  Object.keys(mockMovies).forEach(k => delete mockMovies[k]);
  vi.resetModules();
  app = (await import('../../src/app.js')).default;
  const jwt = (await import('jsonwebtoken')).default;
  token = jwt.sign({ username: 'admin', role: 'admin' }, 'test-secret');
});

describe('Movies API', () => {
  describe('POST /api/movies', () => {
    it('should create a movie', async () => {
      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Inception', duration: 148, language: 'English' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Inception');
      expect(res.body.duration).toBe(148);
      expect(res.body.language).toBe('English');
    });

    it('should require title', async () => {
      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${token}`)
        .send({ duration: 120 });
      expect(res.status).toBe(400);
    });

    it('should require auth', async () => {
      const res = await request(app)
        .post('/api/movies')
        .send({ title: 'Inception' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/movies', () => {
    it('should list movies (public)', async () => {
      await request(app).post('/api/movies').set('Authorization', `Bearer ${token}`).send({ title: 'M1' });
      await request(app).post('/api/movies').set('Authorization', `Bearer ${token}`).send({ title: 'M2' });
      const res = await request(app).get('/api/movies');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /api/movies/:id', () => {
    it('should get a movie by id', async () => {
      const createRes = await request(app).post('/api/movies').set('Authorization', `Bearer ${token}`).send({ title: 'M1' });
      const res = await request(app).get(`/api/movies/${createRes.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('M1');
    });

    it('should return 404 for non-existent movie', async () => {
      const res = await request(app).get('/api/movies/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/movies/:id', () => {
    it('should update a movie', async () => {
      const createRes = await request(app).post('/api/movies').set('Authorization', `Bearer ${token}`).send({ title: 'Old' });
      const res = await request(app).put(`/api/movies/${createRes.body.id}`).set('Authorization', `Bearer ${token}`).send({ title: 'New', duration: 150 });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New');
    });

    it('should return 404 for non-existent movie', async () => {
      const res = await request(app).put('/api/movies/nonexistent').set('Authorization', `Bearer ${token}`).send({ title: 'New' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/movies/:id', () => {
    it('should delete a movie', async () => {
      const createRes = await request(app).post('/api/movies').set('Authorization', `Bearer ${token}`).send({ title: 'To Delete' });
      const res = await request(app).delete(`/api/movies/${createRes.body.id}`).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require auth', async () => {
      const res = await request(app).delete('/api/movies/some-id');
      expect(res.status).toBe(401);
    });
  });
});
