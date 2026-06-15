import { Router } from 'express';
import { listShows, listTheaters, listMovies, getAllBookings, getShowSeats, getShow } from '../services/redis.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const [shows, theaters, movies, bookings] = await Promise.all([
      listShows(), listTheaters(), listMovies(), getAllBookings(),
    ]);

    const totalSeats = { available: 0, booked: 0 };
    for (const show of shows) {
      const seats = await getShowSeats(show.id);
      totalSeats.available += (seats.available || []).length;
      totalSeats.booked += (seats.booked || []).length;
    }

    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const totalCapacity = totalSeats.available + totalSeats.booked;
    const occupancyRate = totalCapacity > 0 ? Math.round((totalSeats.booked / totalCapacity) * 100) : 0;

    res.json({
      totalShows: shows.length,
      totalTheaters: theaters.length,
      totalMovies: movies.length,
      totalBookings: confirmedBookings.length,
      totalRevenue,
      occupancyRate,
      seatsAvailable: totalSeats.available,
      seatsBooked: totalSeats.booked,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
