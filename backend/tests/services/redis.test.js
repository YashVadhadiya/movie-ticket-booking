import { describe, it, expect, vi, beforeEach } from 'vitest';

const store = new Map();
const sets = new Map();
let scriptSha = 'mock-sha-evalsha';
let scriptLoadCalled = false;

class MockRedis {
  constructor() { this.status = 'ready'; }
  on() {}
  async connect() {}
  async hset(key, field, value) {
    if (!store.has(key)) store.set(key, {});
    const obj = store.get(key);
    if (typeof field === 'object' && value === undefined) Object.assign(obj, field);
    else obj[field] = value;
    return 1;
  }
  async hgetall(key) { return store.get(key) || null; }
  async sadd(key, ...members) {
    if (!sets.has(key)) sets.set(key, new Set());
    for (const m of members) sets.get(key).add(m);
    return members.length;
  }
  async smembers(key) { const s = sets.get(key); return s ? [...s] : []; }
  async srem(key, ...members) {
    const s = sets.get(key); if (!s) return 0; let c = 0;
    for (const m of members) { if (s.delete(m)) c++; }
    return c;
  }
  async sismember(key, member) { const s = sets.get(key); return s && s.has(member) ? 1 : 0; }
  async del(...keys) { let c = 0; for (const k of keys) { if (store.delete(k) || sets.delete(k)) c++; } return c; }
  async get(key) { const v = store.get(key); return v !== undefined ? String(v) : null; }
  async set(key, value, ...args) { store.set(key, value); return 'OK'; }
  async expire() { return 1; }
  async exists(key) { return store.has(key) || sets.has(key) ? 1 : 0; }
  async script(command, ...args) { scriptLoadCalled = command === 'LOAD'; return scriptSha; }
  async evalsha(sha, numKeys, ...args) {
    const availableKey = args[0], bookedKey = args[1];
    const bookingKey = args[2], bookingsSetKey = args[3];
    const seatsJson = args[4], bookingId = args[5];
    const customerName = args[6], mobile = args[7];
    const totalAmount = args[8], showId = args[9], createdAt = args[10];
    const seats = JSON.parse(seatsJson);
    const availableSet = sets.get(availableKey);
    for (const seat of seats) {
      if (!availableSet || !availableSet.has(seat)) return [-1, seat];
    }
    for (const seat of seats) {
      const s = sets.get(availableKey); if (s) s.delete(seat);
      if (!sets.has(bookedKey)) sets.set(bookedKey, new Set());
      sets.get(bookedKey).add(seat);
    }
    // Simulate HSET for booking record
    store.set(bookingKey, {
      showId, customerName, mobile,
      seats: seatsJson, totalAmount,
      status: 'confirmed', createdAt: createdAt || new Date().toISOString()
    });
    // Simulate SADD for bookings set
    if (!sets.has(bookingsSetKey)) sets.set(bookingsSetKey, new Set());
    sets.get(bookingsSetKey).add(bookingId);
    return [0, bookingId];
  }
  static reset() { store.clear(); sets.clear(); scriptLoadCalled = false; }
  static getScriptLoadCalled() { return scriptLoadCalled; }
}

vi.mock('ioredis', () => ({ default: MockRedis }));

let redis;

beforeEach(async () => {
  MockRedis.reset();
  vi.resetModules();
  redis = await import('../../src/services/redis.js');
});

