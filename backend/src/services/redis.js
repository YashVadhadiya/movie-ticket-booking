import Redis from 'ioredis';
import { config } from '../config.js';

const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

export async function ensureConnected() {
  const status = redis.status;
  if (status === 'ready' || status === 'connected' || status === 'connecting') return;
  await redis.connect();
}

// --- Theater operations ---
export async function createTheater(id, data) {
  await redis.hset(`theater:${id}`, {
    name: data.name,
    location: data.location || '',
    seatLayout: JSON.stringify(data.seatLayout || { rows: [], screen: { position: 'top' } }),
    active: 'true',
    createdAt: new Date().toISOString(),
  });
  await redis.sadd('theaters', id);
  return id;
}

export async function getTheater(id) {
  const data = await redis.hgetall(`theater:${id}`);
  if (!data || !data.name) return null;
  return {
    id,
    name: data.name,
    location: data.location,
    seatLayout: JSON.parse(data.seatLayout || '{}'),
    active: data.active === 'true',
    createdAt: data.createdAt,
  };
}

export async function updateTheater(id, data) {
  const updates = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.location !== undefined) updates.location = data.location;
  if (data.seatLayout !== undefined) updates.seatLayout = JSON.stringify(data.seatLayout);
  if (data.active !== undefined) updates.active = data.active ? 'true' : 'false';
  if (Object.keys(updates).length > 0) await redis.hset(`theater:${id}`, updates);
}

export async function listTheaters() {
  const ids = await redis.smembers('theaters');
  const theaters = await Promise.all(ids.map((id) => getTheater(id)));
  return theaters.filter(Boolean);
}

export async function deleteTheater(id) {
  await redis.del(`theater:${id}`);
  await redis.srem('theaters', id);
}

// --- Movie operations ---
export async function createMovie(id, data) {
  await redis.hset(`movie:${id}`, {
    title: data.title,
    poster: data.poster || '',
    youtube: data.youtube || '',
    duration: String(data.duration || 0),
    language: data.language || '',
    description: data.description || '',
    active: 'true',
    createdAt: new Date().toISOString(),
  });
  await redis.sadd('movies', id);
  return id;
}

export async function getMovie(id) {
  const data = await redis.hgetall(`movie:${id}`);
  if (!data || !data.title) return null;
  return {
    id,
    title: data.title,
    poster: data.poster,
    youtube: data.youtube || '',
    duration: parseInt(data.duration) || 0,
    language: data.language,
    description: data.description,
    active: data.active === 'true',
    createdAt: data.createdAt,
  };
}

export async function updateMovie(id, data) {
  const updates = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.poster !== undefined) updates.poster = data.poster;
  if (data.youtube !== undefined) updates.youtube = data.youtube;
  if (data.duration !== undefined) updates.duration = String(data.duration);
  if (data.language !== undefined) updates.language = data.language;
  if (data.description !== undefined) updates.description = data.description;
  if (data.active !== undefined) updates.active = data.active ? 'true' : 'false';
  if (Object.keys(updates).length > 0) await redis.hset(`movie:${id}`, updates);
}

export async function listMovies() {
  const ids = await redis.smembers('movies');
  const movies = await Promise.all(ids.map((id) => getMovie(id)));
  return movies.filter(Boolean);
}

export async function deleteMovie(id) {
  await redis.del(`movie:${id}`);
  await redis.srem('movies', id);
}

// --- Show operations ---
export async function createShow(id, data) {
  const slug = data.slug || id;
  const ttl = 24 * 60 * 60;

  await redis.hset(`show:${id}`, {
    theaterId: data.theaterId,
    movieId: data.movieId,
    showDate: data.showDate,
    showTime: data.showTime,
    price: String(data.price || 0),
    slug,
    status: data.status || 'active',
    createdAt: new Date().toISOString(),
  });
  await redis.expire(`show:${id}`, ttl);

  await redis.set(`slug:${slug}`, id, 'EX', ttl);
  await redis.sadd('shows', id);

  const theater = await getTheater(data.theaterId);
  if (theater && theater.seatLayout && theater.seatLayout.rows) {
    const availableSeats = [];
    for (const row of theater.seatLayout.rows) {
      for (const seat of row.seats) {
        if (!seat.blocked) {
          availableSeats.push(seat.id);
        }
      }
    }
    if (availableSeats.length > 0) {
      await redis.sadd(`show:${id}:seats:available`, ...availableSeats);
      await redis.expire(`show:${id}:seats:available`, ttl);
    }
    await redis.expire(`show:${id}:seats:booked`, ttl);
  }

  return { id, slug };
}

