import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const smsLogsStore = {};
const bookingsStore = {};
const showsStore = {};
const theatersStore = {};
const moviesStore = {};

const redisService = {
  listSmsLogs: vi.fn(async () => Object.values(smsLogsStore)),
  getBooking: vi.fn(async (id) => bookingsStore[id] || null),
  getShow: vi.fn(async (id) => showsStore[id] || null),
  getTheater: vi.fn(async (id) => theatersStore[id] || null),
  getMovie: vi.fn(async (id) => moviesStore[id] || null),
  createSmsLog: vi.fn(async (id, data) => {
    smsLogsStore[id] = { id, ...data, createdAt: new Date().toISOString() };
    return id;
  }),
};

vi.mock('../../src/services/redis.js', () => redisService);

let app;
let token;

beforeEach(async () => {
  vi.clearAllMocks();
  Object.keys(smsLogsStore).forEach(k => delete smsLogsStore[k]);
  Object.keys(bookingsStore).forEach(k => delete bookingsStore[k]);
  Object.keys(showsStore).forEach(k => delete showsStore[k]);
  Object.keys(theatersStore).forEach(k => delete theatersStore[k]);
  Object.keys(moviesStore).forEach(k => delete moviesStore[k]);
  bookingsStore['bk1'] = { id: 'bk1', showId: 'sh1', customerName: 'John', mobile: '1234567890', seats: ['A1'], status: 'confirmed' };
  showsStore['sh1'] = { id: 'sh1', theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00' };
  theatersStore['th1'] = { id: 'th1', name: 'Test Theater' };
  moviesStore['mv1'] = { id: 'mv1', title: 'Test Movie' };
  vi.resetModules();
  app = (await import('../../src/app.js')).default;
  const jwt = (await import('jsonwebtoken')).default;
  token = jwt.sign({ username: 'admin', role: 'admin' }, 'test-secret');
});

describe('SMS API', () => {
  describe('GET /api/sms', () => {
    it('should list SMS logs', async () => {
      smsLogsStore['log1'] = { id: 'log1', bookingId: 'bk1', mobile: '1234567890', message: 'Test', status: 'sent', createdAt: new Date().toISOString() };
      const res = await request(app).get('/api/sms').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('should require auth', async () => {
      const res = await request(app).get('/api/sms');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/sms/retry/:bookingId', () => {
    it('should retry WhatsApp notification', async () => {
      const res = await request(app).post('/api/sms/retry/bk1').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.whatsappUrl).toBeDefined();
      expect(res.body.message).toContain('Test Movie');
    });

    it('should return 404 for non-existent booking', async () => {
      const res = await request(app).post('/api/sms/retry/nonexistent').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('should require auth', async () => {
      const res = await request(app).post('/api/sms/retry/bk1');
      expect(res.status).toBe(401);
    });
  });
});