describe('Redis Service - Theaters', () => {
  it('should create and get a theater', async () => {
    const layout = { rows: [{ id: 'A', seats: [{ id: 'A1' }, { id: 'A2' }] }], screen: { position: 'top' } };
    await redis.createTheater('th1', { name: 'Test Theater', location: 'Downtown', seatLayout: layout });
    const theater = await redis.getTheater('th1');
    expect(theater).not.toBeNull();
    expect(theater.id).toBe('th1');
    expect(theater.name).toBe('Test Theater');
    expect(theater.location).toBe('Downtown');
    expect(theater.seatLayout).toEqual(layout);
    expect(theater.active).toBe(true);
  });

  it('should list theaters', async () => {
    await redis.createTheater('th1', { name: 'Theater A' });
    await redis.createTheater('th2', { name: 'Theater B' });
    const theaters = await redis.listTheaters();
    expect(theaters).toHaveLength(2);
    expect(theaters.map(t => t.name)).toContain('Theater A');
    expect(theaters.map(t => t.name)).toContain('Theater B');
  });

  it('should update a theater', async () => {
    await redis.createTheater('th1', { name: 'Old Name', location: 'Old Loc' });
    await redis.updateTheater('th1', { name: 'New Name', location: 'New Loc' });
    const theater = await redis.getTheater('th1');
    expect(theater.name).toBe('New Name');
    expect(theater.location).toBe('New Loc');
  });

  it('should delete a theater', async () => {
    await redis.createTheater('th1', { name: 'To Delete' });
    await redis.deleteTheater('th1');
    const theater = await redis.getTheater('th1');
    expect(theater).toBeNull();
    const theaters = await redis.listTheaters();
    expect(theaters).toHaveLength(0);
  });

  it('should return null for non-existent theater', async () => {
    const theater = await redis.getTheater('nonexistent');
    expect(theater).toBeNull();
  });

  it('should default location to empty string', async () => {
    await redis.createTheater('th1', { name: 'No Location' });
    const theater = await redis.getTheater('th1');
    expect(theater.location).toBe('');
  });
});

describe('Redis Service - Movies', () => {
  it('should create and get a movie', async () => {
    await redis.createMovie('mv1', {
      title: 'Test Movie',
      poster: 'http://example.com/poster.jpg',
      duration: 120,
      language: 'English',
      description: 'A test movie',
    });
    const movie = await redis.getMovie('mv1');
    expect(movie).not.toBeNull();
    expect(movie.id).toBe('mv1');
    expect(movie.title).toBe('Test Movie');
    expect(movie.duration).toBe(120);
    expect(movie.language).toBe('English');
    expect(movie.description).toBe('A test movie');
    expect(movie.active).toBe(true);
  });

  it('should list movies', async () => {
    await redis.createMovie('mv1', { title: 'Movie 1' });
    await redis.createMovie('mv2', { title: 'Movie 2' });
    const movies = await redis.listMovies();
    expect(movies).toHaveLength(2);
  });

  it('should update a movie', async () => {
    await redis.createMovie('mv1', { title: 'Old' });
    await redis.updateMovie('mv1', { title: 'New', duration: 150 });
    const movie = await redis.getMovie('mv1');
    expect(movie.title).toBe('New');
    expect(movie.duration).toBe(150);
  });

  it('should delete a movie', async () => {
    await redis.createMovie('mv1', { title: 'To Delete' });
    await redis.deleteMovie('mv1');
    const movie = await redis.getMovie('mv1');
    expect(movie).toBeNull();
  });

  it('should default duration to 0', async () => {
    await redis.createMovie('mv1', { title: 'No Duration' });
    const movie = await redis.getMovie('mv1');
    expect(movie.duration).toBe(0);
  });

  it('should handle empty optional fields', async () => {
    await redis.createMovie('mv1', { title: 'Minimal' });
    const movie = await redis.getMovie('mv1');
    expect(movie.poster).toBe('');
    expect(movie.youtube).toBe('');
    expect(movie.language).toBe('');
    expect(movie.description).toBe('');
  });
});

