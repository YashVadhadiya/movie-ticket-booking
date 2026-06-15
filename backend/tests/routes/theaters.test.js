import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const mockTheaters = {};
let nextId = 1;

const redisService = {
  createTheater: vi.fn(async (id, data) => {
    mockTheaters[id] = { id, name: data.name, location: data.location || '', seatLayout: data.seatLayout || { rows: [], screen: { position: 'top' } }, active: true, createdAt: new Date().toISOString() };
    return id;
  }),
  getTheater: vi.fn(async (id) => mockTheaters[id] || null),
  updateTheater: vi.fn(async (id, data) => {
    if (mockTheaters[id]) {
      if (data.name !== undefined) mockTheaters[id].name = data.name;
      if (data.location !== undefined) mockTheaters[id].location = data.location;
      if (data.seatLayout !== undefined) mockTheaters[id].seatLayout = data.seatLayout;
      if (data.active !== undefined) mockTheaters[id].active = data.active;
    }
  }),
  listTheaters: vi.fn(async () => Object.values(mockTheaters)),
  deleteTheater: vi.fn(async (id) => { delete mockTheaters[id]; }),
};

vi.mock('../../src/services/redis.js', () => redisService);

let app;
let token;

beforeEach(async () => {
  vi.clearAllMocks();
  Object.keys(mockTheaters).forEach(k => delete mockTheaters[k]);
  vi.resetModules();
  // Re-import after reset
  app = (await import('../../src/app.js')).default;
  const jwt = (await import('jsonwebtoken')).default;
  token = jwt.sign({ username: 'admin', role: 'admin' }, 'test-secret');
});

describe('Theaters API', () => {
  describe('POST /api/theaters', () => {
    it('should create a theater', async () => {
      const res = await request(app)
        .post('/api/theaters')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Grand Theater', location: 'Downtown' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Grand Theater');
      expect(res.body.location).toBe('Downtown');
    });

    it('should require name', async () => {
      const res = await request(app)
        .post('/api/theaters')
        .set('Authorization', `Bearer ${token}`)
        .send({ location: 'Downtown' });
      expect(res.status).toBe(400);
    });

    it('should require auth', async () => {
      const res = await request(app)
        .post('/api/theaters')
        .send({ name: 'Grand Theater' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/theaters', () => {
    it('should list theaters', async () => {
      await request(app).post('/api/theaters').set('Authorization', `Bearer ${token}`).send({ name: 'T1' });
      await request(app).post('/api/theaters').set('Authorization', `Bearer ${token}`).send({ name: 'T2' });
      const res = await request(app).get('/api/theaters').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should require auth', async () => {
      const res = await request(app).get('/api/theaters');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/theaters/:id', () => {
    it('should get a theater by id', async () => {
      const createRes = await request(app).post('/api/theaters').set('Authorization', `Bearer ${token}`).send({ name: 'T1' });
      const res = await request(app).get(`/api/theaters/${createRes.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('T1');
    });

    it('should return 404 for non-existent theater', async () => {
      const res = await request(app).get('/api/theaters/nonexistent');
      expect(res.status).toBe(404);
    });

    it('should be public (no auth required)', async () => {
      const createRes = await request(app).post('/api/theaters').set('Authorization', `Bearer ${token}`).send({ name: 'T1' });
      const res = await request(app).get(`/api/theaters/${createRes.body.id}`);
      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/theaters/:id', () => {
    it('should update a theater', async () => {
      const createRes = await request(app).post('/api/theaters').set('Authorization', `Bearer ${token}`).send({ name: 'Old Name' });
      const res = await request(app).put(`/api/theaters/${createRes.body.id}`).set('Authorization', `Bearer ${token}`).send({ name: 'New Name' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Name');
    });

    it('should return 404 for non-existent theater', async () => {
      const res = await request(app).put('/api/theaters/nonexistent').set('Authorization', `Bearer ${token}`).send({ name: 'New' });
      expect(res.status).toBe(404);
    });

    it('should require auth', async () => {
      const res = await request(app).put('/api/theaters/some-id').send({ name: 'New' });
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/theaters/:id', () => {
    it('should delete a theater', async () => {
      const createRes = await request(app).post('/api/theaters').set('Authorization', `Bearer ${token}`).send({ name: 'To Delete' });
      const res = await request(app).delete(`/api/theaters/${createRes.body.id}`).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require auth', async () => {
      const res = await request(app).delete('/api/theaters/some-id');
      expect(res.status).toBe(401);
    });
  });
});
