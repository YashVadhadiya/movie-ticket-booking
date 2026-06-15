import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const bookingsStore = {};
const showsStore = {};
const theatersStore = {};
const moviesStore = {};
const smsLogsStore = {};

const redisService = {
  createBooking: vi.fn(async (bookingId, showId, seats, customerName, mobile, totalAmount) => {
    bookingsStore[bookingId] = { id: bookingId, showId, seats, customerName, mobile, totalAmount, status: 'confirmed', createdAt: new Date().toISOString() };
    return { success: true, bookingId };
  }),
  getBooking: vi.fn(async (id) => bookingsStore[id] || null),
  getShowBookings: vi.fn(async (showId) => Object.values(bookingsStore).filter(b => b.showId === showId)),
  getAllBookings: vi.fn(async () => Object.values(bookingsStore)),
  getShow: vi.fn(async (id) => showsStore[id] || null),
  getTheater: vi.fn(async (id) => theatersStore[id] || null),
  getMovie: vi.fn(async (id) => moviesStore[id] || null),
  cancelBooking: vi.fn(async (bookingId) => {
    if (!bookingsStore[bookingId]) return false;
    bookingsStore[bookingId].status = 'cancelled';
    return true;
  }),
  markSeatsUnavailable: vi.fn(async (showId, seats) => {}),
  createSmsLog: vi.fn(async (id, data) => {
    smsLogsStore[id] = { id, ...data, createdAt: new Date().toISOString() };
    return id;
  }),
  updateSmsLog: vi.fn(async () => {}),
};

vi.mock('../../src/services/redis.js', () => redisService);

let app;
let token;

beforeEach(async () => {
  vi.clearAllMocks();
  Object.keys(bookingsStore).forEach(k => delete bookingsStore[k]);
  Object.keys(showsStore).forEach(k => delete showsStore[k]);
  Object.keys(theatersStore).forEach(k => delete theatersStore[k]);
  Object.keys(moviesStore).forEach(k => delete moviesStore[k]);
  Object.keys(smsLogsStore).forEach(k => delete smsLogsStore[k]);
  showsStore['sh1'] = { id: 'sh1', theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00', price: 10 };
  theatersStore['th1'] = { id: 'th1', name: 'Test Theater' };
  moviesStore['mv1'] = { id: 'mv1', title: 'Test Movie' };
  vi.resetModules();
  app = (await import('../../src/app.js')).default;
  const jwt = (await import('jsonwebtoken')).default;
  token = jwt.sign({ username: 'admin', role: 'admin' }, 'test-secret');
});

describe('Bookings API', () => {
  describe('POST /api/bookings', () => {
    it('should create a booking', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({ showId: 'sh1', seats: ['A1', 'A2'], customerName: 'John Doe', mobile: '1234567890' });
      expect(res.status).toBe(201);
      expect(res.body.customerName).toBe('John Doe');
      expect(res.body.seats).toEqual(['A1', 'A2']);
      expect(res.body.totalAmount).toBe(20);
      expect(res.body.whatsappUrl).toBeDefined();
    });

    it('should reject missing showId', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({ seats: ['A1'], customerName: 'John', mobile: '123' });
      expect(res.status).toBe(400);
    });

    it('should reject missing seats', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({ showId: 'sh1', customerName: 'John', mobile: '123' });
      expect(res.status).toBe(400);
    });

    it('should reject missing customerName or mobile', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({ showId: 'sh1', seats: ['A1'], customerName: 'John' });
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent show', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({ showId: 'nonexistent', seats: ['A1'], customerName: 'John', mobile: '123' });
      expect(res.status).toBe(404);
    });

    it('should handle seat conflict', async () => {
      redisService.createBooking.mockImplementationOnce(async (bookingId, showId, seats) => {
        return { success: false, conflictedSeat: seats[0] };
      });
      const res = await request(app)
        .post('/api/bookings')
        .send({ showId: 'sh1', seats: ['A1'], customerName: 'John', mobile: '123' });
      expect(res.status).toBe(409);
      expect(res.body.error).toContain('no longer available');
    });
  });

  describe('GET /api/bookings/all', () => {
    it('should list all bookings (auth required)', async () => {
      bookingsStore['bk1'] = { id: 'bk1', showId: 'sh1', customerName: 'John', seats: ['A1'], status: 'confirmed' };
      bookingsStore['bk2'] = { id: 'bk2', showId: 'sh1', customerName: 'Jane', seats: ['A2'], status: 'confirmed' };
      const res = await request(app).get('/api/bookings/all').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should require auth', async () => {
      const res = await request(app).get('/api/bookings/all');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/bookings/:showId', () => {
    it('should list bookings for a show', async () => {
      bookingsStore['bk1'] = { id: 'bk1', showId: 'sh1', customerName: 'John', seats: ['A1'], status: 'confirmed' };
      const res = await request(app).get('/api/bookings/sh1').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.bookings).toHaveLength(1);
      expect(res.body.show).toBeDefined();
    });

    it('should require auth', async () => {
      const res = await request(app).get('/api/bookings/sh1');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/bookings/:id/cancel', () => {
    it('should cancel a booking', async () => {
      bookingsStore['bk1'] = { id: 'bk1', showId: 'sh1', customerName: 'John', seats: ['A1'], status: 'confirmed' };
      const res = await request(app).post('/api/bookings/bk1/cancel').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent booking', async () => {
      const res = await request(app).post('/api/bookings/nonexistent/cancel').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('should require auth', async () => {
      const res = await request(app).post('/api/bookings/bk1/cancel');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/bookings/:showId/block-seats', () => {
    it('should block seats', async () => {
      const res = await request(app).post('/api/bookings/sh1/block-seats').set('Authorization', `Bearer ${token}`).send({ seats: ['A1', 'A3'] });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require seats array', async () => {
      const res = await request(app).post('/api/bookings/sh1/block-seats').set('Authorization', `Bearer ${token}`).send({});
      expect(res.status).toBe(400);
    });
  });
});