export async function getShow(id) {
  const data = await redis.hgetall(`show:${id}`);
  if (!data || !data.theaterId) return null;
  return {
    id,
    theaterId: data.theaterId,
    movieId: data.movieId,
    showDate: data.showDate,
    showTime: data.showTime,
    price: parseFloat(data.price) || 0,
    slug: data.slug,
    status: data.status,
    createdAt: data.createdAt,
  };
}

export async function getShowBySlug(slug) {
  const id = await redis.get(`slug:${slug}`);
  if (!id) return null;
  const show = await getShow(id);
  if (show) show.id = id;
  return show;
}

export async function updateShow(id, data) {
  const updates = {};
  if (data.theaterId !== undefined) updates.theaterId = data.theaterId;
  if (data.movieId !== undefined) updates.movieId = data.movieId;
  if (data.showDate !== undefined) updates.showDate = data.showDate;
  if (data.showTime !== undefined) updates.showTime = data.showTime;
  if (data.price !== undefined) updates.price = String(data.price);
  if (data.status !== undefined) updates.status = data.status;
  if (Object.keys(updates).length > 0) await redis.hset(`show:${id}`, updates);
}

export async function listShows() {
  const ids = await redis.smembers('shows');
  const shows = await Promise.all(ids.map((id) => getShow(id)));
  return shows.filter(Boolean);
}

export async function deleteShow(id) {
  const show = await getShow(id);
  if (!show) return false;
  const ttl = 5;
  await redis.del(`show:${id}`);
  await redis.del(`slug:${show.slug}`);
  await redis.del(`show:${id}:seats:available`);
  await redis.del(`show:${id}:seats:booked`);
  const bookingIds = await redis.smembers(`show:${id}:bookings`);
  for (const bid of bookingIds) {
    await redis.del(`booking:${bid}`);
  }
  await redis.del(`show:${id}:bookings`);
  await redis.srem('shows', id);
  return true;
}

// --- Seat operations ---
export async function getShowSeats(showId) {
  const available = await redis.smembers(`show:${showId}:seats:available`);
  const booked = await redis.smembers(`show:${showId}:seats:booked`);
  return { available, booked };
}

// --- Atomic booking ---
const BOOKING_LUA_SCRIPT = `
local available_key = KEYS[1]
local booked_key = KEYS[2]
local booking_key = KEYS[3]
local bookings_set_key = KEYS[4]
local seats_json = ARGV[1]
local booking_id = ARGV[2]
local customer_name = ARGV[3]
local mobile = ARGV[4]
local total_amount = ARGV[5]
local show_id = ARGV[6]

local seats = cjson.decode(seats_json)

-- Check all seats are available
for i, seat in ipairs(seats) do
  local is_available = redis.call("SISMEMBER", available_key, seat)
  if is_available == 0 then
    return {-1, seat}
  end
end

-- Move seats from available to booked
for i, seat in ipairs(seats) do
  redis.call("SREM", available_key, seat)
  redis.call("SADD", booked_key, seat)
end

-- Create booking record
redis.call("HSET", booking_key,
  "showId", show_id,
  "customerName", customer_name,
  "mobile", mobile,
  "seats", seats_json,
  "totalAmount", total_amount,
  "status", "confirmed",
  "createdAt", ARGV[7]
)

-- Add to show's bookings set
redis.call("SADD", bookings_set_key, booking_id)

-- Set TTLs to 24 hours
redis.call("EXPIRE", available_key, 86400)
redis.call("EXPIRE", booked_key, 86400)
redis.call("EXPIRE", booking_key, 86400)
redis.call("EXPIRE", bookings_set_key, 86400)

return {0, booking_id}
`;

let bookingScriptSha = null;