describe('Redis Service - Shows', () => {
  beforeEach(async () => {
    await redis.createTheater('th1', {
      name: 'Test Theater',
      seatLayout: {
        rows: [
          { id: 'A', seats: [{ id: 'A1' }, { id: 'A2' }, { id: 'A3', blocked: true }] },
          { id: 'B', seats: [{ id: 'B1' }] },
        ],
        screen: { position: 'top' },
      },
    });
    await redis.createMovie('mv1', { title: 'Test Movie' });
  });

  it('should create a show with seats from theater layout', async () => {
    const result = await redis.createShow('sh1', {
      theaterId: 'th1',
      movieId: 'mv1',
      showDate: '2025-12-25',
      showTime: '18:00',
      price: 10,
      slug: 'test-slug',
    });
    expect(result.id).toBe('sh1');
    expect(result.slug).toBe('test-slug');

    const show = await redis.getShow('sh1');
    expect(show).not.toBeNull();
    expect(show.theaterId).toBe('th1');
    expect(show.movieId).toBe('mv1');
    expect(show.price).toBe(10);

    const seats = await redis.getShowSeats('sh1');
    expect(seats.available).toContain('A1');
    expect(seats.available).toContain('A2');
    expect(seats.available).toContain('B1');
    expect(seats.available).not.toContain('A3');
    expect(seats.booked).toEqual([]);
  });

  it('should get show by slug', async () => {
    await redis.createShow('sh1', {
      theaterId: 'th1', movieId: 'mv1',
      showDate: '2025-12-25', showTime: '18:00',
      slug: 'my-slug',
    });
    const show = await redis.getShowBySlug('my-slug');
    expect(show).not.toBeNull();
    expect(show.id).toBe('sh1');
  });

  it('should return null for non-existent slug', async () => {
    const show = await redis.getShowBySlug('nonexistent');
    expect(show).toBeNull();
  });

  it('should list all shows', async () => {
    await redis.createShow('sh1', { theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00', slug: 's1' });
    await redis.createShow('sh2', { theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-26', showTime: '20:00', slug: 's2' });
    const shows = await redis.listShows();
    expect(shows).toHaveLength(2);
  });

  it('should update a show', async () => {
    await redis.createShow('sh1', { theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00', price: 10, slug: 's1' });
    await redis.updateShow('sh1', { price: 15, status: 'cancelled' });
    const show = await redis.getShow('sh1');
    expect(show.price).toBe(15);
    expect(show.status).toBe('cancelled');
  });

  it('should delete a show and its related data', async () => {
    await redis.createShow('sh1', { theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00', slug: 'del-slug' });
    const deleted = await redis.deleteShow('sh1');
    expect(deleted).toBe(true);
    const show = await redis.getShow('sh1');
    expect(show).toBeNull();
    const slugShow = await redis.getShowBySlug('del-slug');
    expect(slugShow).toBeNull();
  });

  it('should return false when deleting non-existent show', async () => {
    const deleted = await redis.deleteShow('nonexistent');
    expect(deleted).toBe(false);
  });
});

describe('Redis Service - Bookings', () => {
  beforeEach(async () => {
    await redis.createTheater('th1', {
      name: 'Test Theater',
      seatLayout: { rows: [{ id: 'A', seats: [{ id: 'A1' }, { id: 'A2' }, { id: 'A3' }] }], screen: { position: 'top' } },
    });
    await redis.createMovie('mv1', { title: 'Test Movie' });
    await redis.createShow('sh1', { theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00', price: 10, slug: 'b-slug' });
  });

  it('should create a booking atomically', async () => {
    const result = await redis.createBooking('bk1', 'sh1', ['A1', 'A2'], 'John Doe', '1234567890', 20);
    expect(result.success).toBe(true);

    const booking = await redis.getBooking('bk1');
    expect(booking).not.toBeNull();
    expect(booking.customerName).toBe('John Doe');
    expect(booking.mobile).toBe('1234567890');
    expect(booking.seats).toEqual(['A1', 'A2']);
    expect(booking.totalAmount).toBe(20);
    expect(booking.status).toBe('confirmed');

    const seats = await redis.getShowSeats('sh1');
    expect(seats.available).not.toContain('A1');
    expect(seats.available).not.toContain('A2');
    expect(seats.booked).toContain('A1');
    expect(seats.booked).toContain('A2');
    expect(seats.available).toContain('A3');
  });

  it('should reject booking when seats are already taken', async () => {
    await redis.createBooking('bk1', 'sh1', ['A1'], 'John', '123', 10);
    const result = await redis.createBooking('bk2', 'sh1', ['A1', 'A2'], 'Jane', '456', 20);
    expect(result.success).toBe(false);
    expect(result.conflictedSeat).toBe('A1');
  });

  it('should list bookings for a show', async () => {
    await redis.createBooking('bk1', 'sh1', ['A1'], 'John', '123', 10);
    await redis.createBooking('bk2', 'sh1', ['A2'], 'Jane', '456', 10);
    const bookings = await redis.getShowBookings('sh1');
    expect(bookings).toHaveLength(2);
  });

  it('should cancel a booking and free seats', async () => {
    await redis.createBooking('bk1', 'sh1', ['A1'], 'John', '123', 10);
    const cancelled = await redis.cancelBooking('bk1');
    expect(cancelled).toBe(true);

    const booking = await redis.getBooking('bk1');
    expect(booking.status).toBe('cancelled');

    const seats = await redis.getShowSeats('sh1');
    expect(seats.available).toContain('A1');
    expect(seats.booked).not.toContain('A1');
  });

  it('should return false when cancelling non-existent booking', async () => {
    const result = await redis.cancelBooking('nonexistent');
    expect(result).toBe(false);
  });

  it('should block seats making them unavailable', async () => {
    await redis.markSeatsUnavailable('sh1', ['A1', 'A3']);
    const seats = await redis.getShowSeats('sh1');
    expect(seats.available).not.toContain('A1');
    expect(seats.booked).toContain('A1');
    expect(seats.available).not.toContain('A3');
    expect(seats.booked).toContain('A3');
    expect(seats.available).toContain('A2');
  });

  it('should get all bookings across shows', async () => {
    await redis.createTheater('th2', { name: 'Theater 2', seatLayout: { rows: [{ id: 'A', seats: [{ id: 'A1' }] }], screen: { position: 'top' } } });
    await redis.createShow('sh2', { theaterId: 'th2', movieId: 'mv1', showDate: '2025-12-26', showTime: '20:00', price: 15, slug: 'b-slug2' });
    await redis.createBooking('bk1', 'sh1', ['A1'], 'John', '123', 10);
    await redis.createBooking('bk2', 'sh2', ['A1'], 'Jane', '456', 15);
    const all = await redis.getAllBookings();
    expect(all).toHaveLength(2);
  });
});

describe('Redis Service - SMS Logs', () => {
  it('should create and list SMS logs', async () => {
    await redis.createSmsLog('log1', {
      bookingId: 'bk1',
      mobile: '1234567890',
      message: 'Test message',
      status: 'sent',
    });
    const logs = await redis.listSmsLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].bookingId).toBe('bk1');
    expect(logs[0].message).toBe('Test message');
    expect(logs[0].status).toBe('sent');
  });

  it('should update SMS log status', async () => {
    await redis.createSmsLog('log1', { bookingId: 'bk1', mobile: '123', message: 'Test', status: 'pending' });
    await redis.updateSmsLog('log1', 'delivered', { msgId: 'xyz' });
    const logs = await redis.listSmsLogs();
    expect(logs[0].status).toBe('delivered');
    expect(logs[0].providerResponse).toEqual({ msgId: 'xyz' });
  });
});

describe('Redis Service - Booking Lua Script', () => {
  it('should load the Lua script on first booking', async () => {
    await redis.createTheater('th1', { name: 'T', seatLayout: { rows: [{ id: 'A', seats: [{ id: 'A1' }] }], screen: { position: 'top' } } });
    await redis.createMovie('mv1', { title: 'M' });
    await redis.createShow('sh1', { theaterId: 'th1', movieId: 'mv1', showDate: '2025-12-25', showTime: '18:00', price: 10, slug: 'l-slug' });

    const { default: MockRedis } = await import('ioredis');
    expect(MockRedis.getScriptLoadCalled()).toBe(false);

    await redis.createBooking('bk1', 'sh1', ['A1'], 'John', '123', 10);

    expect(MockRedis.getScriptLoadCalled()).toBe(true);
  });
});
