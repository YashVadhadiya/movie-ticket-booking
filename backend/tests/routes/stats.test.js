import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const showsStore = {};
const theatersStore = {};
const moviesStore = {};
const bookingsStore = {};

const redisService = {
  listShows: vi.fn(async () => Object.values(showsStore)),
  listTheaters: vi.fn(async () => Object.values(theatersStore)),
  listMovies: vi.fn(async () => Object.values(moviesStore)),
  getAllBookings: vi.fn(async () => Object.values(bookingsStore)),
  getShowSeats: vi.fn(async (showId) => {
    if (showId === 'sh1') return { available: ['A2'], booked: ['A1'] };
    return { available: ['A1', 'A2', 'B1'], booked: [] };
  }),
};

vi.mock('../../src/services/redis.js', () => redisService);

let app;
let token;

beforeEach(async () => {
  vi.clearAllMocks();
  Object.keys(showsStore).forEach(k => delete showsStore[k]);
  Object.keys(theatersStore).forEach(k => delete theatersStore[k]);
  Object.keys(moviesStore).forEach(k => delete moviesStore[k]);
  Object.keys(bookingsStore).forEach(k => delete bookingsStore[k]);
  vi.resetModules();
  app = (await import('../../src/app.js')).default;
  const jwt = (await import('jsonwebtoken')).default;
  token = jwt.sign({ username: 'admin', role: 'admin' }, 'test-secret');
});

describe('Stats API', () => {
  it('should return dashboard statistics', async () => {
    showsStore['sh1'] = { id: 'sh1', theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00', price: 10 };
    showsStore['sh2'] = { id: 'sh2', theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-26', showTime: '20:00', price: 15 };
    theatersStore['th1'] = { id: 'th1', name: 'T1' };
    moviesStore['mv1'] = { id: 'mv1', title: 'M1' };
    bookingsStore['bk1'] = { id: 'bk1', showId: 'sh1', totalAmount: 10, status: 'confirmed' };
    bookingsStore['bk2'] = { id: 'bk2', showId: 'sh2', totalAmount: 15, status: 'confirmed' };

    const res = await request(app).get('/api/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.totalShows).toBe(2);
    expect(res.body.totalTheaters).toBe(1);
    expect(res.body.totalMovies).toBe(1);
    expect(res.body.totalBookings).toBe(2);
    expect(res.body.totalRevenue).toBe(25);
    expect(res.body.seatsBooked).toBe(1);
  });

  it('should exclude cancelled bookings from revenue', async () => {
    showsStore['sh1'] = { id: 'sh1', theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00', price: 10 };
    theatersStore['th1'] = { id: 'th1', name: 'T1' };
    moviesStore['mv1'] = { id: 'mv1', title: 'M1' };
    bookingsStore['bk1'] = { id: 'bk1', showId: 'sh1', totalAmount: 10, status: 'confirmed' };
    bookingsStore['bk2'] = { id: 'bk2', showId: 'sh1', totalAmount: 10, status: 'cancelled' };

    const res = await request(app).get('/api/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.totalBookings).toBe(1);
    expect(res.body.totalRevenue).toBe(10);
  });

  it('should return zeros when no data exists', async () => {
    const res = await request(app).get('/api/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.totalShows).toBe(0);
    expect(res.body.totalTheaters).toBe(0);
    expect(res.body.totalMovies).toBe(0);
    expect(res.body.totalBookings).toBe(0);
    expect(res.body.totalRevenue).toBe(0);
    expect(res.body.occupancyRate).toBe(0);
  });

  it('should require auth', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(401);
  });
});
