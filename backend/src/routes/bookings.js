import { Router } from 'express';
import { nanoid } from 'nanoid';
import {
  createBooking, getBooking, getShowBookings, getAllBookings,
  getShow, getTheater, getMovie, cancelBooking, markSeatsUnavailable,
  createSmsLog, updateSmsLog
} from '../services/redis.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { showId, seats, customerName, mobile } = req.body;
    if (!showId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: 'showId and seats array are required' });
    }
    if (!customerName || !mobile) {
      return res.status(400).json({ error: 'customerName and mobile are required' });
    }

    const show = await getShow(showId);
    if (!show) return res.status(404).json({ error: 'Show not found' });

    const totalAmount = show.price * seats.length;
    const bookingId = nanoid(12);

    const result = await createBooking(bookingId, showId, seats, customerName, mobile, totalAmount);

    if (!result.success) {
      return res.status(409).json({
        error: 'Some seats are no longer available',
        conflictedSeat: result.conflictedSeat,
      });
    }

    const booking = await getBooking(bookingId);

    const theater = await getTheater(show.theaterId);
    const movie = await getMovie(show.movieId);

    const message = `Your ticket is confirmed for ${movie?.title || 'Movie'} on ${show.showDate} at ${show.showTime}. Seat(s): ${seats.join(', ')}. Booking ID: ${bookingId}. Thank you for booking with ${theater?.name || 'Theater'}.`;

    const smsLogId = nanoid(12);
    await createSmsLog(smsLogId, {
      bookingId,
      mobile,
      message,
      status: 'logged',
    });

    res.status(201).json({
      ...booking,
      theaterName: theater?.name || '',
      movieTitle: movie?.title || '',
      showDate: show.showDate,
      showTime: show.showTime,
      whatsappUrl: `https://wa.me/${mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`,
      message,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', authenticate, async (req, res) => {
  try {
    const bookings = await getAllBookings();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:showId', authenticate, async (req, res) => {
  try {
    const bookings = await getShowBookings(req.params.showId);
    const show = await getShow(req.params.showId);
    const theater = show ? await getTheater(show.theaterId) : null;
    const movie = show ? await getMovie(show.movieId) : null;
    res.json({ bookings, show: show ? { ...show, theater, movie } : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const success = await cancelBooking(req.params.id);
    if (!success) return res.status(404).json({ error: 'Booking not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:showId/block-seats', authenticate, async (req, res) => {
  try {
    const { seats } = req.body;
    if (!seats || !Array.isArray(seats)) {
      return res.status(400).json({ error: 'seats array is required' });
    }
    await markSeatsUnavailable(req.params.showId, seats);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