async function getBookingScript() {
  if (!bookingScriptSha) {
    bookingScriptSha = await redis.script('LOAD', BOOKING_LUA_SCRIPT);
  }
  return bookingScriptSha;
}

export async function createBooking(bookingId, showId, seats, customerName, mobile, totalAmount) {
  const sha = await getBookingScript();
  const availableKey = `show:${showId}:seats:available`;
  const bookedKey = `show:${showId}:seats:booked`;
  const bookingKey = `booking:${bookingId}`;
  const bookingsSetKey = `show:${showId}:bookings`;

  try {
    const result = await redis.evalsha(
      sha,
      4,
      availableKey,
      bookedKey,
      bookingKey,
      bookingsSetKey,
      JSON.stringify(seats),
      bookingId,
      customerName,
      mobile,
      String(totalAmount),
      showId,
      new Date().toISOString()
    );

    if (result[0] === -1) {
      return { success: false, conflictedSeat: result[1] };
    }
    return { success: true, bookingId };
  } catch (err) {
    console.error('Booking Lua script error:', err);
    throw err;
  }
}

export async function getBooking(id) {
  const data = await redis.hgetall(`booking:${id}`);
  if (!data || !data.showId) return null;
  return {
    id,
    showId: data.showId,
    customerName: data.customerName,
    mobile: data.mobile,
    seats: JSON.parse(data.seats || '[]'),
    totalAmount: parseFloat(data.totalAmount) || 0,
    status: data.status,
    createdAt: data.createdAt,
  };
}

export async function getShowBookings(showId) {
  const ids = await redis.smembers(`show:${showId}:bookings`);
  const bookings = await Promise.all(ids.map((id) => getBooking(id)));
  return bookings.filter(Boolean);
}

export async function getAllBookings() {
  const showIds = await redis.smembers('shows');
  const allBookings = [];
  for (const showId of showIds) {
    const bookings = await getShowBookings(showId);
    allBookings.push(...bookings);
  }
  allBookings.sort((a, b) => {
    if (a.createdAt < b.createdAt) return 1;
    if (a.createdAt > b.createdAt) return -1;
    return 0;
  });
  return allBookings;
}

export async function cancelBooking(bookingId) {
  const booking = await getBooking(bookingId);
  if (!booking) return false;

  await redis.hset(`booking:${bookingId}`, 'status', 'cancelled');
  const showId = booking.showId;
  for (const seat of booking.seats) {
    await redis.srem(`show:${showId}:seats:booked`, seat);
    await redis.sadd(`show:${showId}:seats:available`, seat);
  }
  return true;
}

export async function markSeatsUnavailable(showId, seats) {
  for (const seat of seats) {
    await redis.srem(`show:${showId}:seats:available`, seat);
    await redis.sadd(`show:${showId}:seats:booked`, seat);
  }
}

// --- SMS log operations ---
export async function createSmsLog(id, data) {
  await redis.hset(`smslog:${id}`, {
    bookingId: data.bookingId,
    mobile: data.mobile,
    message: data.message,
    status: data.status || 'pending',
    createdAt: new Date().toISOString(),
  });
  await redis.sadd('smslogs', id);
  await redis.expire(`smslog:${id}`, 86400);
  return id;
}

export async function updateSmsLog(id, status, providerResponse) {
  await redis.hset(`smslog:${id}`, 'status', status);
  if (providerResponse) {
    await redis.hset(`smslog:${id}`, 'providerResponse', JSON.stringify(providerResponse));
  }
}

export async function listSmsLogs() {
  const ids = await redis.smembers('smslogs');
  const logs = await Promise.all(ids.map(async (id) => {
    const data = await redis.hgetall(`smslog:${id}`);
    if (!data) return null;
    return {
      id,
      bookingId: data.bookingId,
      mobile: data.mobile,
      message: data.message,
      status: data.status,
      providerResponse: data.providerResponse ? JSON.parse(data.providerResponse) : null,
      createdAt: data.createdAt,
    };
  }));
  return logs.filter(Boolean).sort((a, b) => {
    if (a.createdAt < b.createdAt) return 1;
    if (a.createdAt > b.createdAt) return -1;
    return 0;
  });
}

export default redis;
